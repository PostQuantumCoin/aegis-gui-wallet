<template>
	<q-page class="flex flex-start q-pa-md" :style-fn="containerTweak">
		<div style="width: 100%; height: 100%" class="flex flex-center">
			<div class="q-pa-md col-grow" style="height: 100%">
				<q-table
					:title="$t('history')"
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
					style="height: 100%"
					@row-click="openTxDetail"
				>
					<template v-slot:top="props">
						<div style="margin-right: 5px">{{ $t("history") }}</div>
						<q-btn padding="none" flat icon="refresh" round size="12px" @click="refresh"></q-btn>
						<q-space />
						<SelectAddress ref="selectAddressRef" @change-address="changedAddress" class="select" />
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
					</template>
				</q-table>
			</div>
		</div>
	</q-page>
	<TransationDetail ref="txDetailRef" :detailData="txDetailData" :description="txDetailDescription" :goTo="goTo" />
</template>

<script>
	import { defineComponent, ref } from "vue";
	import SelectAddress from "src/components/AddressSelect.vue";
	import TransationDetail from "src/layouts/DetailTransation.vue";
	import { bigIntToFloatString, numberFormat, getHexStrByBuf, delay } from "../utils/utils";

	export default defineComponent({
		name: "TransationPage",
		data() {
			return {
				columns: ref([
					{
						label: this.$t("txid"),
						align: "left",
						field: "txid",
					},
					{
						label: this.$t("txType"),
						align: "center",
						field: "type",
						format: (value) => this.$t(value),
					},
					{
						label: this.$t("txValue"),
						align: "right",
						field: "value",
						format: (value) => numberFormat(bigIntToFloatString(value)),
						classes: "value unit",
					},
					{
						label: this.$t("time"),
						align: "right",
						field: "time",
						format: (val) => (Number.isInteger(val) ? new Date(val * 1000).toLocaleString("en-US") : "unconfirmed"),
					},
				]),
				address: ref(""),
				rows: ref([]),
				loading: ref(false),
				pagination: ref({
					page: 1,
					rowsPerPage: 20,
					rowsNumber: 21,
				}),
				txDetailData: ref({}),
				txDetailDescription: ref(""),
				refreshing: ref(false),
			};
		},
		props: {
			goTo: Function,
		},
		components: {
			SelectAddress,
			TransationDetail,
		},
		methods: {
			containerTweak(offset) {
				return {
					height: offset ? `calc(100vh - ${offset}px)` : "100vh",
				};
			},
			async walletGetTxList(rowsPerPage = 20, startRow) {
				return await window.electronAPI.walletGetTxList(this.address, rowsPerPage, startRow, true);
			},
			async onRequest(props) {
				const { page, rowsPerPage } = props.pagination;
				this.loading = true;
				let returnedData = await this.walletGetTxList(rowsPerPage, page - 1);
				await delay(200);
				let wait = [];
				if (page === 1) {
					returnedData.result.waitTx.forEach((x) => {
						let value = x.sendValue - x.receiveValue;
						if (value < 0) {
							x.type = "receive";
							x.value = -value;
						} else {
							x.type = "send";
							x.value = value;
						}
						wait.push(x);
					});
					returnedData.result.mining.forEach((x) => {
						let value = x.sendValue - x.receiveValue;
						if (value < 0) {
							x.type = "receive";
							x.value = -value;
						} else {
							x.type = "send";
							x.value = value;
						}
						wait.push(x);
					});
					this.rows.splice(0, this.rows.length, ...wait);
				}
				if (returnedData.result?.txList?.length > 0 || wait.length > 0) {
					returnedData.result.txList.forEach((x) => {
						let value = x.sendValue - x.receiveValue;
						if (value < 0) {
							x.type = "receive";
							x.value = -value;
						} else {
							x.type = "send";
							x.value = value;
						}
					});
					this.rows.splice(wait.length, this.rows.length, ...returnedData.result.txList);
					this.pagination.page = page;
					this.pagination.rowsPerPage = rowsPerPage;
					this.pagination.rowsNumber += returnedData.result.txList.length + 1;
				} else if (returnedData.result?.txList?.length === 0 && page === 1) {
					this.rows.splice(0, this.rows.length);
				}
				this.loading = false;
			},
			async changeWallet(walletData, address) {
				await this.$refs.selectAddressRef.changeWallet(walletData.id, address);
			},
			async changedAddress(address) {
				this.address = address;
				this.pagination.page = 1;
				await this.onRequest({ pagination: this.pagination });
			},
			async openTxDetail(evt, row, index) {
				if (!row.time) {
					let data = await window.electronAPI.getTxPoolDetials(row.txid);
					if (!data) return;
					this.txDetailData = data;
					this.txDetailDescription =
						row.type === "send"
							? `${this.$t("detail")} ( ${this.$t("send")} -> <span class="value">${numberFormat(
									bigIntToFloatString(row.value)
							  )}</span> AGS )`
							: `${this.$t("detail")} ( <span class="value">${numberFormat(
									bigIntToFloatString(row.value)
							  )}</span> AGS -> ${this.$t("receive")} )`;
					data.tx = data.blockTx;
					data.txid = data.blockTx.hash;
				} else {
					let data = await window.electronAPI.getTxDetials(row.txid);
					if (!data) return;
					data.blockHash = getHexStrByBuf(data.blockHash);
					this.txDetailData = data;
					this.txDetailDescription =
						row.type === "send"
							? `${this.$t("detail")} ( ${this.$t("send")} -> <span class="value">${numberFormat(
									bigIntToFloatString(row.value)
							  )}</span> AGS )`
							: `${this.$t("detail")} ( <span class="value">${numberFormat(
									bigIntToFloatString(row.value)
							  )}</span> AGS -> ${this.$t("receive")} )`;
				}
				this.$refs.txDetailRef.open();
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
			numberFormat: async (valueStr) => await window.electronAPI.numberFormat(valueStr),
		},
		async mounted() {},
	});
</script>
