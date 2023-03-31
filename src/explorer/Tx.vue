<template>
	<div style="width: 900px; margin: 0 auto; padding: 0 0 30px 0" class="column">
		<q-input
			dark
			bottom-slots
			v-model="txid"
			:label="$t('explorerTxSearchLabel')"
			counter
			maxlength="64"
			minlength="64"
			color="amber"
			style="margin-bottom: 30px"
			@keydown.enter.prevent="search(txid)"
			class="mono-font"
			:error="searchError"
			:error-message="errorText"
		>
			<template v-slot:append>
				<q-icon v-if="txid !== ''" name="close" @click="txid = ''" class="cursor-pointer"></q-icon>
				<q-icon name="search" class="cursor-pointer" @click="search(txid)"></q-icon>
			</template>
		</q-input>
		<div v-if="show" style="width: 100%">
			<div style="margin-bottom: 20px; width: 100%">
				<div class="text-subtitle1">{{ $t("transation") }}</div>
				<div class="list">
					<div class="row">
						<div>{{ $t("blockHeight") }}</div>
						<div>{{ txData.blockHeight }}</div>
					</div>
					<div class="row">
						<div>{{ $t("blockHash") }}</div>
						<div class="mono-font">
							{{ txData.blockHash }}
							<q-btn
								class="open-in-new"
								flat
								icon="open_in_new"
								size="sm"
								padding="none"
								@click="goToExplorerPage('explorer-block-header', txData.blockHash)"
							/>
						</div>
					</div>
					<div class="row">
						<div>{{ $t("txid") }}</div>
						<div class="mono-font">{{ txData.txid }}</div>
					</div>
					<div class="row no-wrap">
						<div>{{ $t("time") }}</div>
						<div>{{ new Date(txData.blockTime * 1000).toLocaleString("en-US") }}</div>
					</div>
					<div class="row">
						<div>{{ $t("nLockTime") }}</div>
						<div>{{ txData.tx.nLockTime }}</div>
					</div>
					<div class="row no-wrap">
						<div>{{ $t("opReturn") }}</div>
						<div style="overflow: auto">{{ txData.tx.opReturn }}</div>
					</div>
					<div class="row">
						<div>{{ $t("pqcertAmount") }}</div>
						<div>{{ txData.tx.pqcert.length }}</div>
					</div>
					<div class="row">
						<div>{{ $t("confirmations") }}</div>
						<div>{{ txData.confirmations }}</div>
					</div>
					<div class="row">
						<div>{{ $t("txTotalInput") }}</div>
						<div>
							<span class="value unit">{{ numberFormat(bigIntToFloatString(txData.totalInput)) }}</span>
						</div>
					</div>
					<div class="row">
						<div>{{ $t("txTotalOutput") }}</div>
						<div>
							<span class="value unit">{{ numberFormat(bigIntToFloatString(txData.totalOutput)) }}</span>
						</div>
					</div>
					<div class="row">
						<div>{{ $t("fees") }}</div>
						<div>
							<span class="value unit">{{ numberFormat(bigIntToFloatString(txData.fee)) }}</span>
						</div>
					</div>
					<div class="row">
						<div>{{ $t("txVersion") }}</div>
						<div>{{ txData.tx.version }}</div>
					</div>
				</div>
			</div>
			<div style="width: 100%">
				<div class="text-subtitle1">{{ $t("txDetail") }}</div>
				<div class="list">
					<div class="q-pt-none" v-for="(vin, i) in txData.tx.vin">
						<div class="text-subtitle2">{{ `${this.$t("vin")} [${i}]` }}</div>
						<div class="q-px-sm list">
							<div class="row" v-for="(out, j) in vin.previousOutouts">
								<div>{{ `${this.$t("previousOutput")} [${j}]` }}</div>
								<q-btn
									class="open-in-new"
									flat
									icon="open_in_new"
									size="sm"
									padding="none"
									@click="goToExplorerPage('explorer-tx', out.txid)"
									style="margin-right: 5px"
								/>
								<div class="mono-font">{{ out.txid }}</div>
								<div style="margin-left: 10px">{{ out.voutn }}</div>
							</div>
							<div class="row">
								<div>{{ $t("sequence") }}</div>
								<div>{{ vin.sequence }}</div>
							</div>
							<div class="row no-wrap">
								<div>{{ $t("unlockScript") }}</div>
								<div class="mono-font" style="overflow: auto">{{ vin.unlockScript }}</div>
							</div>
						</div>
					</div>
					<div v-for="(vout, i) in txData.tx.vout">
						<div class="text-subtitle2">{{ `${this.$t("vout")} [${i}]` }}</div>
						<div class="q-px-sm list">
							<div class="row no-wrap">
								<div>{{ $t("lockScript") }}</div>
								<div class="mono-font" style="overflow: auto">{{ vout.lockScript }}</div>
							</div>
							<div class="row">
								<div>{{ $t("address") }}</div>
								<div class="mono-font">{{ vout.address }}</div>
							</div>
							<div class="row">
								<div>{{ $t("txValue") }}</div>
								<div>
									<span class="value unit">{{ numberFormat(bigIntToFloatString(vout.value)) }}</span>
								</div>
							</div>
							<div class="row">
								<div>{{ $t("txSpent") + " (" + $t("blockHeight").toLocaleLowerCase() + ")" }}</div>
								<div>
									{{ txData.voutspent[i] }}
									<q-btn
										v-if="txData.voutspent[i]"
										class="open-in-new"
										flat
										icon="open_in_new"
										size="sm"
										padding="none"
										@click="goToExplorerPage('explorer-block-header', txData.voutspent[i])"
									/>
								</div>
							</div>
						</div>
					</div>
					<div class="q-pt-none" v-for="(pqcert, i) in txData.tx.pqcert">
						<div class="text-subtitle2">{{ $t("pqcert") + " [" + i + "]" }}</div>
						<div class="q-px-sm list" v-if="pqcert.pqcertType === 0">
							<div class="row">
								<div>{{ $t("pqcertHash") }}</div>
								<div class="mono-font">
									{{ pqcert.hash }}
									<q-btn
										class="open-in-new"
										flat
										icon="open_in_new"
										size="sm"
										padding="none"
										@click="goToExplorerPage('explorer-pqcert', pqcert.hash)"
									/>
								</div>
							</div>
							<div class="row">
								<div>{{ $t("pqcertType") }}</div>
								<div>{{ pqcert.pqcertType }}</div>
							</div>
							<div class="row">
								<div>{{ $t("pqcertLevel") }}</div>
								<div>{{ pqcert.level }}</div>
							</div>
							<div class="row">
								<div>{{ $t("pqcertVersion") }}</div>
								<div>{{ pqcert.version }}</div>
							</div>
							<div class="row" v-for="(pubKeyHash, i) in pqcert.pubKeyHashes">
								<div>{{ $t("pubKeyHash") + " [" + i + "]" }}</div>
								<div class="mono-font">
									{{ pubKeyHash }}
									<q-btn
										class="open-in-new"
										flat
										icon="open_in_new"
										size="sm"
										padding="none"
										@click="goToExplorerPage('explorer-pqcert', pubKeyHash)"
									/>
								</div>
							</div>
						</div>
						<div class="q-px-sm list" v-else-if="pqcert.pqcertType === 1">
							<div class="row">
								<div>{{ $t("pqcertHash") }}</div>
								<div class="mono-font">
									{{ pqcert.hash }}
									<q-btn
										class="open-in-new"
										flat
										icon="open_in_new"
										size="sm"
										padding="none"
										@click="goToExplorerPage('explorer-pqcert', pqcert.hash)"
									/>
								</div>
							</div>
							<div class="row">
								<div>{{ $t("pqcertType") }}</div>
								<div>{{ pqcert.pqcertType }}</div>
							</div>
							<div class="row">
								<div>{{ $t("signType") }}</div>
								<div>{{ pqcert.signType }}</div>
							</div>
							<div class="row no-wrap">
								<div>{{ $t("pubKey") }}</div>
								<div style="overflow: scroll" class="mono-font">{{ pqcert.pubKey }}</div>
							</div>
						</div>
						<div class="q-px-sm list" v-else></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<style>
	.list > div > div:first-child {
		min-width: 200px;
	}
</style>
<script>
	import { defineComponent, ref } from "vue";
	import { bigIntToFloatString, numberFormat, getHexStrByBuf } from "../utils/utils";

	export default defineComponent({
		name: "ExplorerTxPage",
		data() {
			return {
				txid: ref(""),
				show: ref(false),
				hintShow: ref(false),
				txData: ref({}),
				searchError: ref(false),
				errorText: ref(""),
			};
		},
		props: {
			goToExplorerPage: Function,
		},
		methods: {
			containerTweak(offset) {
				return {
					height: offset ? `calc(100vh - ${offset}px)` : "100vh",
				};
			},
			async search(hash) {
				this.show = false;
				if (hash.length !== 64 || !/^([a-f0-9]{2})+$/.test(hash)) {
					this.searchError = true;
					this.errorText = this.$t("explorerTxInputHint");
					return;
				}

				let data = await this.getTx(hash);
				if (!data) {
					this.searchError = true;
					this.errorText = "Not found";
					return;
				}
				this.txData = data;
				this.searchError = false;
				this.errorText = "";
				this.show = true;
			},
			async getTx(hash) {
				let txData = await window.electronAPI.getTxDetials(hash);
				if (!txData) {
					return false;
				}
				txData.blockHash = getHexStrByBuf(txData.blockHash);
				return txData;
			},
			bigIntToFloatString,
			numberFormat,
			async setInit(hash) {
				await this.search(hash);
				this.txid = hash;
			},
		},
	});
</script>
