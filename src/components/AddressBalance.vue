<template>
	<q-card class="theme-card">
		<q-card-section class="q-py-sm">
			<div @click="copyAddress(address)" class="obvious pointer mono-font row no-wrap justify-start items-center">
				{{ address }}
				<div ref="copyStatusRef" class="copy-status q-ml-xs" style="margin-top: 3px">
					<div class="column no-wrap">
						<q-icon name="content_copy" size="1.2em"></q-icon>
						<q-icon name="thumb_up_alt" size="1.2em"></q-icon>
					</div>
				</div>
			</div>
		</q-card-section>
		<q-separator inset dark />
		<q-card-section>
			<div class="wallet-coin" align="right">
				<span class="label">{{ $t("balanceComfirmed") }}</span>
				<span class="value unit">{{ formatValue(confirmed) }}</span>
			</div>
			<div class="wallet-coin" align="right">
				<span class="label">{{ $t("balanceUncomfirmed") }}</span>
				<span class="value unit">{{ formatValue(unconfirmed) }}</span>
			</div>
		</q-card-section>
		<q-card-section align="right">
			<q-btn size="sm" class="q-ma-xs bt" :label="$t('detail')" @click="openDetail(address)" dark />
			<q-btn size="sm" class="q-ma-xs bt" :label="$t('transation')" @click="goToTransationPage(address)" dark />
			<q-btn size="sm" class="q-ma-xs bt" :label="$t('send')" @click="goToSendPage(address)" dark />
		</q-card-section>
	</q-card>
</template>

<style scoped>
	.wallet-coin {
		padding: 0.5em 0;
	}

	.wallet-coin > .label {
		/* font-size: 1em; */
		margin-right: 10px;
	}

	.wallet-coin > .value {
		/* font-size: 1em; */
		display: inline-block;
		min-width: 12em;
	}

	.wallet-coin > .unit::after {
		margin-left: 10px;
	}

	.copy-status {
		overflow: hidden;
		height: 1.2em;
		white-space: nowrap;
	}

	.copy-status > div {
		height: max-content;
		transform: translateY(0em);
		transition: transform 0.5s;
	}

	.copy-status > div > .q-icon {
		transition: opacity 0.3s;
	}

	.copy-status > div > .q-icon:nth-child(1) {
		opacity: 1;
	}

	.copy-status > div > .q-icon:nth-child(2) {
		opacity: 0;
	}

	.copy-status.copied > div {
		transform: translateY(-50%);
	}

	.copy-status.copied > div > .q-icon:nth-child(1) {
		opacity: 0;
	}

	.copy-status.copied > div > .q-icon:nth-child(2) {
		opacity: 1;
	}
</style>

<script>
	import { defineComponent, ref } from "vue";
	import { bigIntToFloatString } from "../utils/utils";

	export default defineComponent({
		name: "addressItem",
		props: {
			address: String,
			confirmed: BigInt,
			unconfirmed: BigInt,
			goTo: Function,
			openAddressDetail: Function,
		},
		data() {
			return {
				expanded: ref(false),
				confirmedValue: "",
				unconfirmedValue: "",
				copyTimeout: undefined,
			};
		},
		setup() {
			const copyStatusRef = ref(null);
			return { copyStatusRef };
		},
		methods: {
			goToSendPage(msg) {
				this.goTo("sendPage", msg);
			},
			goToTransationPage(msg) {
				this.goTo("transationPage", msg);
			},
			copyAddress(address) {
				if (this.copyTimeout) return;
				navigator.clipboard.writeText(address);
				this.copyStatusRef.classList.add("copied");
				this.copyTimeout = setTimeout(() => {
					if (this.copyStatusRef) {
						this.copyStatusRef.classList.remove("copied");
					}
					this.copyTimeout = undefined;
				}, 2000);
			},
			async openDetail(address) {
				if (typeof this.openAddressDetail !== "function") return;
				let status = await window.electronAPI.walletGetAddressDetails(address);
				this.openAddressDetail(address, status);
			},
			formatValue(v) {
				return new Intl.NumberFormat("en", { minimumFractionDigits: 8 }).format(bigIntToFloatString(v));
			},
		},
	});
</script>
