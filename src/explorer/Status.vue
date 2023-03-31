<template>
	<div style="width: 900px; margin: 0 auto; padding: 0 0 30px 0" class="column">
		<div style="margin-bottom: 20px; width: 100%">
			<div class="q-py-lg" style="width: 50% margin: auto;">
				<div class="text-h6">{{ $t("nodeStatus") }}</div>
				<div class="list">
					<div class="row">
						<div>{{ $t("blockVersion") }}</div>
						<div v-if="status.version">{{ status.version }}</div>
					</div>
					<div class="row">
						<div>{{ $t("block") }}</div>
						<div v-if="status.nowHeight">{{ status.nowHeight }}</div>
					</div>
					<div class="row">
						<div>{{ $t("difficulty") }}</div>
						<div v-if="status.difficulty">{{ status.difficulty }}</div>
					</div>
					<div class="row">
						<div>{{ $t("connection") }}</div>
						<div v-if="typeof status.connections === 'number'">{{ status.connections }}</div>
					</div>
					<div class="row">
						<div>{{ $t("txPool") }}</div>
						<div v-if="typeof status.txPoolLen === 'number'">{{ status.txPoolLen }}</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<style>
	.list>div>div:first-child {
		min-width: 200px;
	}
</style>
<script>
	import { defineComponent, ref } from "vue";
	import { bigIntToFloatString, numberFormat } from "../utils/utils";

	export default defineComponent({
		name: "ExplorerNetworkStatus",
		data() {
			return {
				status: ref({}),
			};
		},
		async mounted() {
			let status = await this.getStatus();
			if (status) {
				this.status = status;
			}
		},
		methods: {
			containerTweak(offset) {
				return {
					height: offset ? `calc(100vh - ${offset}px)` : "100vh",
				};
			},
			async getStatus() {
				let status = await window.electronAPI.getStatus();
				if (!status.result) {
					return false;
				}
				return status.result;
			},
			bigIntToFloatString,
			numberFormat,
			async setInit() {},
			async blockUpdate() {
				let status = await this.getStatus();
				if (status) {
					this.status = status;
				}
			},
			async txUpdate() {
				let status = await this.getStatus();
				if (status) {
					this.status = status;
				}
			},
		},
	});
</script>
