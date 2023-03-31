<template>
	<q-btn-dropdown
		size="0.9rem"
		no-wrap
		no-caps
		flat
		icon="wallet"
		:class="hintCreateWallet ? 'theme-dropdown-button active' : 'theme-dropdown-button'"
		:label="selectedWalletLabel"
		content-class="theme-dropdown-button-list"
	>
		<q-list style="max-width: 222px">
			<q-item v-for="wallet in wallets" clickable v-close-popup @click="changeWallet(wallet)">
				<q-item-section>
					<q-item-label>{{ wallet.label }}</q-item-label>
				</q-item-section>
			</q-item>
			<q-item clickable v-close-popup @click="$refs.WalletAddRef.open()">
				<q-item-section avatar style="margin-right: -1.5rem">
					<q-icon size="1.5rem" name="add_circle" />
				</q-item-section>
				<q-item-section>
					<q-item-label>{{ $t("genWallet") }}</q-item-label>
				</q-item-section>
			</q-item>
		</q-list>
	</q-btn-dropdown>
	<q-tooltip
		target=".theme-dropdown-button"
		class="theme-hover-tooltip-c0 q-px-lg"
		style="font-size: 1em"
		anchor="center left"
		self="center right"
		:offset="[5, 5]"
		transition-show="jump-left"
		transition-hide="jump-right"
	>
		{{ selectedWalletLabel }}
	</q-tooltip>
	<WalletAddDialog ref="WalletAddRef" @generate-wallet="generateWallet" @import-wallet="importWallet" />
	<ConfirmDialog ref="ConfirmDialogRef" />
</template>

<style scoped>
	@keyframes button-hover-hint {
		0% {
			opacity: 0.7;
			transform: scale(1, 1);
		}
		100% {
			opacity: 0;
			transform: scale(1.1, 1.5);
		}
	}

	.theme-dropdown-button::before,
	.theme-dropdown-button::after {
		content: "";
		position: absolute;
		display: block;
		top: 0;
		left: 0;
		background-color: var(--theme-card-bt-c0);
		width: 100%;
		height: 100%;
		pointer-events: none;
		border-radius: 3px;
		z-index: -1;
		opacity: 0.7;
	}
	.theme-dropdown-button.active::before {
		animation: button-hover-hint 2s ease-in-out 0s infinite;
	}
	.theme-dropdown-button.active::after {
		animation: button-hover-hint 2s ease-in-out 0.75s infinite;
	}
</style>

<script>
	import { defineComponent, ref } from "vue";
	import WalletAddDialog from "src/layouts/WalletGenerate.vue";
	import ConfirmDialog from "src/components/ConfirmDialog.vue";
	let walletItems = [];

	export default defineComponent({
		name: "WalletSelect",
		data() {
			return {
				selectedWalletLabel: ref(this.$t("genWallet")),
				selectedWalletId: ref(null),
				wallets: ref(walletItems),
				hintCreateWallet: ref(false),
			};
		},
		components: {
			WalletAddDialog,
			ConfirmDialog,
		},
		emits: ["changeWallet"],
		methods: {
			renderWalletList: async function (autoFocusWallet) {
				walletItems = [];
				let r = await window.electronAPI.getWalletList();
				if (Array.isArray(r?.result) && r.result.length > 0) {
					this.hintCreateWallet = false;
					r.result.map((item, index) => {
						walletItems.push(item);
						if (autoFocusWallet && index === 0) {
							this.selectedWalletId = 0;
							this.selectedWalletLabel = item.label;
							this.$emit("changeWallet", item);
						}
					});
				} else {
					this.hintCreateWallet = true;
				}
				this.wallets = walletItems;
			},
			generateWallet: async function (data) {
				if (data?.data) {
					this.$refs.ConfirmDialogRef.openInfo(this.$t("success"), this.$t("genWalletDone"), "check_circle", "green");
					await this.renderWalletList(false);
					let lastWallet = this.wallets[this.wallets.length - 1];
					this.selectedWalletId = lastWallet.id;
					this.selectedWalletLabel = lastWallet.label;
					this.hintCreateWallet = false;
					this.$emit("changeWallet", this.wallets[this.wallets.length - 1]);
				} else {
					this.$refs.ConfirmDialogRef.openInfo(this.$t("fail"), this.$t("genWalletFail"), "error", "red");
				}
			},
			importWallet: async function () {
				await this.renderWalletList(true);
			},
			changeWallet(walletData) {
				if (this.selectedWalletId === walletData.id) {
					return;
				}
				this.selectedWalletId = walletData.id;
				this.selectedWalletLabel = walletData.label;
				let sendMessage = {};
				for (let i in walletData) {
					sendMessage[i] = walletData[i];
				}
				this.$emit("changeWallet", sendMessage);
			},
		},
		async mounted() {
			await this.renderWalletList(true);
		},
	});
</script>
