<template>
	<q-layout view="hHh LpR fFf" class="font start-background column no-wrap justify-center items-stretch start-block">
		<q-toolbar-title class="logo-text column no-wrap justify-center items-center content-center">
			<q-avatar size="8em">
				<img src="../assets/logo-vertical.png" />
			</q-avatar>
			<!--span class="header-subTitle-1" style="font-size: 1.75em">AEGIS</span>
			<span class="header-subTitle-2" style="font-size: 0.9em">Post Quantum Coin</span-->
		</q-toolbar-title>

		<q-linear-progress
			ref="blockProgressRef"
			dark
			rounded
			size="15px"
			:value="syncBlockRate"
			instant-feedback
			color="amber"
			track-color="startup-progress"
			class="q-mt-sm"
		>
			<div class="absolute-full flex flex-center noSelect">
				<q-badge class="progressText" color="transparent" text-color="amber" :label="syncBlockProgress" />
			</div>
		</q-linear-progress>
		<p class="text-center text-obscure noSelect" style="width: 100%; font-size: 1.1em">{{ startFlowText }}</p>
		<q-btn
			unelevated
			v-show="showEnterWallet"
			class="q-px-lg enter-wallet-text"
			text-color="obscure"
			@click="enterWallet(false)"
			:label="$t('enterWallet')"
		/>
	</q-layout>
</template>
<style scoped>
	.font {
		font-family: Montserrat;
	}

	.start-background {
		background-color: rgb(0 0 0 / 80%);
	}

	.start-block {
		padding: 15px;
	}

	.logo-text {
		margin: 0;
		font-family: Montserrat;
		font-weight: 700;
	}

	.enter-wallet-text {
		font-weight: bold;
		font-size: 1.25em;
	}
	
	.bg-start-container:before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgb(13 21 30 / 80%);
		filter: blur(10px);
	}

	.header * {
		pointer-events: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.header-subTitle-1 {
		position: relative;
		height: 1.25em;
		top: -6px;
		background: linear-gradient(90deg, #ce7e00, #fecd4f);
		letter-spacing: 3px;
		font-weight: 700;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
	}

	.header-subTitle-2 {
		position: relative;
		top: -6px;
		background: linear-gradient(90deg, #ededed, #94938f);
		font-weight: 500;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
		letter-spacing: -1px;
	}

	.progressText {
		height: inherit;
		background: inherit;
		-webkit-background-clip: text;
		background-clip: text;
		text-align: center;
		color: #fecd4f;
		mix-blend-mode: difference;
	}
</style>
<script>
	import { defineComponent, ref, nextTick } from "vue";
	import { delay, getBestHeight } from "../utils/utils";
	export default defineComponent({
		name: "StartupLayout",
		data() {
			return {
				startFlowIndex: ref(0),
				startFlowText: ref(""),
				syncBlockNow: ref(0),
				syncBlockTotal: ref(0),
				syncBlockRate: ref(0),
				syncBlockProgress: ref("0%"),
				showEnterWallet: ref(false),
			};
		},
		setup() {
			const blockProgressRef = ref(null);
			const enterWalletRef = ref(null);
			return {
				blockProgressRef,
				enterWalletRef,
			};
		},
		async mounted() {
			this.showEnterWallet = false;
			this.startFlowIndex = 0;
			this.startFlowText = this.$t("initApp");
			await nextTick();
			this.startFlow();
		},
		methods: {
			containerTweak: function (offset) {
				return {
					height: offset ? `calc(100vh - ${offset}px)` : "100vh",
				};
			},
			startFlow: async function () {
				await this.waitForStart();
				await this.autoWatchWallet();
				await delay(2000);
				await this.connectNetwork();
				await this.blockSyncing();
				this.startFlowText = this.$t("syncCompletion");
				await delay(1000);
				this.enterWallet(true);
			},
			waitForStart: async function () {
				while (true) {
					let status = await window.electronAPI.getLastBlockHeight();
					if (status && !status.err && typeof status?.result === "number") {
						this.syncBlockNow = status.result;
						break;
					} else {
						await delay(2000);
					}
				}
			},
			connectNetwork: async function () {
				this.startFlowText = this.$t("connecting");
				this.showEnterWallet = true;
				while (true) {
					let status = await window.electronAPI.p2pStatus();
					if (!status || status.err || !status.result || status.result.amounts > 0) {
						await this.updateBlockBestHeight();
						break;
					} else {
						await delay(5000);
					}
				}
			},
			blockSyncing: async function () {
				this.startFlowText = this.$t("syncBlocks");
				while (true) {
					let status = await window.electronAPI.getLastBlockHeight();
					if (typeof status?.result === "number") {
						if (status.result > this.syncBlockTotal) {
							this.syncBlockNow = this.syncBlockTotal;
						} else {
							this.syncBlockNow = status.result;
						}
					}
					this.updateBlockProgress();
					if (this.syncBlockTotal === 0) {
						await this.updateBlockBestHeight();
					}
					await delay(2000);
					if (this.syncBlockTotal > 0 && this.syncBlockNow >= this.syncBlockTotal) {
						break;
					}
				}
			},
			autoWatchWallet: async function () {
				await window.electronAPI.walletAutoWatchAll();
			},
			updateBlockBestHeight: async function () {
				let status = await window.electronAPI.p2pStatus();
				if (!status || status.err || !status.result || status.result.amounts === 0) {
					return null;
				}
				let bestHeight = getBestHeight(status.result.list);
				if (bestHeight > 0) {
					this.syncBlockTotal = bestHeight;
				}
			},
			updateBlockProgress: function () {
				if (this.syncBlockNow <= 0 || this.syncBlockTotal <= 0) {
					this.syncBlockRate = 0;
					this.syncBlockProgress = "0%";
				} else {
					let syncRate = ((this.syncBlockNow * 100) / this.syncBlockTotal).toFixed(2);
					this.syncBlockProgress = (syncRate > 100 ? 100 : syncRate) + "%";
					this.syncBlockRate = syncRate / 100;
				}
			},
			enterWallet: function (finish = false) {
				window.electronAPI.startMainWindow(finish);
			},
		},
	});
</script>
