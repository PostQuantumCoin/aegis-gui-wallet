<template>
	<div style="width: 100%; height: 100%" class="flex flex-center">
		<div class="q-pa-md col-grow" style="height: 100%; padding: 0">
			<q-table
				title="Block List"
				:rows="rows"
				:columns="columns"
				:loading="loading"
				@request="onRequest"
				v-model:pagination="pagination"
				:rows-per-page-options="[20]"
				color="deep-purple-2"
				dark
				virtual-scroll
				class="mono-font theme-card"
				style="height: 100% padding: 0; background-color: transparent; backdrop-filter: none"
			>
				<template v-slot:top="props">
					<div style="margin-right: 5px">{{ $t("blockList") }}</div>
					<q-btn padding="none" flat icon="refresh" round size="12px" @click="refresh"></q-btn>
					<q-space />
				</template>
				<template v-slot:pagination="scope">
					<q-btn
						v-if="scope.pagesNumber > 2"
						icon="first_page"
						color="deep-purple-2"
						round
						dense
						flat
						:disable="scope.isFirstPage"
						@click="scope.firstPage"
					></q-btn>

					<q-btn
						icon="chevron_left"
						color="deep-purple-2"
						round
						dense
						flat
						:disable="scope.isFirstPage"
						@click="scope.prevPage"
					></q-btn>

					<q-btn
						icon="chevron_right"
						color="deep-purple-2"
						round
						dense
						flat
						:disable="scope.isLastPage"
						@click="scope.nextPage"
					></q-btn>

					<q-btn
						icon="last_page"
						color="deep-purple-2"
						round
						dense
						flat
						:disable="scope.islastPage"
						@click="scope.lastPage"
					></q-btn>
				</template>
				<template v-slot:body-cell-hash="hash">
					<q-td>
						{{ hash.value }}
						<q-btn
							class="open-in-new"
							flat
							icon="open_in_new"
							size="sm"
							padding="none"
							@click="goToExplorerPage('explorer-block-header', hash.value)"
					/></q-td>
				</template>
			</q-table>
		</div>
	</div>
</template>

<script>
	import { defineComponent, ref } from "vue";
	import { bigIntToFloatString, numberFormat, delay } from "../utils/utils";

	export default defineComponent({
		name: "BlockList",
		data() {
			return {
				columns: ref([
					{
						label: this.$t("height"),
						align: "left",
						field: "height",
						style: "min-width: 110px",
					},
					{
						label: this.$t("hash"),
						align: "center",
						field: "hash",
						name: "hash",
					},
					{
						label: this.$t("txCount"),
						align: "right",
						field: "txCount",
					},
					{
						label: this.$t("time"),
						align: "right",
						field: "time",
						style: "min-width: 250px",
						format: (val) => new Date(val * 1000).toLocaleString("en-US"),
					},
					{
						label: this.$t("txConfirmations"),
						align: "right",
						field: "confirmations",
						style: "min-width: 110px",
					},
				]),
				rows: ref([]),
				loading: ref(false),
				pagination: ref({
					sortBy: "height",
					page: 1,
					rowsPerPage: 20,
					rowsNumber: 0,
				}),
			};
		},
		props: {
			goToExplorerPage: Function,
		},
		methods: {
			async getBlockList(rowsPerPage = 20, startRow, sortBy) {
				let lastHeight = await window.electronAPI.getLastBlockHeight();
				if (lastHeight.result === undefined) return;
				lastHeight = lastHeight.result;
				this.pagination.rowsNumber = lastHeight;
				let startHeight = lastHeight - startRow * rowsPerPage;
				let blockData = [];
				for (let i = 0; i < rowsPerPage; i++) {
					let temp = await window.electronAPI.getBlockDataByHeight(startHeight - i);
					if (!temp.result) {
						break;
					}
					let thisHeight = startHeight - i;
					blockData[i] = {
						height: thisHeight,
						hash: temp.result.header.hash,
						txCount: temp.result.txidList.length,
						time: temp.result.header.time,
						confirmations: lastHeight - thisHeight + 1,
					};
				}
				return blockData;
			},
			async onRequest(props) {
				const { page, rowsPerPage, sortBy /*, descending*/ } = props.pagination;
				this.loading = true;
				await delay(200);
				let returnedData = await this.getBlockList(rowsPerPage, page - 1, sortBy);
				if (returnedData.length > 0) {
					this.rows.splice(0, this.rows.length, ...returnedData);
					this.pagination.page = page;
					this.pagination.rowsPerPage = rowsPerPage;
				} else if (returnedData.result?.txList?.length === 0 && this.pagination.page === 1) {
					this.rows.splice(0, this.rows.length, ...returnedData);
				}
				this.loading = false;
			},
			containerTweak(offset) {
				return {
					height: offset ? `calc(100vh - ${offset}px)` : "100vh",
				};
			},
			async refresh(evt) {
				if (this.refreshing) return;
				this.refreshing = true;
				evt.target.classList.add("refresh-ani");
				await delay(500);
				await this.onRequest({ pagination: this.pagination });
				evt.target.classList.remove("refresh-ani");
				this.refreshing = false;
			},
			setInit(data) {},
		},
		async mounted() {
			this.onRequest({ pagination: this.pagination });
		},
	});
</script>
