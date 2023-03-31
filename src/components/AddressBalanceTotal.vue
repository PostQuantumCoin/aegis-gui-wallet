<template>
	<q-card class="theme-card">
		<q-card-section>
			<div class="wallet-coin row justify-between">
				<q-card-section class="wallet-coin row items-center">
					<span class="label">{{ $t("totalUnconfirm") }}</span>
					<span class="value unit">{{ unconfirmedValue }}</span>
				</q-card-section>
				<q-card-section class="wallet-coin row items-center">
					<span class="label">{{ $t("totalConfirm") }}</span>
					<span class="value unit">{{ confirmedValue }}</span>
				</q-card-section>
				<div>
					<q-btn size="sm" class="q-ma-xs bt" :label="$t('detail')" @click="openWalletDetail" dark />
					<q-btn size="sm" class="q-ma-xs bt" :label="$t('send')" @click="goToSendPage('ALL')" dark />
				</div>
			</div>
		</q-card-section>
		<WalletDetail ref="walletDetailRef" />
	</q-card>
</template>

<style scoped>
	.wallet-coin {
		padding: 0;
	}

	.wallet-coin > .label {
		margin-right: 10px;
	}

	.wallet-coin > .value {
		display: inline-block;
	}

	.wallet-coin > .unit::after {
		margin-left: 10px;
	}
</style>

<script>
	import { defineComponent, ref } from "vue";
	import { bigIntToFloatString } from "../utils/utils";
	import WalletDetail from "src/layouts/WalletDetail.vue";

	export default defineComponent({
		name: "AddressBalanceTotal",
		props: {
			walletLabel: String,
			signSysList: Array,
			goTo: Function,
		},
		data() {
			return {
				expanded: ref(false),
				confirmedValue: "",
				unconfirmedValue: "",
			};
		},
		components: {
			WalletDetail,
		},
		methods: {
			goToSendPage(msg) {
				this.goTo("sendPage", msg);
			},
			goToTransationPage(msg) {
				this.goTo("transationPage", msg);
			},
			updateData(confirmed, unconfirmed) {
				let confirmedStr = bigIntToFloatString(confirmed);
				this.confirmedValue = new Intl.NumberFormat("en", { minimumFractionDigits: 8 }).format(confirmedStr);
				let unconfirmedStr = bigIntToFloatString(unconfirmed);
				this.unconfirmedValue = new Intl.NumberFormat("en", { minimumFractionDigits: 8 }).format(unconfirmedStr);
			},
			openWalletDetail() {
				this.$refs.walletDetailRef.open(this.walletLabel, this.signSysList);
			},
		},
		mounted() {
			this.updateData(0n, 0n);
		},
	});
</script>
