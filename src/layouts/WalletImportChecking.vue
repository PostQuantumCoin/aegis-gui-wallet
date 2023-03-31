<template>
	<q-dialog persistent v-model="openFlag" class="bg-blur" @keyup.esc="openFlag = false">
		<q-layout
			view="hHh LpR fFf"
			container
			:style="{ width: '40%', maxWidth: '40%', height: windowHeight + 'px' }"
			class="theme-dialog-window-c0"
		>
			<q-header class="q-pl-lg q-py-xs">
				<q-toolbar class="q-px-sm" style="min-height: 40px">
					<q-toolbar-title class="text-h6">{{ $t("selectWallet") }}</q-toolbar-title>
					<q-btn class="close-btn" flat v-close-popup round dense icon="close" />
				</q-toolbar>
			</q-header>

			<q-page-container>
				<q-page :style-fn="containerTweak">
					<q-table
						title=""
						ref="tableRef"
						:rows="walletsData"
						:columns="columns"
						style="overflow: scroll; height: 100%"
						card-container-class="theme-table-grid-c0"
						row-key="key"
						selection="multiple"
						v-model:selected="selected"
						v-model:pagination="pagination"
						grid
						hide-header
						hide-bottom
					>
						<template v-slot:item="props">
							<div class="q-pa-xs" :class="props.selected ? 'selected' : ''" style="width: 100%">
								<q-card>
									<q-card-section>
										<q-checkbox dense v-model="props.selected" :label="props.row.label" color="amber" />
									</q-card-section>
									<q-separator />
									<q-list dense>
										<q-item v-for="col in props.cols">
											<div v-if="col.name === 'password'" class="row q-item-middle">
												<q-item-section v-if="col.value !== undefined">
													<q-item-label>{{ col.label }}</q-item-label>
												</q-item-section>
												<q-item-section v-if="col.value !== undefined">
													<q-input
														square
														filled
														dense
														:ref="'passwordRef' + props.row.key"
														color="amber"
														v-model="props.row.password"
														:error="props.row.passwordEmpty"
														:error-message="$t('passwordIsEmpty')"
														:placeholder="$t('walletPasswordPlaceholder')"
														type="password"
														@update:model-value="
															(value) => {
																if (value.length > 0) props.row.passwordEmpty = false;
																else props.row.passwordEmpty = true;
															}
														"
													/>
												</q-item-section>
											</div>
											<div v-else class="row q-item-middle">
												<q-item-section>
													<q-item-label>{{ col.label }}</q-item-label>
												</q-item-section>
												<q-item-section>
													<q-item-label>{{ col.value }}</q-item-label>
												</q-item-section>
											</div>
										</q-item>
									</q-list>
								</q-card>
							</div>
						</template>
						<template v-slot:bottom></template>
					</q-table>
				</q-page>
			</q-page-container>
			<q-footer class="bg-unset row no-wrap justify-end q-py-sm q-px-md">
				<q-btn :label="$t('import')" @click="importWallet" class="theme-button-confirm-c0" />
			</q-footer>
		</q-layout>
		<WalletImportInfo ref="walletImportInfoRef" />
	</q-dialog>
</template>
<script>
	import { defineComponent, ref, toRaw } from "vue";
	import ProtoDialogVue from "./ProtoDialog.vue";
	import WalletImportInfo from "src/layouts/WalletImportInfo.vue";
	import { useLoadingStore } from "stores/loading";
	import { delay, checkReindexAfter } from "src/utils/utils";

	const columns = [
		{ name: "addrsAmount", align: "center", label: "Address amount", field: "addrsAmount" },
		{ name: "password", align: "center", label: "Password", field: "password" },
	];
	
	export default defineComponent({
		name: "WalletImportChecking",
		extends: ProtoDialogVue,
		data() {
			return {
				walletsData: ref([]),
				selected: ref([]),
				columns: columns,
				pagination: ref({
					page: 1,
					rowsPerPage: 9999,
				}),
			};
		},
		setup() {
			const loadingStore = useLoadingStore();
			const openLoading = (...args) => loadingStore.openLoading(...args);
			const closeLoading = () => loadingStore.closeLoading();
			return { openLoading, closeLoading };
		},
		components: {
			WalletImportInfo,
		},
		emits: ["importWallet"],
		methods: {
			open(importData) {
				this.openFlag = true;
				this.walletsData = [];
				this.$nextTick(function () {
					if (Array.isArray(importData.wallets)) {
						importData.wallets.map((item, index) => {
							item.key = index;
							item.addrsAmount = item.addrs.length;
							if (item.encryptionFlag) {
								item.password = ref("");
							}
							this.walletsData.push(item);
							this.selected.push(item);
						});
					}
				});
			},
			checkImportWalletInput() {
				let errorPos = -1;
				for (let i = 0; i < this.selected.length; i++) {
					let item = toRaw(this.selected[i]);
					if (item.encryptionFlag && item.password.value === "") {
						this.selected[i].passwordEmpty = true;
						if (this.$refs["passwordRef" + item.key] && this.$refs["passwordRef" + item.key][0]) {
							let nativeEl = this.$refs["passwordRef" + item.key][0].getNativeElement();
							nativeEl.scrollIntoView();
							if (errorPos < 0) {
								errorPos = item.key;
							}
						}
					}
				}
				return errorPos < 0;
			},
			async importWallet() {
				if (!this.checkImportWalletInput()) return;
				let success = [];
				let duplicate = [];
				let error = [];
				this.openLoading(this.$t("importing"), true);
				for (let i = 0; i < this.selected.length; i++) {
					try {
						let msg = {
							keySeed: Array.from(this.selected[i].keySeed),
							addrSeed: Array.from(this.selected[i].addrSeed),
							addrs: toRaw(this.selected[i].addrs),
							encryptionFlag: this.selected[i].encryptionFlag,
							label: this.selected[i].label,
							password: this.selected[i].password,
						};
						let r = await window.electronAPI.importWalletByJson(JSON.stringify(msg));
						if (r === false || r?.error) {
							error.push(this.selected[i].label);
						} else if (typeof r.duplicated === "number") {
							duplicate.push(this.selected[i].label);
						} else {
							success.push(this.selected[i].label);
						}
					} catch (e) {
						return e;
					}
					await delay(500);
				}
				if (success.length > 0) {
					await window.electronAPI.walletReindex(0);
					await checkReindexAfter();
				}
				this.closeLoading();
				await this.$refs.walletImportInfoRef.open(success, error, duplicate);
				this.$emit("importWallet", {
					result: {
						success,
						error,
						duplicate,
					},
				});
				this.openFlag = false;
			},
		},
	});
</script>
