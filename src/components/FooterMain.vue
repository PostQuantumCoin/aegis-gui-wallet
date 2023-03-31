<template>
	<q-footer class="bg-footer row justify-between q-px-sm q-py-xs" elevated reveal>
		<div class="row justify-end">
			<div class="q-pa-xs q-mx-xs hover-button" @click="$refs.settingsWindowRef.open()">
				<q-icon name="settings" color="amber" size="24px" />
				<q-tooltip
					class="bg-amber text-black q-pa-sm"
					transition-show="jump-up"
					transition-hide="jump-down"
					style="font-size: 0.75rem"
				>
					{{ $t("settings") }}
				</q-tooltip>
			</div>
			<div class="q-pa-xs q-mx-xs hover-button">
				<div
					ref="miningIcon"
					class="mine-icon md text-amber"
					@click="$refs.minerSettingsRef.open(mining, miningWallet, miningAddress, miningGPU)"
				></div>
				<q-tooltip
					class="bg-amber text-black q-pa-sm"
					transition-show="jump-up"
					transition-hide="jump-down"
					style="font-size: 0.75rem"
				>
					{{ mining ? $t("mining") : $t("idle") }}<br />{{ mining ? miningAddress : "" }}
				</q-tooltip>
			</div>
		</div>
		<div class="row justify-end">
			<div ref="blockStatusRef" class="q-pa-xs q-mx-xs block-status block-done q-mx-sm hover-button">
				<q-icon class="sync_problem" name="sync_problem" color="amber" size="24px" />
				<q-icon class="sync" name="sync" color="grey-4" size="24px" />
				<q-icon class="done" name="done" color="amber" size="24px" />
				<q-tooltip
					class="bg-amber text-black q-pa-sm"
					transition-show="jump-up"
					transition-hide="jump-down"
					style="font-size: 0.75rem; max-height: unset"
				>
					{{ $t("blockHeight") }}<br />{{ blockNowHeight }} / {{ p2pBestHeight }}
				</q-tooltip>
			</div>
			<div
				ref="networkStatusRef"
				class="q-px-xs q-py-sm q-mx-xs network-status row no-wrap justify-center items-end good q-mx-xs hover-button"
			>
				<div></div>
				<div></div>
				<div></div>
				<q-tooltip
					class="bg-amber text-black q-pa-sm"
					transition-show="jump-up"
					transition-hide="jump-down"
					style="font-size: 0.75rem; max-height: unset; max-width: unset; min-width: max-content"
					:offset="[0, 10]"
				>
					{{ p2pActiveConnections + " " + $t("activeConnections") }}
				</q-tooltip>
			</div>
		</div>
	</q-footer>
	<SettingsWindow ref="settingsWindowRef" />
	<MinerSettings ref="minerSettingsRef" @startMine="startMine" :mining="mining" :wallet="miningWallet" :address="miningAddress" />
</template>

<style scoped>
	.block-status > i {
		display: none;
	}

	.block-done > .done {
		display: block !important;
	}

	.block-sync > .sync {
		display: block !important;
	}

	.block-problem > .sync_problem {
		display: block !important;
	}

	.network-status {
		position: relative;
		width: 32px;
		height: 32px;
	}

	.network-status > div {
		width: 3px;
		margin: 0 2px;
		background-color: #a3a9cb;
	}

	.network-status > div:nth-child(1) {
		height: 40%;
	}

	.network-status > div:nth-child(2) {
		height: 70%;
	}

	.network-status > div:nth-child(3) {
		height: 100%;
	}

	.network-status.good > div:nth-child(1) {
		background-color: #91ff00;
	}

	.network-status.good > div:nth-child(2) {
		background-color: #91ff00;
	}

	.network-status.good > div:nth-child(3) {
		background-color: #91ff00;
	}

	.network-status.poor > div:nth-child(1) {
		background-color: #ebae30;
	}

	.network-status.poor > div:nth-child(2) {
		background-color: #ebae30;
	}

	.network-status.bad > div:nth-child(1) {
		background-color: red;
	}

	.startMine {
		color: #91ff00 !important;
	}
</style>

<script>
	import { defineComponent, ref } from "vue";
	import SettingsWindow from "src/layouts/SettingsLayout.vue";
	import MinerSettings from "src/layouts/MinerLayout.vue";

	const networkStats = ["none", "good", "poor", "bad"];
	const blockStats = ["done", "sync", "problem"];
	export default defineComponent({
		name: "mainFooter",
		data() {
			return {
				mining: ref(false),
				miningWallet: ref({}),
				miningAddress: ref(""),
				miningGPU: ref([]),
			};
		},
		props: {
			blockNowHeight: Number,
			p2pBestHeight: Number,
			p2pActiveConnections: Number,
		},
		setup() {
			const blockStatusRef = ref(null);
			const networkStatusRef = ref(null);
			return { blockStatusRef, networkStatusRef };
		},
		components: {
			SettingsWindow,
			MinerSettings,
		},
		methods: {
			setupNetworkStatus: function (status) {
				if (!networkStats.includes(status) || !this.networkStatusRef) return;
				networkStats.map((item) => {
					this.networkStatusRef.classList.remove(item);
				});
				this.networkStatusRef.classList.add(status);
			},
			setupBlockStatus: function (status) {
				if (!blockStats.includes(status) || !this.blockStatusRef) return;
				blockStats.map((item) => {
					this.blockStatusRef.classList.remove("block-" + item);
				});
				this.blockStatusRef.classList.add("block-" + status);
			},
			startMine: function (status) {
				if (status.mining) {
					this.mining = true;
					this.miningWallet = status.wallet;
					this.miningAddress = status.address;
					this.miningGPU = status.gpu;
					if (this.$refs.miningIcon) {
						this.$refs.miningIcon.classList.add("startMine");
					}
				} else {
					this.mining = false;
					this.miningWallet = {};
					this.miningAddress = "";
					this.miningGPU = [];
					if (this.$refs.miningIcon) {
						this.$refs.miningIcon.classList.remove("startMine");
					}
				}
			},
		},
	});
</script>
