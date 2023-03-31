<template>
	<div style="width: 900px; margin: 0 auto; padding: 0 0 30px 0" class="column">
		<q-input
			dark
			bottom-slots
			v-model="pqcertHash"
			:label="$t('explorerPQCertSearchLabel')"
			counter
			maxlength="64"
			minlength="64"
			color="amber"
			style="margin-bottom: 30px"
			@keydown.enter.prevent="search(pqcertHash)"
			class="mono-font"
			:error="searchError"
			:error-message="errorText"
		>
			<template v-slot:append>
				<q-icon v-if="pqcertHash !== ''" name="close" @click="pqcertHash = ''" class="cursor-pointer"></q-icon>
				<q-icon name="search" class="cursor-pointer" @click="search(pqcertHash)"></q-icon>
			</template>
		</q-input>
		<div v-if="show" style="width: 100%">
			<div style="margin-bottom: 20px; width: 100%">
				<div class="text-subtitle1">{{ $t("pqcert") }}</div>
				<div class="list">
					<div class="row">
						<div>{{ $t("blockHash") }}</div>
						<div class="mono-font">
							{{ pqcertData.blockHash }}
							<q-btn
								class="open-in-new"
								flat
								icon="open_in_new"
								size="sm"
								padding="none"
								@click="goToExplorerPage('explorer-block-header', pqcertData.blockHash)"
							/>
						</div>
					</div>
					<div class="row">
						<div>{{ $t("blockHeight") }}</div>
						<div>{{ pqcertData.blockHeight }}</div>
					</div>
					<div class="row">
						<div>{{ $t("time") }}</div>
						<div>{{ new Date(pqcertData.blockTime * 1000).toLocaleString("en-US") }}</div>
					</div>
					<div class="row">
						<div>{{ $t("blockTxN") }}</div>
						<div>{{ pqcertData.blockTxn }}</div>
					</div>
					<div class="row">
						<div>{{ $t("txid") }}</div>
						<div>
							<span class="mono-font">{{ pqcertData.txid }}</span>
							<q-btn
								class="open-in-new"
								flat
								icon="open_in_new"
								size="sm"
								padding="none"
								@click="goToExplorerPage('explorer-tx', pqcertData.txid)"
							/>
						</div>
					</div>
				</div>
				<br />
				<div class="text-subtitle1">{{ $t("detail") }}</div>
				<div class="list" v-if="pqcertData.pqcert.pqcertType === 0">
					<div class="row">
						<div>{{ $t("pqcertHash") }}</div>
						<div class="mono-font">{{ pqcertData.pqcert.hash }}</div>
					</div>
					<div class="row">
						<div>{{ $t("pqcertType") }}</div>
						<div>{{ pqcertData.pqcert.pqcertType }}</div>
					</div>
					<div class="row">
						<div>{{ $t("pqcertLevel") }}</div>
						<div>{{ pqcertData.pqcert.level }}</div>
					</div>
					<div class="row">
						<div>{{ $t("pqcertVersion") }}</div>
						<div>{{ pqcertData.pqcert.version }}</div>
					</div>
					<div class="row" v-for="(pubKeyHash, i) in pqcertData.pqcert.pubKeyHashes">
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
				<div class="list" v-else-if="pqcertData.pqcert.pqcertType === 1">
					<div class="row">
						<div>{{ $t("pqcertHash") }}</div>
						<div class="mono-font">{{ pqcertData.pqcert.hash }}</div>
					</div>
					<div class="row">
						<div>{{ $t("pqcertType") }}</div>
						<div>{{ pqcertData.pqcert.pqcertType }}</div>
					</div>
					<div class="row">
						<div>{{ $t("signType") }}</div>
						<div>{{ pqcertData.pqcert.signType }}</div>
					</div>
					<div class="row no-wrap">
						<div>{{ $t("pubKey") }}</div>
						<div style="overflow: auto" class="mono-font">{{ pqcertData.pqcert.pubKey }}</div>
					</div>
				</div>
				<div class="q-px-sm list" v-else></div>
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
	import { bigIntToFloatString, numberFormat, getHexStrByBuf } from "../utils/utils";

	export default defineComponent({
		name: "ExplorerPQCertPage",
		data() {
			return {
				pqcertHash: ref(""),
				show: ref(false),
				hintShow: ref(true),
				pqcertData: ref({}),
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
				if (hash.length !== 64 || !/^([a-f0-9]{2})+$/.test(hash)) {
					this.searchError = true;
					this.errorText = this.$t("explorerPQCertInputHint");
					return;
				}

				let data = await this.getPQCert(hash);
				if (!data) {
					this.searchError = true;
					this.errorText = this.$t("notfound");
					return;
				}
				this.pqcertData = data;
				this.searchError = false;
				this.errorText = "";
				this.show = true;
				return true;
			},
			async getPQCert(hash) {
				let pqcertData = await window.electronAPI.getPqcertDetailsByHash(hash);
				if (!pqcertData.result) {
					return false;
				}
				pqcertData = pqcertData.result;
				pqcertData.blockHash = getHexStrByBuf(pqcertData.blockHash);
				pqcertData.txid = getHexStrByBuf(pqcertData.txid);
				return pqcertData;
			},
			bigIntToFloatString,
			numberFormat,
			async setInit(hash) {
				await this.search(hash);
				this.pqcertHash = hash;
			},
		},
	});
</script>
