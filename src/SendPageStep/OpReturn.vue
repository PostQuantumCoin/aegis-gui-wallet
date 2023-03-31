<template>
	<div class="q-pt-md">{{ $t("description") }}</div>

	<div>
		<q-checkbox dark dense v-model="sendPageRef.isOpReturnHEX" :label="$t('opReturnHexCheckbox')" color="amber" @click="" />
		<HelpTooltips align="right" size="md" color="c0" :tooltipText="$t('opReturnHexCheckboxTooltip')" />
	</div>
	<div class="q-pa-md" style="width: 100%">
		<q-input
			dark
			v-model="sendPageRef.SendOpReturnStr"
			color="amber"
			filled
			type="textarea"
			input-style="resize: none;height: 300px;"
			autogrow
		/>
	</div>
	<div class="flex justify-end">
		<q-btn flat :label="$t('cancel')" class="theme-button-cancel-c0" @click="reset()" />
		<q-btn flat :label="$t('back')" class="theme-button-cancel-c0" icon="navigate_before" @click="stepperRef.previous()" />
		<q-btn :label="$t('continue')" class="theme-button-confirm-c0" icon="navigate_next" @click="clickNext()" />
	</div>
</template>

<script>
	import { defineComponent, ref, toRaw } from "vue";
	import StepPrototype from "./StepPrototype.vue";

	export default defineComponent({
		name: "OpReturnStep",
		extends: StepPrototype,
		props: {},
		data() {
			return {
				lockContinue: false,
			};
		},
		methods: {
			reset() {
				this.lockContinue = false;
				this.resetCallBack();
			},
			async clickNext() {
				if (this.lockContinue) return;
				this.lockContinue = true;
				let source = [];
				for (const key in this.sendPageRef.fromSelected) {
					source.push({
						address: this.sendPageRef.fromSelected[key].address,
						signSelect: toRaw(this.sendPageRef.fromSelected[key].signSelect).sort((a, b) => a - b),
						useAllUTXO: this.sendPageRef.fromSelected[key].useAllUTXO,
					});
				}
				let target = [];
				for (const key in this.sendPageRef.toAddressList) {
					target.push({
						address: this.sendPageRef.toAddressList[key].address,
						value: this.sendPageRef.toAddressList[key].amountBigInt,
					});
				}

				let r = await window.electronAPI.walletASendCreateNewTx(
					source,
					target,
					this.sendPageRef.isOpReturnHEX,
					this.sendPageRef.SendOpReturnStr,
					BigInt(this.sendPageRef.sendfeeRatio),
					this.sendPageRef.changeAddress ? this.sendPageRef.changeAddress : this.sendPageRef.defaultChangeAddress
				);
				if (r?.error) {
					this.lockContinue = false;
					return this.sendPageRef.$refs.confirmDialogRef.openInfo(this.$t("error"), r.error, "report_problem", "red");
				}

				let isEncryption = await window.electronAPI.walletIsEncryption();
				if (isEncryption) {
					this.stepperRef.next();
				} else {
					let sr = await window.electronAPI.signTxMultiAddress();
					if (sr?.error) {
						return this.sendPageRef.$refs.confirmDialogRef.openInfo(this.$t("error"), sr?.error, "report_problem", "red");
					}
					this.sendPageRef.$refs.stepper.goTo("finalCheck");
				}
				this.sendPageRef.done.description = true;
			},
		},
		async mounted() {
			this.sendPageRef.isOpReturnHEX = this.sendPageRef.saveSignSystemData.isOpReturnHEX ? true : false;
		},
	});
</script>
