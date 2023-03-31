<template>
	<q-page class="home-page" :style-fn="containerTweak">
		<AddressBalanceTotal
			ref="totalRef"
			v-show="!noWalletData"
			:walletLabel="walletLabel"
			:signSysList="signSysList"
			:goTo="goTo"
			class="card total-data"
		/>
		<div v-for="ads in addressList">
			<AddressBalance
				:address="ads.address"
				:confirmed="ads.confirmed"
				:unconfirmed="ads.unconfirmed"
				:goTo="goTo"
				:openAddressDetail="openAddressDetail"
				class="card"
			/>
		</div>
		<q-page-sticky ref="addAddressBtnRef" v-show="!noWalletData" position="bottom-right" :offset="[18, 18]" class="addAddress">
			<q-btn round icon="add" color="deep-purple-2" text-color="dark" @click="$refs.addressAddRef.open(signSysList)" />
			<q-tooltip
				class="bg-amber text-black q-pa-sm"
				transition-show="jump-up"
				transition-hide="jump-down"
				style="font-size: 0.75rem; max-width: unset; min-width: max-content"
				anchor="top middle"
				self="bottom middle"
			>
				{{ $t("addAddress") }}
			</q-tooltip>
		</q-page-sticky>
		<div v-show="noWalletData" class="theme-hint-specified-components hint-create-wallet q-px-lg q-py-lg">
			<span>{{ $t("genWallet") }}</span>
		</div>
		<div v-show="!noWalletData && noAddressData" class="theme-hint-specified-components hint-add-address q-px-lg q-py-lg">
			<span>{{ $t("addAddress") }}</span>
		</div>
	</q-page>
	<AddressAddWindow ref="addressAddRef" @new-address="addAddress" />
	<AddressDetailWindow ref="addressDetailRef" />
	<ConfirmDialog ref="confirmDialogRef" />
</template>

<style scoped>
	@keyframes button-hover-hint {
		0% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(2);
		}
	}

	.home-page {
		padding: 16px 7vw;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-auto-rows: minmax(min-content, max-content);
		grid-gap: 10px;
	}

	.total-data {
		grid-column: 1 / 3;
		grid-row: 1;
	}

	.hint-create-wallet {
		top: 16px;
		right: 24px;
	}

	.hint-add-address {
		bottom: 8px;
		right: 90px;
	}

	.hint-add-address::before {
		top: calc(50% - 8px);
		right: -8px;
		border-top: 8px solid transparent;
		border-bottom: 0px solid transparent;
		border-left: 8px solid var(--theme-button-confirm-c0);
	}
	
	.hint-add-address::after {
		top: calc(50%);
		right: -16px;
		border-top: 0px solid transparent;
		border-bottom: 8px solid transparent;
		border-left: 8px solid var(--theme-button-confirm-c0);
	}

	.addAddress::before,
	.addAddress::after {
		transition: transform 0.3s;
		content: "";
		position: absolute;
		display: block;
		border: solid 2px var(--theme-card-bt-c0);
		width: 100%;
		height: 100%;
		border-radius: 50%;
		pointer-events: none;
	}

	.addAddress.active::before,
	.addAddress:hover::before {
		animation: button-hover-hint 1.5s ease-in-out 0s infinite;
	}
</style>

<script>
	import { defineComponent, ref, reactive, inject, nextTick } from "vue";
	import AddressBalanceTotal from "src/components/AddressBalanceTotal.vue";
	import AddressBalance from "src/components/AddressBalance.vue";
	import AddressAddWindow from "src/layouts/AddressAdd.vue";
	import AddressDetailWindow from "src/layouts/AddressDetail.vue";
	import ConfirmDialog from "components/ConfirmDialog.vue";

	export default defineComponent({
		name: "HomePage",
		data() {
			return {
				walletLabel: ref(""),
				signSysList: ref([]),
				addressList: ref([]),
				noWalletData: ref(true),
				noAddressData: ref(true),
			};
		},
		props: {
			goTo: Function,
			addWalletAddress: Function,
		},
		components: {
			AddressBalanceTotal,
			AddressBalance,
			AddressAddWindow,
			AddressDetailWindow,
			ConfirmDialog,
		},
		async created() {
			let allSignList = inject("signSysList");
			this.allSignList = allSignList.value;
		},
		methods: {
			containerTweak: function (offset) {
				return {
					height: offset ? `calc(100vh - ${offset}px)` : "100vh",
				};
			},
			changeWallet: async function (walletData) {
				this.clearAddressData();
				let walletSignList = [];
				if (!walletData || !Array.isArray(walletData.keypairs)) {
					return (this.noWalletData = true);
				} else {
					this.noWalletData = false;
				}

				if (Array.isArray(walletData.keypairs)) {
					walletData.keypairs.map((item, index) => {
						walletSignList.push({
							label: item,
							index,
							version: 0,
							disable: false,
						});
					});
				}
				this.walletLabel = walletData.label;
				this.signSysList = walletSignList;
				await nextTick();
				await this.renderAddressData();
			},
			async blockUpdate(hash) {
				this.updateAddressData();
			},
			async txUpdate(addressUpdateData) {
				if (typeof addressUpdateData !== "object") return;
				let relatedAddress = {};
				for (let i in addressUpdateData) {
					let index = window.electronAPI.base58Encode(i);
					relatedAddress[index] = addressUpdateData[i];
				}
				this.addressList.map((item) => {
					if (relatedAddress[item.address]) {
						item.confirmed -= relatedAddress[item.address].sendValue;
						item.unconfirmed += relatedAddress[item.address].receiveValue;
					}
				});
			},
			clearAddressData() {
				while (this.addressList.length > 0) {
					this.addressList.shift();
				}
			},
			hintAddAddress(open) {
				if (!this.$refs.addAddressBtnRef) return;
				if (typeof open !== "boolean") open = false;
				this.noAddressData = open;
				this.$refs.addAddressBtnRef.$el.classList.toggle("active", open);
				if (open === true) {
					setTimeout(() => {
						this.showAddAddressTooltip = true;
					}, 500);
				} else {
					this.showAddAddressTooltip = false;
				}
			},
			async getAddressData() {
				let r = await window.electronAPI.walletGetAddressList();
				if (Array.isArray(r.result) && r.result.length > 0) {
					let balance = await window.electronAPI.walletGetBalance(r.result);
					if (balance.error) {
						return null;
					} else {
						return balance.result;
					}
				}
				return null;
			},
			async renderAddressData() {
				let balance = await this.getAddressData();
				if (balance) {
					if (balance?.sub) {
						for (let i in balance.sub) {
							let item = balance.sub[i];
							this.addressList.push({
								address: i,
								confirmed: item.confirmed,
								unconfirmed: item.unconfirmed,
							});
						}
					}
					if (balance?.total) {
						this.totalRef.updateData(balance.total.confirmed, balance.total.unconfirmed);
					}
					this.hintAddAddress(false);
				} else {
					this.totalRef.updateData(0, 0);
					this.hintAddAddress(true);
				}
			},
			async updateAddressData() {
				let balance = await this.getAddressData();
				if (balance?.sub) {
					this.addressList.map((item, index) => {
						let addrBalance = balance.sub[item.address];
						if (
							addrBalance &&
							(item.confirmed !== addrBalance.confirmed || item.unconfirmed !== addrBalance.unconfirmed)
						) {
							item.confirmed = addrBalance.confirmed;
							item.unconfirmed = addrBalance.unconfirmed;
						}
					});
				}
				if (balance?.total) {
					this.totalRef.updateData(balance.total.confirmed, balance.total.unconfirmed);
				}
			},
			async addAddress(msg) {
				if (msg?.data) {
					this.addressList.push({
						address: msg.data,
						confirmed: 0n,
						unconfirmed: 0n,
					});
					this.$refs.confirmDialogRef.openInfo(this.$t("success"), this.$t("addAddressDone"), "check_circle", "green");
					if (typeof this.addWalletAddress === "function") {
						this.addWalletAddress(msg.data);
					}
					this.hintAddAddress(false);
				} else {
					this.$refs.confirmDialogRef.openInfo(this.$t("fail"), this.$t("addAddressFail"), "error", "red");
				}
			},
			openAddressDetail(address, addressDetail) {
				if (addressDetail?.result) {
					let fakeAmount = 0;
					let signSys = [];
					if (Array.isArray(addressDetail.result.signSys)) {
						for (let i = 0; i < addressDetail.result.signSys.length; i++) {
							if (addressDetail.result.signSys[i] === "FAKE") {
								fakeAmount++;
							}
							signSys[signSys.length] = {
								label: addressDetail.result.signSys[i],
								index: signSys.length,
								version: addressDetail.result.version,
								disable: true,
							};
						}
					}
					this.$refs.addressDetailRef.open(address, signSys, addressDetail.result.level, fakeAmount);
				} else {
					this.$refs.confirmDialogRef.openInfo(this.$t("error"), this.$t("addressDetailError"), "error", "red");
				}
			},
		},
		setup() {
			return {
				totalRef: ref(null),
			};
		},
	});
</script>
