<template>
	<div class="">
		{{ $t("toAddrAmountTitle") }}<span class="value unit">{{ sendablueAmount }}</span>
	</div>
	<div class="">
		{{ $t("toAddrTotalSend") }}<span class="value unit">{{ totalSendAmount }}</span>
	</div>
	
	<q-intersection v-for="(toAddressitem, index) in sendPageRef.toAddressList" transition="slide-right" once>
		<div class="flex row justify-center items-center content-center">
			<q-input
				v-model="toAddressitem.address"
				label-style="color: var(--theme-card-text-c0);"
				:label="`${$t('sendPageToAddress')} [${index + 1}]`"
				dark
				dense
				:error="toAddressitem.addressError ? true : undefined"
				color="amber"
				style="width: 65%"
				:error-message="$t('toAddrFormatError')"
				input-style=" color: var(--theme-card-text-c0);"
				@blur="
					async (e) => {
						toAddressitem.addressError = !(await chAddress(toAddressitem.address));
					}
				"
			>
				<template v-slot:prepend>
					<q-icon name="currency_exchange" style="color: var(--theme-card-text-c0)" />
				</template>
			</q-input>
			<q-icon class="q-px-md" name="keyboard_backspace" size="sm" style="color: var(--theme-card-text-c0)" />

			<q-input
				v-model="toAddressitem.amountStr"
				:label="$t('sendPageSendAmount')"
				dark
				dense
				color="amber"
				min="1"
				style="width: 25%"
				input-style=" color: var(--theme-card-text-c0);"
				:error="toAddressitem.amountError ? true : undefined"
				:error-message="$t('toAddrMinSend')"
				@keydown.enter.prevent="addEmptyToAddress"
				@keyup="
					(e) => {
						let v = checkAmountStr(toAddressitem.amountStr);
						toAddressitem.amountBigInt = v.amountBigInt;
						toAddressitem.amountError = v.amountBigInt <= 0 || !v;
						updateTotalSendAmount();
					}
				"
				@blur="
					(e) => {
						let v = checkAmountStr(toAddressitem.amountStr);
						toAddressitem.amountBigInt = v.amountBigInt;
						toAddressitem.amountStr = v.amountStr;
						toAddressitem.amountError = v.amountBigInt <= 0 || !v;
						updateTotalSendAmount();
					}
				"
				onkeypress="return /^[0-9.]*$/.test(event.key)"
			>
				<template v-slot:append>
					<div class="text-body2 unit"></div>
				</template>
				<template v-slot:after>
					<q-icon
						name="close"
						@click="deleteToAddress(index)"
						class="cursor-pointer"
						style="color: var(--theme-card-text-c0)"
					/>
				</template>
			</q-input>
		</div>
	</q-intersection>
	<div class="q-pt-sm flex row justify-left items-center content-center">
		<q-btn :label="$t('addAddress')" dense flat icon="add" @click="addEmptyToAddress" color="amber" />
	</div>

	<!-- Fee ratio -->
	<div class="q-pt-md"></div>
	<div class="q-pt-md">{{ $t("feeRatio") }}</div>
	<div class="flex row justify-center items-center content-center">
		<q-input
			dark
			dense
			class="q-pa-sm"
			color="amber"
			:input-style="{ color: 'white' }"
			filled
			min="1"
			type="number"
			v-model="sendPageRef.sendfeeRatio"
			@update:model-value="
				(value) => {
					sendPageRef.sendfeeRatioSlider = value;
				}
			"
			style="width: 15%"
			onkeypress="return /^[0-9]*$/.test(event.key)"
		>
		</q-input>
		<div class="flex justify-center items-center content-center q-pa-sm" style="width: 85%">
			<q-slider
				v-model="sendPageRef.sendfeeRatioSlider"
				label
				:min="1"
				:max="50"
				dense
				color="amber"
				label-text-color="black"
				@update:model-value="
					(value) => {
						sendPageRef.sendfeeRatio = value;
					}
				"
			/>
		</div>
	</div>

	<div class="q-pt-lg"></div>
	<!-- change address -->
	<div class="flex row justify-left items-center content-center">
		<q-input
			v-model="sendPageRef.changeAddress"
			:hint="$t('default') + ': ' + sendPageRef.defaultChangeAddress"
			label-style="color: var(--theme-card-text-c0);"
			:label="$t('sendPageChangeAddress')"
			dark
			dense
			color="amber"
			style="width: 65%"
			input-style=" color: var(--theme-card-text-c0);"
			:rules="[(val) => val == '' || chAddress(val) || `${$t('toAddrFormatError')}`]"
		>
			<template v-slot:prepend>
				<q-icon name="undo" style="color: var(--theme-card-text-c0)" />
			</template>
			<template v-slot:after>
				<q-icon
					v-if="sendPageRef.changeAddress !== ''"
					name="close"
					@click="sendPageRef.changeAddress = ''"
					class="cursor-pointer"
					style="color: var(--theme-card-text-c0)"
				/>
			</template>
		</q-input>
	</div>
	<div class="flex justify-end">
		<q-btn flat @click="reset()" :label="$t('cancel')" class="theme-button-cancel-c0" />
		<q-btn flat @click="stepperRef.previous()" :label="$t('back')" class="theme-button-cancel-c0" icon="navigate_before" />
		<q-btn @click="clickNext()" class="theme-button-confirm-c0" :label="$t('continue')" icon="navigate_next" />
	</div>
</template>

<script>
	import { defineComponent, ref, toRaw } from "vue";
	import StepPrototype from "./StepPrototype.vue";

	export default defineComponent({
		name: "ToAddrStep",
		extends: StepPrototype,
		props: {},
		data() {
			return {
				lockContinue: false,
				sendablueAmount: ref("0.00000000"),
				totalSendAmount: ref("0.00000000"),
			};
		},
		components: {},
		methods: {
			reset() {
				this.lockContinue = false;
				this.resetCallBack();
			},
			checkAmountStr(amountStr) {
				let amountBigInt;
				try {
					let num = amountStr.split(".");
					let amountInteger = num[0].padStart(1, "0");
					let amountFractional = (num[1] ? num[1] : "").concat("00000000").slice(0, 8);
					amountBigInt = BigInt(`${amountInteger}${amountFractional}`);
					amountStr = `${amountInteger}.${amountFractional}`;
				} catch (error) {
					return false;
				}
				return { amountStr, amountBigInt };
			},
			async chAddress(addr) {
				let result = false;
				try {
					result = (await window.electronAPI.chAddress(addr)) ? true : false;
				} catch (error) {}
				return result;
			},
			addEmptyToAddress() {
				this.sendPageRef.toAddressList.push({ address: "", amountStr: "", amountBigInt: 0n });
			},
			deleteToAddress(index) {
				this.sendPageRef.toAddressList = [
					...this.sendPageRef.toAddressList.slice(0, index),
					...this.sendPageRef.toAddressList.slice(index + 1),
				];
				if (this.sendPageRef.toAddressList.length === 0) {
					this.sendPageRef.toAddressList.push({ address: "", amountStr: "", amountBigInt: 0n });
				}
				this.updateTotalSendAmount();
			},
			async updateTotalSendAmount() {
				let totalBigInt = 0n;
				for (const key in this.sendPageRef.toAddressList) {
					if (typeof this.sendPageRef.toAddressList[key].amountBigInt === "bigint") {
						totalBigInt += this.sendPageRef.toAddressList[key].amountBigInt;
					}
				}
				this.totalSendAmount = this.numberFormat(await window.electronAPI.bigIntToFloatString(totalBigInt));
			},
			async clickNext() {
				if (this.lockContinue) return;
				this.lockContinue = true;
				if (this.sendPageRef.toAddressList.length <= 0) {
					this.lockContinue = false;
					return this.sendPageRef.$refs.confirmDialogRef.openInfo(
						this.$t("wrongInput"),
						this.$t("atLeastOneReceivingAddr"),
						"report_problem",
						"red"
					);
				}
				if (this.sendPageRef.sendfeeRatio < 1) {
					this.lockContinue = false;
					return this.sendPageRef.$refs.confirmDialogRef.openInfo(
						this.$t("wrongInput"),
						this.$t("feeNotZero"),
						"report_problem",
						"red"
					);
				}
				if (!Number.isInteger(Number(this.sendPageRef.sendfeeRatio))) {
					this.lockContinue = false;
					return this.sendPageRef.$refs.confirmDialogRef.openInfo(
						this.$t("wrongInput"),
						this.$t("feeNotNumber"),
						"report_problem",
						"red"
					);
				}

				for (const key in this.sendPageRef.toAddressList) {
					if (!(await this.chAddress(this.sendPageRef.toAddressList[key].address))) {
						this.sendPageRef.toAddressList[key].addressError = true;
						this.lockContinue = false;
						let confirmText = this.$t("addressFormatError", { address: this.sendPageRef.toAddressList[key].address });
						if (confirmText.includes("{address}")) {
							confirmText = confirmText.replace("{address}", this.sendPageRef.toAddressList[key].address);
						}
						return this.sendPageRef.$refs.confirmDialogRef.openInfo(
							this.$t("wrongInput"),
							confirmText,
							"report_problem",
							"red"
						);
					}
					let value = this.checkAmountStr(this.sendPageRef.toAddressList[key].amountStr);
					this.sendPageRef.toAddressList[key].amountBigInt = value.amountBigInt;
					if (value.amountBigInt <= 0 || !value) {
						let confirmText = this.$t("addressSendAmountError", { address: this.sendPageRef.toAddressList[key].address });
						if (confirmText.includes("{address}")) {
							confirmText = confirmText.replace("{address}", this.sendPageRef.toAddressList[key].address);
						}
						this.sendPageRef.toAddressList[key].amountError = true;
						this.lockContinue = false;
						return this.sendPageRef.$refs.confirmDialogRef.openInfo(
							this.$t("wrongInput"),
							confirmText,
							"report_problem",
							"red"
						);
					}
				}
				if (this.sendPageRef.changeAddress !== "") {
					if (!(await this.chAddress(this.sendPageRef.changeAddress))) {
						this.lockContinue = false;
						return this.sendPageRef.$refs.confirmDialogRef.openInfo(
							this.$t("wrongInput"),
							this.$t("changeAddressFormatError"),
							"report_problem",
							"red"
						);
					}
				}
				this.sendPageRef.done.toAddressAmount = true;
				this.lockContinue = false;
				this.stepperRef.next();
			},
		},

		async mounted() {
			this.lockContinue = false;
			if (this.sendPageRef.toAddressList.length == 0) {
				this.sendPageRef.toAddressList.push({ address: "", amountStr: "", amountBigInt: 0n });
			}
			this.sendablueAmount = this.getFromSelectedUnit();
		},
	});
</script>
