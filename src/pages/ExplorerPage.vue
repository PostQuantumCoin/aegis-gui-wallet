<template>
	<q-page class="explorer-page" :style-fn="containerTweak">
		<div class="q-pa-md" style="height: 100%">
			<div class="theme-card" style="height: 100%">
				<q-splitter v-model="splitterModel" :limits="[100, 200]" unit="px" style="height: 100%">
					<template v-slot:before>
						<q-tabs v-model="tab" vertical class="text-indigo-1">
							<q-tab name="explorer-block-list" icon="view_list" :label="$t('explorerBlock')" />
							<q-tab name="explorer-block-header" icon="view_in_ar" :label="$t('explorerHeader')" />
							<q-tab name="explorer-tx" icon="article" :label="$t('explorerTx')" />
							<q-tab name="explorer-pqcert" icon="las la-certificate" :label="$t('pqcert')" />
							<q-tab name="explorer-status" icon="grid_view" :label="$t('status')" />
						</q-tabs>
					</template>
					<template v-slot:after>
						<q-tab-panels
							v-model="tab"
							animated
							vertical
							transition-prev="jump-up"
							transition-next="jump-up"
							style="height: 100%; background-color: transparent"
							ref="tabPanelsRef"
							@transition=""
						>
							>
							<q-tab-panel name="explorer-block-list" style="padding: 0">
								<ExplorerBlocksPage ref="nowPanel" :goToExplorerPage="goToExplorerPage" />
							</q-tab-panel>
							<q-tab-panel name="explorer-block-header">
								<ExplorerHeaderPage ref="nowPanel" :goToExplorerPage="goToExplorerPage" />
							</q-tab-panel>
							<q-tab-panel name="explorer-tx">
								<ExplorerTxPage ref="nowPanel" :goToExplorerPage="goToExplorerPage" />
							</q-tab-panel>
							<q-tab-panel name="explorer-pqcert">
								<ExplorerPQCertPage ref="nowPanel" :goToExplorerPage="goToExplorerPage" />
							</q-tab-panel>
							<q-tab-panel name="explorer-status">
								<ExplorerStatusPage ref="nowPanel" :goToExplorerPage="goToExplorerPage" />
							</q-tab-panel>
						</q-tab-panels>
					</template>
				</q-splitter>
			</div>
		</div>
	</q-page>
</template>

<script>
	import { defineComponent, ref, nextTick } from "vue";
	import ExplorerBlocksPage from "../explorer/Blocks.vue";
	import ExplorerHeaderPage from "../explorer/Header.vue";
	import ExplorerTxPage from "../explorer/Tx.vue";
	import ExplorerPQCertPage from "../explorer/PQCert.vue";
	import ExplorerStatusPage from "../explorer/Status.vue";

	const page = ["explorer-block-list", "explorer-block-header", "explorer-tx", "explorer-pqcert", "explorer-status"];
	
	export default defineComponent({
		name: "ExplorerPage",
		data() {
			return {
				tab: ref("explorer-block-list"),
				splitterModel: ref(100),
			};
		},
		props: {
			goTo: Function,
		},
		components: {
			ExplorerBlocksPage,
			ExplorerHeaderPage,
			ExplorerTxPage,
			ExplorerPQCertPage,
			ExplorerStatusPage,
		},
		methods: {
			containerTweak: function (offset) {
				return {
					height: offset ? `calc(100vh - ${offset}px)` : "100vh",
				};
			},
			async goToExplorerPage(newPage, msg) {
				if ((this.tab !== newPage || msg !== undefined) && page.includes(newPage)) {
					this.$refs.tabPanelsRef.goTo(newPage);
					await nextTick();
					this.$refs.nowPanel.setInit(msg);
				}
			},
			setInit(msg) {
				this.goToExplorerPage(msg.page, msg.props);
			},
			async blockUpdate(data) {
				await (this.$refs.nowPanel.blockUpdate || (() => {}))(data);
			},
			async txUpdate(data) {
				await (this.$refs.nowPanel.txUpdate || (() => {}))(data);
			},
		},
	});
</script>
