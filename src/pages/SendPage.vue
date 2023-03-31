<template>
	<q-page class="flex flex-center q-pa-md send-page" :style-fn="containerTweak">
		<div style="width: 100%; height: 100%" class="q-pa-lg">
			<q-stepper class="theme-card" v-model="step" dark ref="stepper" color="primary" animated style="min-width: 100%" flat>
				
				<q-step
					name="fromAddress"
					:title="$t('sendPageStepperTitleFromAddress')"
					icon="paid"
					:done="done.fromAddress"
					:error="error.fromAddress"
					active-color="amber"
					done-color="secondary"
					style="height: 100%"
				>
					<FromStep ref="fromStepRef" :sendPageRef="sendPageRef" :stepperRef="$refs.stepper" :resetCallBack="reset" />
				</q-step>
				
				<q-step
					name="toAddressAmount"
					:title="$t('sendPageStepperTitleToAddress')"
					icon="paid"
					active-color="amber"
					done-color="secondary"
					:done="done.toAddressAmount"
					:error="error.toAddressAmount"
				>
					<ToAddrStep ref="toAddrStepRef" :sendPageRef="sendPageRef" :stepperRef="$refs.stepper" :resetCallBack="reset" />
				</q-step>

				<q-step
					name="description"
					:done="done.description"
					:error="error.description"
					:title="$t('sendPageStepperTitleDescription')"
					icon="article"
					done-color="secondary"
					active-color="amber"
				>
					<OpReturnStep
						ref="opReturnStepRef"
						:sendPageRef="sendPageRef"
						:stepperRef="$refs.stepper"
						:resetCallBack="reset"
					/>
				</q-step>

				<q-step
					name="walletPassword"
					:done="done.walletPassword"
					:error="error.walletPassword"
					:title="$t('sendPageStepperTitleWalletPassword')"
					icon="key"
					done-color="secondary"
					active-color="amber"
				>
					<PasswordStep
						ref="passwordStepRef"
						:sendPageRef="sendPageRef"
						:stepperRef="$refs.stepper"
						:resetCallBack="reset"
					/>
				</q-step>

				<q-step
					name="finalCheck"
					:done="done.finalCheck"
					:error="error.finalCheck"
					:title="$t('sendPageStepperTitleFinalCheck')"
					icon="playlist_add_check"
					done-color="secondary"
					active-color="amber"
				>
					<FinalCheckStep
						ref="finalCheckStepRef"
						:sendPageRef="sendPageRef"
						:stepperRef="$refs.stepper"
						:resetCallBack="reset"
					/>
				</q-step>

				<q-step
					name="finishStep"
					:title="$t('sendPageStepperTitleFinishStep')"
					icon="verified"
					done-color="secondary"
					active-color="amber"
				>
					<FinishStep ref="finishStepRef" :sendPageRef="sendPageRef" :stepperRef="$refs.stepper" :resetCallBack="reset" />
				</q-step>
			</q-stepper>
			<div class="q-pt-lg"></div>
		</div>
	</q-page>
	<ConfirmDialog ref="confirmDialogRef" />
</template>

<script>
	import { defineComponent, ref, toRaw } from "vue";
	import ConfirmDialog from "src/components/ConfirmDialog.vue";
	import { numberFormat } from "../utils/utils";
	import { useLoadingStore } from "stores/loading";
	import FromStep from "src/SendPageStep/FromAddr.vue";
	import ToAddrStep from "src/SendPageStep/ToAddr.vue";
	import OpReturnStep from "src/SendPageStep/OpReturn.vue";
	import PasswordStep from "src/SendPageStep/Password.vue";
	import FinalCheckStep from "src/SendPageStep/FinalCheck.vue";
	import FinishStep from "src/SendPageStep/Finish.vue";

	export default defineComponent({
		name: "SendPage",
		data() {
			return {
				sendPageRef: this,
				saveSignSystemData: ref({}),
				step: ref("fromAddress"),
				done: ref({
					fromAddress: false,
					toAddressAmount: false,
					description: false,
					walletPassword: false,
					walletPassword: false,
					finalCheck: false,
				}),
				error: ref({
					fromAddress: false,
					toAddressAmount: false,
					description: false,
					walletPassword: false,
					walletPassword: false,
					finalCheck: false,
				}),
				isOpReturnHEX: ref(false),
				fromSelected: ref([]),

				fromAddressList: ref([]),
				balanceList: ref({}),

				toAddressList: ref([]),
				defaultChangeAddress: ref(""),
				changeAddress: ref(""),

				nowWalletLabel: ref(""),
				nowWalletId: ref(0),
				sendfeeRatioSlider: ref(1),
				sendfeeRatio: ref(1),
				SendOpReturnStr: ref(""),

				finalCheckList: ref([]),
				finalCheckDetailList: ref([]),
				finalCheckPhotonList: ref([]),

				sendTxid: ref(""),
			};
		},
		props: {
			goTo: Function,
		},
		components: {
			ConfirmDialog,
			FromStep,
			ToAddrStep,
			OpReturnStep,
			PasswordStep,
			FinalCheckStep,
			FinishStep,
		},
		methods: {
			containerTweak: (offset) => ({
				height: offset ? `calc(100vh - ${offset}px)` : "100vh",
			}),
			clean() {
				this.done = {
					fromAddress: false,
					toAddressAmount: false,
					description: false,
					walletPassword: false,
					walletPassword: false,
					finalCheck: false,
				};
				this.error = {
					fromAddress: false,
					toAddressAmount: false,
					description: false,
					walletPassword: false,
					walletPassword: false,
					finalCheck: false,
				};
				this.step = "fromAddress";
				this.fromSelected = [];
				this.toAddressList = [];

				this.defaultChangeAddress = "";
				this.changeAddress = "";
				this.sendfeeRatioSlider = 1;
				this.sendfeeRatio = 1;

				this.isOpReturnHEX = false;
				this.SendOpReturnStr = "";

				this.finalCheckList = [];
				this.finalCheckDetailList = [];
				this.finalCheckPhotonList = [];
				this.sendTxid = "";
			},
			async reset() {
				this.openLoading(this.$t("loading"));
				this.clean();
				await this.updateFromAddressList();
				await window.electronAPI.walletASend(false);
				this.closeLoading();
			},
			async changeWallet(walletData, attr) {
				if (!walletData || typeof walletData !== "object") return;
				this.clean();
				this.nowWalletId = walletData.index;
				this.nowWalletLabel = walletData.label;

				await this.updateFromAddressList(toRaw(walletData.addressList));

				if (attr === "ALL") {
					this.fromSelected = [];
					for (const key in this.fromAddressList) {
						if (this.fromAddressList[key].confirmedBigInt > 0) {
							this.fromSelected.push(this.fromAddressList[key]);
						}
					}
				} else if (attr != undefined) {
					for (const key in this.fromAddressList) {
						if (this.fromAddressList[key].address === attr) {
							if (this.fromAddressList[key].confirmedBigInt > 0) {
								this.fromSelected = [this.fromAddressList[key]];
							} else {
								this.$refs.confirmDialogRef.openInfo(
									this.$t("error"),
									this.fromAddressList[key].address + " " + this.$t("noBalance").toLocaleLowerCase(),
									"report_problem",
									"red"
								);
							}
						}
					}
				}

				for (const key in this.fromSelected) {
					if (this.fromSelected[key].signSelect.length < this.fromSelected[key].details.level) {
						this.$refs.fromStepRef.signSysCheckboxCryptoShow[this.fromSelected[key].address] = true;
						this.$refs.fromStepRef.openSignSetting(this.fromSelected[key].address);
					}
				}
			},

			async updateFromAddressList(addressList) {
				this.saveSignSystemData = await window.electronAPI.userTemporaryJson("getData");

				if (addressList == undefined) {
					addressList = [];
					addressList = await window.electronAPI.walletGetAddressList();
					if (addressList.error) {
						this.$refs.confirmDialogRef.openInfo(this.$t("error"), this.$t("getAddressFail"), "report_problem", "red");
						return;
					}
					addressList = addressList.result;
				}

				this.balanceList = await window.electronAPI.walletGetBalance(addressList);
				this.balanceList = this.balanceList.result;
				this.fromAddressList = [];
				for (const key in this.balanceList.sub) {
					let confirmedStr = this.balanceList.sub[key].confirmed.toString().padStart(9, "0");
					confirmedStr = numberFormat(confirmedStr.slice(0, -8) + "." + confirmedStr.slice(-8));
					let r = await window.electronAPI.walletGetAddressDetails(key);
					if (r?.error) {
						this.$refs.confirmDialogRef.openInfo(this.$t("error"), this.$t("getBalanceFail"), "report_problem", "red");
						return;
					}

					let signSysList = [];
					for (let i = 0; i < r.result.signSys.length; i++) {
						if (r.result.signSys[i] === "FAKE") {
							continue;
						} else {
							signSysList.push({
								index: i,
								label: r.result.signSys[i],
								version: r.result.version,
							});
						}
					}
					this.fromAddressList.push({
						address: key,
						confirmedBigInt: BigInt(this.balanceList.sub[key].confirmed),
						confirmed: confirmedStr,
						useAllUTXO: this.saveSignSystemData[key]?.useAllUTXO ? this.saveSignSystemData[key].useAllUTXO : false,
						details: r.result,
						signSysList,
						signSelect: this.saveSignSystemData[key]?.select ? this.saveSignSystemData[key].select : [],
					});
				}
			},
			numberFormat,
		},
		setup() {
			const loadingStore = useLoadingStore();
			const openLoading = (...args) => loadingStore.openLoading(...args);
			const closeLoading = () => loadingStore.closeLoading();
			return { openLoading, closeLoading };
		},
		async mounted() {
			this.clean();
		},
	});
</script>
