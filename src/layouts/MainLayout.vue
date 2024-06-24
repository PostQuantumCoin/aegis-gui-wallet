<template>
	<q-layout view="hHh LpR fFf" class="font">
		<q-header reveal elevated class="bg-unset text-grey-4 no-shadow">
			<q-toolbar class="row">
				<q-toolbar-title shrink class="flex flex-center">
					<span style="font-size: 1em" class="title-logo logo-text no-pointer-events non-selectable">AEGIS</span>
					<span style="font-size: 1em" class="text no-pointer-events non-selectable">Wallet</span>
				</q-toolbar-title>

				<q-tabs
					v-model="pageCtrl"
					indicator-color="obvious"
					active-bg-color="obvious-active"
					active-color="obvious"
					dense
					class="col-grow"
				>
					<q-tab name="homePage" :label="$t('home')" class="non-selectable"></q-tab>
					<q-tab name="sendPage" :label="$t('send')" class="non-selectable"></q-tab>
					<q-tab name="transationPage" :label="$t('transation')" class="non-selectable"></q-tab>
					<q-tab name="explorerPage" :label="$t('explorer')" class="non-selectable"></q-tab>
				</q-tabs>
				<SelectWallet ref="selectWalletRef" @change-wallet="changeWallet" />
			</q-toolbar>
		</q-header>

		<q-page-container class="bg-container bg-container-img">
			<q-tab-panels ref="tabPanelsRef" v-model="pageCtrl" animated class="text-white bg-unset" @transition="changePage">
				<q-tab-panel name="homePage" class="q-pa-none">
					<HomePage ref="panelPageRef" :goTo="goToPage" :addWalletAddress="addAddress" />
				</q-tab-panel>
				<q-tab-panel name="sendPage" class="q-pa-none">
					<SendPage ref="panelPageRef" :goTo="goToPage" />
				</q-tab-panel>
				<q-tab-panel name="transationPage" class="q-pa-none">
					<TransationPage ref="panelPageRef" :goTo="goToPage" />
				</q-tab-panel>
				<q-tab-panel name="explorerPage" class="q-pa-none">
					<ExplorerPage ref="panelPageRef" :goTo="goToPage" />
				</q-tab-panel>
			</q-tab-panels>
		</q-page-container>
		<mainFooter
			ref="mainFooterRef"
			:blockNowHeight="blockNowHeight"
			:p2pBestHeight="p2pBestHeight"
			:p2pActiveConnections="p2pActiveConnections"
		/>
		<ConfirmDialog ref="changeWalletDialogRef" />
		<q-inner-loading
			dark
			class="fullscreen bg-blur"
			color="amber"
			:showing="loadingFlag"
			:label="loadingLabel + '...'"
			label-class="text-amber"
			label-style="font-size: 1.1em"
			style="z-index: 9001"
		/>
	</q-layout>
</template>
<style scoped>
	.font {
		font-family: Montserrat;
	}

	.logo-text {
		margin: 0;
		font-family: Montserrat;
		font-weight: 700;
		background: -webkit-linear-gradient(90deg, #ce7e00, #fecd4f);
		background-clip: border-box;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		margin: 0 7px;
	}

	.text {
		font-weight: 700;
		background: -webkit-linear-gradient(90deg, #959490, #ececec);
		background-clip: border-box;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
</style>
<script>
	import { provide, defineComponent, ref, nextTick } from "vue";
	import { useLoadingStore } from "stores/loading";
	import { storeToRefs } from "pinia";
	import ConfirmDialog from "components/ConfirmDialog.vue";
	import SelectWallet from "src/components/WalletSelect.vue";
	import mainFooter from "src/components/FooterMain.vue";
	import HomePage from "pages/HomePage.vue";
	import SendPage from "pages/SendPage.vue";
	import TransationPage from "pages/TransationPage.vue";
	import ExplorerPage from "pages/ExplorerPage.vue";
	import { delay, getBestHeight } from "../utils/utils";

	const LockUpdateTime = 3000;
	const LockUpdateBlock = 50;
	const PollingTime = 60000;
	const page = ["homePage", "sendPage", "transationPage", "explorerPage"];
	let updatedBlock = 0;
	let signSysList = ref({});
	let goToSubAttr = undefined;
	let updateWalletSetTimeout = undefined;
	let updateHeightTimeout = undefined;
	let requestUpdateWallet = false;

	export default defineComponent({
		name: "MainLayout",
		data() {
			return {
				pageCtrl: ref("homePage"),
				nowWalletData: {},
				blockNowHeight: ref(0),
				p2pBestHeight: ref(0),
				p2pActiveConnections: ref(0),
				updateHeightTime: 0,
			};
		},
		components: {
			SelectWallet,
			ConfirmDialog,
			HomePage,
			SendPage,
			TransationPage,
			ExplorerPage,
			mainFooter,
		},
		methods: {
			async pollingCheck() {
				while (true) {
					await this.updateBlockView();
					await this.updateActiveConnections();
					await delay(PollingTime);
					console.log(`PollingTime`);
				}
			},
			async updateBlockView() {
				if (!requestUpdateWallet) {
					requestUpdateWallet = true;
					updateWalletSetTimeout = setTimeout(() => {
						this.blockUpdate();
					}, LockUpdateTime);
				} else if (updateWalletSetTimeout) {
					if (updatedBlock++ >= LockUpdateBlock) {
						this.blockUpdate();
					} else {
						clearTimeout(updateWalletSetTimeout);
						updateWalletSetTimeout = setTimeout(() => {
							this.blockUpdate();
						}, LockUpdateTime);
					}
				}
			},
			async updateBlockHeight() {
				let nowDate = Date.now();
				if (this.updateHeightTime + LockUpdateTime > nowDate) {
					if (!updateHeightTimeout) {
						updateHeightTimeout = setTimeout(this.updateBlockHeight.bind(this), LockUpdateTime);
					}
					return;
				}
				this.updateHeightTime = nowDate;
				clearTimeout(updateHeightTimeout);
				updateHeightTimeout = undefined;
				let status = await window.electronAPI.getLastBlockHeight();
				if (typeof status?.result === "number" && status.result !== this.blockNowHeight) {
					this.blockNowHeight = status.result;
					if (this.blockNowHeight > this.p2pBestHeight) {
						this.p2pBestHeight = this.blockNowHeight;
					}
				}
				if (this.$refs.mainFooterRef) {
					if (this.blockNowHeight >= this.p2pBestHeight) {
						this.$refs.mainFooterRef.setupBlockStatus("done");
					} else {
						this.$refs.mainFooterRef.setupBlockStatus("sync");
					}
				}
			},
			blockUpdate(hash) {
				clearTimeout(updateWalletSetTimeout);
				updatedBlock = 0;
				requestUpdateWallet = false;
				updateWalletSetTimeout = undefined;
				let pageElement = this.$refs.panelPageRef;
				if (typeof pageElement?.blockUpdate === "function") {
					pageElement.blockUpdate(hash);
				}
			},
			async txUpdate(data) {
				let txCache = await window.electronAPI.getTxPoolByTxid(data.txid);
				if (txCache.err || !txCache.result) return;
				let pageElement = this.$refs.panelPageRef;
				if (typeof pageElement?.txUpdate === "function") {
					pageElement.txUpdate(txCache.result.address);
				}
			},
			async updateActiveConnections() {
				let status = await window.electronAPI.p2pStatus();
				if (status && !status.err && typeof status.result?.amounts === "number") {
					let amounts = status.result.amounts;
					this.p2pActiveConnections = amounts;
					let bestHeight = getBestHeight(status.result.list);
					if (bestHeight > this.p2pBestHeight) {
						this.p2pBestHeight = bestHeight;
					}

					if (amounts === 0) {
						this.$refs.mainFooterRef.setupNetworkStatus("none");
					} else if (amounts < 3) {
						this.$refs.mainFooterRef.setupNetworkStatus("bad");
					} else if (amounts < 6) {
						this.$refs.mainFooterRef.setupNetworkStatus("poor");
					} else {
						this.$refs.mainFooterRef.setupNetworkStatus("good");
					}
				} else {
					this.$refs.mainFooterRef.setupNetworkStatus("none");
				}
			},
			async changeWallet(data) {
				if (typeof data?.id !== "number" || this.nowWalletData?.id === data.id) {
					return;
				}
				this.openLoading(this.$t("loading"));
				let walletData = await this.switchWallet(data);
				if (!walletData) {
					this.closeLoading();
					return;
				}
				await nextTick();
				this.nowWalletData = walletData;
				let pageElement = this.$refs.panelPageRef;
				if (typeof pageElement?.changeWallet === "function") {
					await pageElement.changeWallet(walletData);
				}
				this.closeLoading();
			},
			async changePage(newVal) {
				this.openLoading(this.$t("loading"));
				await nextTick();
				let pageElement = this.$refs.panelPageRef;
				if (typeof pageElement?.changeWallet === "function") {
					await pageElement.changeWallet(this.nowWalletData, goToSubAttr);
				}
				goToSubAttr = undefined;
				this.closeLoading();
			},
			async addAddress(address) {
				this.nowWalletData.addressList.push(address);
			},
			async switchWallet(data) {
				let swR = await window.electronAPI.switchWallet(data.id);
				if (!swR || swR.error) {
					return this.$refs.changeWalletDialogRef.openInfo(
						this.$t("fail"),
						this.$t("changeWalletFail"),
						"report_problem",
						"red"
					);
				}

				let addressList = await window.electronAPI.walletGetAddressList();
				if (!addressList || addressList.error) {
					return this.$refs.changeWalletDialogRef.openInfo(
						this.$t("error"),
						this.$t("getAddressFail"),
						"report_problem",
						"red"
					);
				}
				data.addressList = addressList.result;
				return data;
			},
			async goToPage(newPage, msg) {
				if (this.pageCtrl !== newPage && page.includes(newPage)) {
					goToSubAttr = msg;
					this.$refs.tabPanelsRef.goTo(newPage);
					await nextTick();
					(this.$refs.panelPageRef.setInit || (() => {}))(msg);
				}
			},
		},
		setup() {
			provide("signSysList", signSysList);
			const loadingStore = useLoadingStore();
			const openLoading = (...args) => loadingStore.openLoading(...args);
			const closeLoading = () => loadingStore.closeLoading();
			const { loadingFlag, loadingLabel } = storeToRefs(loadingStore);
			return { openLoading, closeLoading, loadingFlag, loadingLabel };
		},
		async created() {
			let r = await window.electronAPI.getSignSysAll();
			r.forEach((x) => {
				signSysList.value[x.signSysName] = {
					label: x.signSysName,
					index: x.signType,
					version: x.version,
				};
			});
			window.electronAPI.newBlockListener(
				function (event, data) {
					this.updateBlockView();
					this.updateBlockHeight();
				}.bind(this)
			);
			window.electronAPI.addTxListener(
				function (event, data) {
					try {
						let formatData = JSON.parse(data);
						this.txUpdate(formatData);
					} catch (e) {}
				}.bind(this)
			);
			await this.updateActiveConnections();
			await this.updateBlockHeight();
			this.pollingCheck();
		},
	});
</script>
