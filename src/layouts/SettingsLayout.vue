<template>
	<q-dialog persistent v-model="openFlag" class="bg-blur" @keyup.esc="openFlag = false">
		<q-layout
			view="hHh LpR fFf"
			container
			:style="{ width: '70%', maxWidth: '70%', height: windowHeight + 'px' }"
			class="theme-dialog-window-c0"
		>
			<q-header class="q-pl-lg q-py-xs">
				<q-toolbar class="q-px-sm" style="min-height: 40px">
					<q-toolbar-title class="text-h6">{{ $t("settings") }}</q-toolbar-title>
					<q-btn class="close-btn" flat v-close-popup round dense icon="close" />
				</q-toolbar>
			</q-header>

			<q-page-container>
				<q-page :style-fn="containerTweak">
					<q-splitter v-model="splitterModel" style="height: 100%" disable>
						<template v-slot:before>
							<q-tabs v-model="settingPage" vertical>
								<q-tab name="settingCommon" label="Common" />
								<q-tab name="settingBlock" label="Block" />
								<q-tab name="settingWallet" label="Wallet" />
								<q-tab name="settingRPC" label="RPC" />
								<q-tab name="settingP2P" label="P2P" />
							</q-tabs>
						</template>

						<template v-slot:after>
							<q-tab-panels
								v-model="settingPage"
								animated
								transition-prev="slide-down"
								transition-next="slide-up"
								class="text-white bg-unset"
								style="height: 100%"
							>
								<q-tab-panel name="settingCommon">
									<q-card dark class="theme-card">
										<q-card-section>
											<div class="text-h6">{{ $t("language") }}</div>
										</q-card-section>
										<q-card-section>
											<q-select
												ref="languageRef"
												outlined
												v-model="language"
												:options="languageList"
												class="theme-select"
												popup-content-class="theme-select-popup"
											/>
										</q-card-section>
									</q-card>
								</q-tab-panel>
								<q-tab-panel name="settingBlock">
									<q-card dark class="theme-card">
										<q-card-section>
											<div class="text-h6">{{ $t("blockFilePath") }}</div>
										</q-card-section>
										<q-card-section class="text-body2">
											{{ blockFilePath }}
										</q-card-section>
									</q-card>
								</q-tab-panel>
								<q-tab-panel name="settingWallet">
									<q-card dark class="theme-card">
										<q-card-section>
											<div class="text-h6">{{ $t("walletFilePath") }}</div>
										</q-card-section>
										<q-card-section class="text-body2">
											{{ walletFilePath }}
										</q-card-section>
										<q-card-section class="text-body2">
											<q-btn :label="$t('backup')" class="theme-button-confirm-c0" @click="backupAllWallet" />
											<q-btn :label="$t('reindex')" class="theme-button-confirm-c0" @click="reindexBlock" />
										</q-card-section>
									</q-card>
								</q-tab-panel>
								<q-tab-panel name="settingRPC">
									<q-card dark class="theme-card q-mb-md">
										<q-card-section>
											<div class="text-h6">
												{{ $t("rpcLabel") }}
												<q-toggle color="amber" v-model="rpcEnable" />
											</div>
										</q-card-section>
										<q-card-section>
											<div class="row no-wrap items-center q-mb-md settings-item">
												<span class="text-body2 q-mr-md"
													>{{ $t("connectOtherNode")
													}}<HelpTooltips
														align="right"
														size="md"
														color="c0"
														:tooltipText="$t('connectOtherNodeHint')"
												/></span>
												<q-toggle color="amber" v-model="rpcConnectOther" :disable="!rpcEnable" />
											</div>
											<div class="row no-wrap items-center q-mb-md settings-item" v-show="rpcConnectOther">
												<span class="text-body2 q-mr-md text-amber">{{ $t("host") }}</span>
												<q-input
													dark
													outlined
													hide-bottom-space
													dense
													v-model="rpcHost"
													type="text"
													color="amber"
													input-style="color: var(--ags-text-obvious)"
													:disable="!rpcEnable"
													:readonly="!rpcEnable"
													:rules="[
														(val) =>
															(typeof val === 'string' &&
																val.match(
																	/((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/
																)) ||
															$t('RPChostErr'),
													]"
												/>
											</div>
											<div class="row no-wrap items-center q-mb-md settings-item">
												<span class="text-body2 q-mr-md">{{ $t("port") }}</span>
												<q-input
													dark
													outlined
													hide-bottom-space
													dense
													v-model="rpcPort"
													type="tel"
													color="c0"
													:disable="!rpcEnable"
													:readonly="!rpcEnable"
													:rules="[(val) => (val <= 65535 && val >= 1) || $t('portErr')]"
												/>
											</div>
										</q-card-section>
									</q-card>
									<q-card dark class="theme-card">
										<q-card-section>
											<div class="text-h6">{{ $t("rpcConnectAuth") }}</div>
										</q-card-section>
										<q-card-section>
											<div class="row no-wrap items-center q-mb-md settings-item">
												<span class="text-body2 q-mr-md">{{ $t("account") }}</span>
												<q-input
													dark
													outlined
													hide-bottom-space
													dense
													v-model="rpcUsr"
													type="text"
													color="c0"
													:rules="[(val) => val.length > 0 || $t('rpcConnectAuthAccountErr')]"
												/>
											</div>
											<div class="row no-wrap items-center q-mb-md settings-item">
												<span class="text-body2 q-mr-md">{{ $t("password") }}</span>
												<q-input
													dark
													outlined
													hide-bottom-space
													dense
													v-model="rpcPassword"
													type="password"
													color="c0"
													:rules="[(val) => val.length >= 6 || $t('rpcConnectAuthPasswordErr')]"
												/>
											</div>
										</q-card-section>
									</q-card>
								</q-tab-panel>
								<q-tab-panel name="settingP2P">
									<q-card dark class="theme-card">
										<q-card-section>
											<div class="text-h6">
												{{ $t("p2pLabel") }}
												<q-toggle color="amber" v-model="p2pEnable" :disable="rpcConnectOther || !rpcEnable" />
												<span v-show="rpcConnectOther || !rpcEnable" class="text-hint text-error">{{
													$t("lockP2PByOtherNode")
												}}</span>
											</div>
										</q-card-section>
										<q-card-section>
											<div class="row no-wrap items-center q-mb-md settings-item">
												<span class="text-body2 q-mr-md">{{ $t("port") }}</span>
												<q-input
													dark
													outlined
													hide-bottom-space
													dense
													v-model="p2pPort"
													type="tel"
													:disable="!p2pEnable"
													:readonly="!p2pEnable"
													color="c0"
													:rules="[(val) => (val <= 65535 && val >= 1) || $t('portErr')]"
												/>
											</div>
											<div class="row no-wrap items-center q-mb-md settings-item">
												<span class="text-body2 q-mr-md">{{ $t("maxConnections") }}</span>
												<q-input
													dark
													outlined
													hide-bottom-space
													dense
													v-model="p2pMaxConnections"
													:disable="!p2pEnable"
													:readonly="!p2pEnable"
													type="tel"
													color="c0"
													:rules="[(val) => val > 0 || $t('maxConnectionsErr')]"
												/>
											</div>
										</q-card-section>
									</q-card>
								</q-tab-panel>
							</q-tab-panels>
						</template>
					</q-splitter>
				</q-page>
			</q-page-container>
			<q-footer class="bg-unset">
				<q-splitter
					v-model="splitterModel"
					style="height: 100%"
					after-class="row no-wrap justify-end q-py-sm q-px-md overflow-hidden"
					disable
				>
					<template v-slot:before>
						<q-btn flat :label="$t('reset')" class="theme-button-cancel-c0 reset-btn" @click="resetSettings" />
					</template>
					<template v-slot:after>
						<div class="footer-splitter-content"></div>
						<q-btn flat :label="$t('cancel')" class="theme-button-cancel-c0" v-close-popup />
						<q-btn :label="$t('save')" class="theme-button-confirm-c0" @click="saveSettings" />
					</template>
				</q-splitter>
			</q-footer>
			<ConfirmDialog ref="settingsDialogRef" />
		</q-layout>
	</q-dialog>
</template>

<style scoped>
	.footer-splitter-content {
		position: absolute;
		top: -4px;
		left: 0;
		right: 0;
		bottom: -4px;
	}

	.reset-btn {
		width: 100% !important;
		padding: 0 !important;
		margin: 0 !important;
	}

	.settings-item > span {
		width: 25%;
		text-align: right;
	}
</style>

<script>
	import { defineComponent, ref } from "vue";
	import ProtoDialogVue from "./ProtoDialog.vue";
	import ConfirmDialog from "src/components/ConfirmDialog.vue";
	import { useLoadingStore } from "stores/loading";
	import HelpTooltips from "components/HelpTooltips.vue";
	import * as defaultConfig from "../../src-electron/template/app-config.json";
	import { delay, checkReindexAfter, checkCoreActivation } from "../utils/utils";
	import { storeToRefs } from "pinia";

	const LanguageList = [
		{
			label: "English",
			value: "en-US",
		},
	];
	let originData = {};
	
	export default defineComponent({
		name: "settingsLayout",
		extends: ProtoDialogVue,
		components: {
			ConfirmDialog,
			HelpTooltips,
		},
		data() {
			return {
				needReboot: ref(true),
				splitterModel: ref(30),
				settingPage: ref("settingCommon"),
				languageList: ref(LanguageList),
				language: ref({}),
				blockFilePath: ref(""),
				walletFilePath: ref(""),
				rpcEnable: ref(true),
				rpcConnectOther: ref(false),
				rpcHost: ref(""),
				rpcPort: ref(51978),
				rpcUsr: ref(""),
				rpcPassword: ref(""),
				p2pEnable: ref(true),
				p2pPort: ref(51977),
				p2pMaxConnections: ref(10),
				minerFeeRatio: ref(1),
			};
		},
		methods: {
			async open() {
				this.openFlag = true;
				this.setViewData(originData);
			},
			parseDirPath(str) {
				return str;
			},
			async getOriginData() {
				let data = await electronAPI.settingsJson("getData");
				originData = data;
				return data;
			},
			getViewData() {
				let rpcOpt = {
					hostname: this.rpcHost,
					disable: !this.rpcEnable,
					port: parseInt(this.rpcPort),
					auth: {
						usr: this.rpcUsr,
						pw: this.rpcPassword,
					},
				};
				if (!this.rpcEnable || this.rpcConnectOther) {
					this.p2pEnable = false;
				}
				let newData = {
					lang: this.language.value,
					connectOtherNode: this.rpcConnectOther,
					coreOpt: {
						dbDir: originData.coreOpt.dbDir,
						minerFeeRatio: this.minerFeeRatio.toString(),
					},
					p2pOpt: {
						peerDir: originData.p2pOpt.peerDir,
						serverDisable: !this.p2pEnable,
						maxConnect: parseInt(this.p2pMaxConnections),
						listenPort: parseInt(this.p2pPort),
					},
					rpcOpt: rpcOpt,
					services: {
						fullnode: false,
					},
					walletDataPath: {
						dbDir: originData.walletDataPath.dbDir,
					},
					walletHistoryOpt: {
						dbDir: originData.walletHistoryOpt.dbDir,
					},
					eventLog: {
						newBlock: true,
						forkBlock: false,
						addTx: false,
						p2p: true,
					},
				};

				return newData;
			},
			setViewData(data) {
				for (let i = 0; i < this.languageList.length; i++) {
					if (this.languageList[i].value === data.lang) {
						this.language = this.languageList[i];
					}
				}
				if (!this.language || !this.language.value) {
					this.language = {
						label: "English",
						value: "en-US",
					};
				}
				// this.language = this.languageList.includes(data.lang) ? data.lang : "en-US";
				this.blockFilePath = this.parseDirPath(data.coreOpt?.dbDir);
				this.walletFilePath = this.parseDirPath(data.walletDataPath?.dbDir);
				this.rpcHost = data.rpcOpt.hostname;
				this.rpcPort = data.rpcOpt?.port;
				this.rpcEnable = !data.rpcOpt?.disable;
				this.rpcConnectOther = data.connectOtherNode;
				this.rpcUsr = data.rpcOpt?.auth.usr;
				this.rpcPassword = data.rpcOpt?.auth.pw;
				this.p2pEnable = !data.p2pOpt?.serverDisable;
				this.p2pPort = data.p2pOpt?.listenPort;
				this.p2pMaxConnections = data.p2pOpt?.maxConnect;
				this.minerFeeRatio = parseInt(data.coreOpt?.minerFeeRatio);
			},
			checkModified(data) {
				if (
					data.connectOtherNode === originData.connectOtherNode &&
					data.coreOpt.minerFeeRatio === originData.coreOpt.minerFeeRatio &&
					data.p2pOpt.serverDisable === originData.p2pOpt.serverDisable &&
					data.p2pOpt.maxConnect === originData.p2pOpt.maxConnect &&
					data.p2pOpt.listenPort === originData.p2pOpt.listenPort &&
					data.rpcOpt.hostname === originData.rpcOpt.hostname &&
					data.rpcOpt.disable === originData.rpcOpt.disable &&
					data.rpcOpt.port === originData.rpcOpt.port &&
					data.rpcOpt.auth.usr === originData.rpcOpt.auth.usr &&
					data.rpcOpt.auth.pw === originData.rpcOpt.auth.pw
				) {
					return false;
				} else {
					return true;
				}
			},
			checkData(data) {
				if (data.rpcOpt.disable === false) {
					if (this.rpcConnectOther) {
						if (
							!data.rpcOpt.hostname.match(
								/((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/
							)
						) {
							this.settingPage = "settingRPC";
							this.$refs.settingsDialogRef.openInfo(this.$t("fail"), this.$t("rpcHostErr"), "report_problem", "red");
							return false;
						}
					} else {
						data.rpcOpt.hostname = "127.0.0.1";
					}

					if (data.rpcOpt.port < 1 || data.rpcOpt.port > 65535) {
						this.settingPage = "settingRPC";
						this.$refs.settingsDialogRef.openInfo(this.$t("fail"), this.$t("portErr"), "report_problem", "red");
						return false;
					}
				} else {
					data.p2pOpt.serverDisable = true;
				}

				if (data.p2pOpt.serverDisable === false) {
					if (data.p2pOpt.port < 1 || data.p2pOpt.port > 65535) {
						this.settingPage = "settingP2P";
						this.$refs.settingsDialogRef.openInfo(this.$t("fail"), this.$t("portErr"), "report_problem", "red");
						return false;
					}
					if (data.p2pOpt.maxConnect < 1) {
						this.settingPage = "settingP2P";
						this.$refs.settingsDialogRef.openInfo(this.$t("fail"), this.$t("maxConnectionsErr"), "report_problem", "red");
						return false;
					}
				}

				return data;
			},
			async saveSettings() {
				let saveData = this.getViewData();
				let verify = this.checkData(saveData);
				if (!verify) return;
				try {
					let modified = this.checkModified(verify);
					if (!modified) {
						await this.$refs.settingsDialogRef.openInfo("", this.$t("settingsUnaltered"));
						return this.close();
					}
				} catch (e) {}
				this.openLoading(this.$t("rebooting"), true);
				let status = await electronAPI.settingsJson("updateAll", verify);
				if (status === false) {
					this.closeLoading();
					this.$refs.settingsDialogRef.openInfo(this.$t("fail"), this.$t("saveSettingsFail"), "report_problem", "red");
				} else if (this.needReboot) {
					await electronAPI.rebootCore("");
					let coreActive = await checkCoreActivation();
					if (!coreActive) {
						await electronAPI.settingsJson("updateAll", originData);
						let data = await this.getOriginData();
						this.setViewData(data);
						await electronAPI.rebootCore("");
						this.closeLoading();
						this.$refs.settingsDialogRef.openInfo(this.$t("fail"), this.$t("rpcConnectTimeout"), "report_problem", "red");
					} else {
						this.closeLoading();
						await this.getOriginData();
						await this.$refs.settingsDialogRef.openInfo(this.$t("success"), this.$t("saveSettingsSuccessReboot"));
						this.close();
					}
				} else {
					this.closeLoading();
					await this.getOriginData();
					await this.$refs.settingsDialogRef.openInfo(this.$t("success"), this.$t("saveSettings"));
					this.close();
				}
			},
			async resetSettings() {
				let status = await this.$refs.settingsDialogRef.openConfirm(this.$t("confirmation"), this.$t("resetSettingsComfirm"));
				if (!status) return;
				try {
					let restoreData = JSON.parse(JSON.stringify(defaultConfig));
					this.openLoading(this.$t("rebooting"), true);
					await electronAPI.settingsJson("updateAll", restoreData);
					await electronAPI.rebootCore("");
					let coreActive = await checkCoreActivation();
					if (!coreActive) {
						let confirmText = this.$t("resetSettingsError", {
							p2pPort: restoreData.p2pOpt.listenPort,
							rpcPort: restoreData.rpcOpt.port,
						});
						if (confirmText.includes("{p2pPort}")) {
							confirmText = confirmText.replace("{p2pPort}", restoreData.p2pOpt.listenPort);
							confirmText = confirmText.replace("{rpcPort}", restoreData.rpcOpt.port);
						}
						this.$refs.settingsDialogRef.openInfo(this.$t("error"), confirmText, "report_problem", "red");
					} else {
						this.$refs.settingsDialogRef.openInfo(this.$t("success"), this.$t("resetSettingsSuccess"));
					}
					this.closeLoading();
				} catch (e) {}
			},
			async backupAllWallet() {
				let exportStatus = await window.electronAPI.exportWalletFile(true);
				if (exportStatus?.result) {
					await this.$refs.settingsDialogRef.openInfo(
						this.$t("success"),
						this.$t("exportWalletDone"),
						"check_circle",
						"green"
					);
					return (this.openFlag = false);
				} else {
					return this.$refs.settingsDialogRef.openInfo(this.$t("error"), this.$t("exportWalletFail"), "error", "red");
				}
			},
			async reindexBlock() {
				this.openLoading(this.$t("reindexing"), true);
				await window.electronAPI.walletReindex(0);
				await checkReindexAfter();
				this.closeLoading();
				this.$refs.settingsDialogRef.openInfo(this.$t("success"), this.$t("reindexSuccess"));
			},
		},
		watch: {
			rpcConnectOther: function (newVal) {
				this.p2pEnable = !newVal;
			},
			rpcEnable: function (newVal) {
				if (newVal == true) {
					this.p2pEnable = !this.rpcConnectOther;
				} else {
					this.p2pEnable = false;
				}
			},
		},
		async mounted() {
			let data = await this.getOriginData();
			this.setViewData(data);
		},
		setup() {
			const store = useLoadingStore();
			const openLoading = (data, force) => store.openLoading(data, force);
			const closeLoading = () => store.closeLoading();
			const { loadingFlag } = storeToRefs(store);
			return { openLoading, closeLoading, loadingFlag };
		},
	});
</script>
