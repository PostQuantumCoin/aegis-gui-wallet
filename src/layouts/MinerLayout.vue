<template>
	<q-dialog persistent v-model="openFlag" class="bg-blur" @keyup.esc="openFlag = false">
		<q-layout
			view="hHh LpR fFf"
			container
			:style="{ width: '50%', maxWidth: '50%', height: windowHeight + 'px' }"
			class="theme-dialog-window-c0"
		>
			<q-header class="q-pl-lg q-py-xs">
				<q-toolbar class="q-px-sm" style="min-height: 40px">
					<q-toolbar-title class="text-h6">{{ $t("mine") }}</q-toolbar-title>
					<q-btn class="close-btn" flat v-close-popup round dense icon="close" />
				</q-toolbar>
			</q-header>
			<q-page-container>
				<q-page :style-fn="containerTweak">
					<q-stepper
						class="theme-card"
						vertical
						v-model="step"
						dark
						ref="stepper"
						animated
						style="min-width: 100%"
						flat
						active-color="c0"
						done-color="amber"
					>
						<q-step name="selectWallet" :title="$t('selectWallet')" icon="wallet" :done="step !== 'selectWallet'">
							<div>
								<q-select
									outlined
									emit-value
									map-options
									ref="selectWalletRef"
									v-model="selectWallet"
									:options="walletList"
									class="mono-font theme-select"
									popup-content-class="mono-font theme-select-popup"
									popup-content-style="width: 532px;"
									option-value="id"
									:rules="[(val) => typeof val === 'number', (val) => val >= 0]"
									:error-message="$t('selectWalletErr')"
								/>
							</div>
							<q-stepper-navigation>
								<q-btn :label="$t('continue')" class="theme-button-confirm-c0" @click="getAddressStep" />
							</q-stepper-navigation>
						</q-step>
						<q-step
							name="selectAddress"
							:title="$t('selectAddress')"
							icon="las la-address-book"
							:done="step !== 'selectAddress' && step !== 'selectWallet'"
						>
							<div>
								<q-select
									outlined
									ref="selectAddressRef"
									v-model="selectAddress"
									:options="addressList"
									class="mono-font theme-select"
									popup-content-class="mono-font theme-select-popup"
									popup-content-style="width: 532px;"
									:rules="[(val) => typeof val === 'string' && val !== '']"
									:error-message="$t('selectAddressErr')"
								/>
							</div>
							<q-stepper-navigation>
								<q-btn
									flat
									:label="$t('back')"
									class="theme-button-cancel-c0"
									@click="
										$refs.stepper.goTo('selectWallet');
										addressList = [];
									"
								/>
								<q-btn :label="$t('continue')" class="theme-button-confirm-c0" @click="checkMineStep" />
							</q-stepper-navigation>
						</q-step>
						<q-step name="miningCheck" :title="$t('miningCheck')" icon="checklist" :done="step === 'mining'">
							<div>
								{{ $t("miningTo") }} <br />
								{{ selectWalletLabel }} - <span class="mono-font">{{ selectAddress }}</span>
								<div>
									<q-checkbox
										v-for="gpu in GPUList"
										v-model="selectMineGPU"
										:label="gpu.name"
										:val="gpu.uuid"
										color="amber"
									/>
								</div>
								<div class="text-red" v-if="flagErrorSelectGPU">{{ errorSelectGPUText }}</div>
							</div>
							<q-stepper-navigation>
								<q-btn
									flat
									:label="$t('back')"
									class="theme-button-cancel-c0"
									@click="
										getAddressList();
										$refs.stepper.goTo('selectAddress');
									"
								/>
								<q-btn
									v-if="!flagErrorSelectGPU"
									:label="$t('start')"
									class="theme-button-confirm-c0"
									@click="startMine"
								/>
							</q-stepper-navigation>
						</q-step>
						<q-step name="mining" :title="$t('mining')" icon="las la-running">
							<div>
								<span class="mono-font">{{ selectAddress }}</span>
								<GPUStatus :GPUList="selectMineGPU" />
							</div>
							<q-stepper-navigation>
								<q-btn :label="$t('stop')" class="theme-button-confirm-c0" @click="stopMine" />
							</q-stepper-navigation>
						</q-step>
					</q-stepper>
				</q-page>
			</q-page-container>
		</q-layout>
	</q-dialog>
</template>

<script>
	import { defineComponent, ref, toRaw } from "vue";
	import ProtoDialogVue from "./ProtoDialog.vue";
	import GPUStatus from "../components/GPUStatus.vue";
	import { containerLg } from "../utils/common";
	export default defineComponent({
		name: "MinerDetail",
		extends: ProtoDialogVue,
		data() {
			return {
				windowHeight: ref(containerLg.height),
				startMining: ref(false),
				walletList: [],
				selectWallet: ref(null),
				selectWalletLabel: ref(""),
				addressList: [],
				selectAddress: ref(null),
				step: ref("selectWallet"),
				GPUList: [],
				selectMineGPU: [],
				flagErrorSelectGPU: ref(false),
				errorSelectText: ref(""),
			};
		},
		components: {
			GPUStatus,
		},
		emits: ["startMine"],
		methods: {
			async open(mining, wallet, address, usedGPU) {
				this.openFlag = true;
				this.$nextTick(async function () {
					await this.getWalletList();
					await this.getGPUList();
					if (mining) {
						this.$refs.stepper.goTo("mining");
						this.startMining = true;
						this.selectWallet = wallet?.id;
						this.selectWalletLabel = wallet?.label;
						this.selectAddress = address;
						this.selectMineGPU = usedGPU;
					} else {
						await this.initMine();
					}
				});
			},
			containerTweak: containerLg.tweak,
			destroyed() {
				if (this.step !== "mining") {
					this.initMine();
				}
			},
			async initMine() {
				if (this.$refs.stepper) {
					this.$refs.stepper.goTo("selectWallet");
				} else {
					this.step = "selectWallet";
				}
				this.startMining = false;
				this.addressList = [];
				this.selectAddress = null;
			},
			setGPUError(text) {
				if (text) {
					this.flagErrorSelectGPU = true;
					this.errorSelectGPUText = this.$t(text);
				} else {
					this.flagErrorSelectGPU = false;
					this.errorSelectGPUText = "";
				}
			},
			async getWalletList() {
				this.walletList = [];
				let r = await window.electronAPI.getWalletList();
				if (Array.isArray(r?.result) && r.result.length > 0) {
					this.walletList = [];
					r.result.map((item) => {
						this.walletList.push(item);
					});
					if (this.walletList.length > 0) {
						this.selectWallet = this.walletList[0].id;
						this.selectWalletLabel = this.walletList[0].label;
						if (this.$refs.selectWalletRef) {
							this.$refs.selectWalletRef.setOptionIndex(0);
						}
					}
				} else {
					this.walletList = [
						{
							label: this.$t("walletNotfound"),
							id: -1,
						},
					];
				}
			},
			async getAddressList() {
				this.addressList = [];
				let r = await window.electronAPI.walletGetAddressList(this.selectWallet);
				if (Array.isArray(r?.result) && r.result.length > 0) {
					this.addressList = r.result;
					this.selectAddress = this.addressList[0];
				} else {
					this.addressList = [
						{
							label: this.$t("addressNotfound"),
							id: -1,
						},
					];
				}
			},
			async getGPUList() {
				let gpuStatus = await this.getGPUStatus();
				if (gpuStatus) {
					this.GPUList = gpuStatus;
				} else {
					this.GPUList = [];
				}
			},
			selectAllGPU() {
				let gpuList = toRaw(this.GPUList);
				let selectMineGPU = [];
				if (gpuList.length === 0) {
					this.setGPUError("GPUNotfound");
					this.selectMineGPU = [];
				} else {
					this.setGPUError(false);
					gpuList.map((item) => {
						selectMineGPU[selectMineGPU.length] = item.uuid;
					});
					this.selectMineGPU = selectMineGPU;
				}
			},
			async getGPUStatus() {
				let gpuStatus = await window.electronAPI.getGPUStatus();
				if (Array.isArray(gpuStatus?.result) && gpuStatus.result.length > 0) {
					return gpuStatus.result;
				} else {
					return false;
				}
			},
			async getAddressStep() {
				if (!this.$refs.selectWalletRef.validate()) {
					return;
				}
				this.selectWalletLabel = this.walletList[this.selectWallet].label;
				this.selectAddress = "";
				await this.getAddressList();
				this.$refs.stepper.goTo("selectAddress");
			},
			async checkMineStep() {
				if (!this.$refs.selectAddressRef.validate()) {
					return;
				}
				this.$refs.stepper.goTo("miningCheck");
				this.selectAllGPU();
			},
			async startMine() {
				if (this.startMining || this.flagErrorSelectGPU) return;
				this.startMining = true;
				let usedGPU = this.GPUList.map((gpuData) => {
					for (const key in this.selectMineGPU) {
						if (this.selectMineGPU[key] === gpuData.uuid) return true;
					}
					return false;
				});
				await window.electronAPI.mineAdvance(await window.electronAPI.base58Decode(this.selectAddress, true), usedGPU);
				this.$emit("startMine", {
					mining: true,
					wallet: toRaw(this.walletList[this.selectWallet]),
					address: this.selectAddress,
					gpu: toRaw(this.selectMineGPU),
				});

				this.$refs.stepper.goTo("mining");
			},
			async stopMine() {
				if (this.startMining) {
					await window.electronAPI.mine(false);
					this.startMining = false;
				}
				this.$emit("startMine", { mining: false });
				this.$refs.stepper.goTo("miningCheck");
			},
		},
		watch: {
			selectMineGPU: function (newValue) {
				if (newValue.length < 1) {
					this.setGPUError("GPUSelectAtLeast1");
				} else {
					this.setGPUError(false);
				}
			},
		},
	});
</script>
