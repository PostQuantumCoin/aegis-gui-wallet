<template>
	<div class="flex column content-center">
		<div style="width: 900px">
			<div v-for="checkItem in sendPageRef.finalCheckList" class="q-pb-md">
				<div v-if="checkItem.type == 'from'" class="flex justify-center items-center content-center">
					<div class="col-grow">
						<q-field label-color="amber" color="amber" dark dense filled :label="checkItem.label" stack-label>
							<template v-slot:control>
								<div class="self-center full-width no-outline" tabindex="0">
									{{ checkItem.address }}
								</div>
							</template>
						</q-field>
					</div>
					<div class="flex justify-center items-center content-center" style="width: 45px">
						<q-icon class="q-px-md" name="east" size="sm" style="color: var(--theme-card-text-c0)" />
					</div>
					<div style="width: 250px">
						<q-field label-color="amber" color="amber" dark dense filled>
							<template v-slot:control>
								<div class="value unit self-center full-width no-outline text-right" tabindex="0">
									{{ checkItem.amount }}
								</div>
							</template>
						</q-field>
					</div>
				</div>
				<div v-else-if="checkItem.type == 'to'" class="flex justify-center items-center content-center">
					<div class="col-grow">
						<q-field label-color="amber" color="amber" dark dense filled :label="checkItem.label" stack-label>
							<template v-slot:control>
								<div class="self-center full-width no-outline" tabindex="0">
									{{ checkItem.address }}
								</div>
							</template>
						</q-field>
					</div>
					<div class="flex justify-center items-center content-center" style="width: 45px">
						<q-icon class="q-px-md" name="west" size="sm" style="color: var(--theme-card-text-c0)" />
					</div>
					<div style="width: 250px">
						<q-field label-color="amber" color="amber" dark dense filled>
							<template v-slot:control>
								<div class="value unit self-center full-width no-outline text-right" tabindex="0">
									{{ checkItem.amount }}
								</div>
							</template>
						</q-field>
					</div>
				</div>
				<div v-else-if="checkItem.type == 'textarea'">
					<q-field label-color="amber" color="amber" dark dense filled :label="checkItem.label" stack-label>
						<template v-slot:control>
							<div class="self-center full-width no-outline text-wrap" tabindex="0">
								{{ checkItem.value }}
							</div>
						</template>
					</q-field>
				</div>
				<div v-else>
					<q-field label-color="amber" color="amber" dark dense filled :label="checkItem.label" stack-label>
						<template v-slot:control>
							<div class="self-center full-width no-outline" tabindex="0">
								{{ checkItem.value }}
							</div>
						</template>
					</q-field>
				</div>
			</div>

			<q-list dark bordered class="rounded-borders">
				<q-expansion-item dark dense v-model="finalCheckDetailExpanded" icon="info_outline" :label="$t('photonDetail')">
					<q-field
						class="q-pt-md q-px-md"
						v-for="checkItem in sendPageRef.finalCheckDetailList"
						label-color="amber"
						color="amber"
						dark
						dense
						filled
						:label="checkItem.label"
						stack-label
					>
						<template v-slot:control>
							<div class="self-center full-width no-outline" tabindex="0">
								{{ checkItem.value }}
							</div>
						</template>
					</q-field>
					<div class="q-px-md q-pb-md">
						<q-linear-progress
							v-for="checkPhotonItem in sendPageRef.finalCheckPhotonList"
							dark
							stripe
							rounded
							size="30px"
							:value="checkPhotonItem.value"
							color="amber"
							class="q-mt-sm"
						>
							<div class="absolute-full flex flex-center">
								<q-badge color="white" text-color="black" :label="checkPhotonItem.label" />
							</div>
						</q-linear-progress>
					</div>
				</q-expansion-item>
			</q-list>

			<div class="q-pt-md">
				<q-checkbox dark v-model="saveSetting" :label="$t('saveSetting')" color="amber" @click="" />
				<HelpTooltips align="right" size="md" color="c0" :tooltipText="$t('finalCheckSaveTooltip')" />
			</div>
			<q-checkbox dark ref="reviewTxRef" v-model="reviewTx" :label="$t('sendCheckCompleted')" color="amber" />
		</div>
	</div>
	<div class="flex justify-end">
		<q-btn flat :label="$t('cancel')" class="theme-button-cancel-c0" @click="reset()" />
		<q-btn :label="$t('send')" class="theme-button-confirm-c0" icon="navigate_next" @click="clickNext()" />
	</div>
</template>

<script>
	import { defineComponent, ref, toRaw } from "vue";
	import StepPrototype from "./StepPrototype.vue";

	export default defineComponent({
		name: "finalCheckStep",
		extends: StepPrototype,
		props: {},
		data() {
			return {
				saveSetting: ref(true),
				finalCheckDetailExpanded: false,
				reviewTx: ref(false),
			};
		},
		methods: {
			reset() {
				this.reviewTx = false;
				this.resetCallBack();
			},
			async clickNext() {
				if (!this.reviewTx) {
					let el = this.$refs.reviewTxRef?.$el;
					if (el) {
						el.scrollIntoView(true);
						el.classList.add("text-error");
					}
					return this.sendPageRef.$refs.confirmDialogRef.openInfo("", this.$t("reviewThisTx"));
				}

				let asr = await window.electronAPI.walletASend(true);
				if (asr?.error) {
					this.sendPageRef.$refs.confirmDialogRef.openInfo(this.$t("error"), asr?.error, "report_problem", "red");
					return;
				}
				this.sendPageRef.sendTxid = asr.result.txid;

				if (this.saveSetting) {
					window.electronAPI.userTemporaryJson("update", "saveSetting", true);
					for (const key in this.sendPageRef.fromSelected) {
						window.electronAPI.userTemporaryJson("update", `${toRaw(this.sendPageRef.fromSelected[key].address)}`, {
							select: toRaw(this.sendPageRef.fromSelected[key].signSelect),
							useAllUTXO: toRaw(this.sendPageRef.fromSelected[key].useAllUTXO),
						});
					}
					window.electronAPI.userTemporaryJson("update", "isOpReturnHEX", this.sendPageRef.isOpReturnHEX);
				} else {
					window.electronAPI.userTemporaryJson("update", "saveSetting", false);
				}

				this.sendPageRef.done.finalCheck = true;
				this.stepperRef.next();
			},
		},
		async mounted() {
			this.saveSetting = this.sendPageRef.saveSignSystemData.saveSetting ? true : false;
			if (this.sendPageRef.saveSignSystemData.saveSetting === undefined) {
				this.saveSetting = true;
			}
			let r = await window.electronAPI.getTxTempData();
			this.sendPageRef.finalCheckList = ref([]);
			for (const key in r.source) {
				this.sendPageRef.finalCheckList.push({
					label: `${this.$t("sendPageFromAddress")} [${parseInt(key) + 1}]`,
					value: `${r.source[key].address} -> ${r.source[key].inValue}`,
					type: "from",
					address: `${r.source[key].address}`,
					amount: `${r.source[key].inValue}`,
				});
				for (let i = 0; i < r.source[key].signSelectName.length; i++) {
					r.source[key].signSelectName[i] = this.$t(r.source[key].signSelectName[i]);
				}
				this.sendPageRef.finalCheckList.push({
					label: `${this.$t("sendPageFromAddress")} [${parseInt(key) + 1}] ${this.$t("signatrue")}`,
					value: r.source[key].signSelectName.join(", "),
					type: "normal",
				});
			}
			this.sendPageRef.finalCheckList.push({
				label: this.$t("checkUTXOAmount"),
				value: r.UTXOAmount,
				type: "normal",
			});
			this.sendPageRef.finalCheckList.push({
				label: this.$t("sendPageSendAmount"),
				value: r.sendAmount,
				type: "normal",
			});
			for (const key in r.target) {
				this.sendPageRef.finalCheckList.push({
					label: `${this.$t("sendPageToAddress")} [${parseInt(key) + 1}]`,
					value: `${r.target[key].value} -> ${r.target[key].address}`,
					type: "to",
					address: `${r.target[key].address}`,
					amount: `${r.target[key].value}`,
				});
			}

			this.sendPageRef.finalCheckList.push({
				label: this.$t("sendPageChangeAddress"),
				value: this.sendPageRef.changeAddress ? this.sendPageRef.changeAddress : this.sendPageRef.defaultChangeAddress,
				type: "to",
				address: `${this.sendPageRef.changeAddress ? this.sendPageRef.changeAddress : this.sendPageRef.defaultChangeAddress}`,
				amount: `${r.changeAmount}`,
			});
			this.sendPageRef.finalCheckList.push({ label: this.$t("feeRatio"), value: this.sendPageRef.sendfeeRatio, type: "normal" });
			this.sendPageRef.finalCheckList.push({ label: this.$t("fees"), value: r.fee, type: "normal" });
			this.sendPageRef.finalCheckList.push({
				label: this.$t("description"),
				value: this.sendPageRef.SendOpReturnStr,
				type: "textarea",
			});
			this.sendPageRef.finalCheckDetailList = ref([]);
			this.sendPageRef.finalCheckDetailList.push({
				label: this.$t("totalPhotons"),
				value: r.actualPhoton,
			});
			this.sendPageRef.finalCheckPhotonList = ref([]);
			let unlockScriptPhoton = await window.electronAPI.floatToPercentage(
				r.photonDetails.unlockScriptPhoton / r.actualPhoton,
				2
			);
			this.sendPageRef.finalCheckPhotonList.push({
				label: `${this.$t("unlockScriptPhoton")} ${unlockScriptPhoton}`,
				value: r.photonDetails.unlockScriptPhoton / r.actualPhoton,
			});

			let pqcertPhoton = await window.electronAPI.floatToPercentage(r.photonDetails.pqcertPhoton / r.actualPhoton, 2);
			this.sendPageRef.finalCheckPhotonList.push({
				label: `${this.$t("pqcertPhoton")} ${pqcertPhoton}`,
				value: r.photonDetails.pqcertPhoton / r.actualPhoton,
			});

			let descriptionPhoton = await window.electronAPI.floatToPercentage(r.photonDetails.opReturnPhoton / r.actualPhoton, 2);
			this.sendPageRef.finalCheckPhotonList.push({
				label: `${this.$t("descriptionPhoton")} ${descriptionPhoton}`,
				value: r.photonDetails.opReturnPhoton / r.actualPhoton,
			});

			let otherPhoton = await window.electronAPI.floatToPercentage(r.photonDetails.otherPhoton / r.actualPhoton, 2);
			this.sendPageRef.finalCheckPhotonList.push({
				label: `${this.$t("otherPhoton")} ${otherPhoton}`,
				value: r.photonDetails.otherPhoton / r.actualPhoton,
			});
		},
		watch: {
			reviewTx: function (newVal) {
				let el = this.$refs.reviewTxRef?.$el;
				if (el) {
					el.classList.toggle("text-error", !newVal);
				}
			},
		},
	});
</script>
