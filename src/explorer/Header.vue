<template>
	<div style="width: 900px; margin: 0 auto; padding: 0 0 30px 0" class="column">
		<q-input
			dark
			bottom-slots
			v-model="blockHash"
			:label="$t('explorerHeaderSearchLabel')"
			counter
			maxlength="64"
			minlength="64"
			color="amber"
			style="margin-bottom: 30px"
			@keydown.enter.prevent="search(blockHash)"
			class="mono-font"
			:error="searchError"
			:error-message="errorText"
		>
			<template v-slot:append>
				<q-icon v-if="blockHash !== ''" name="close" @click="blockHash = ''" class="cursor-pointer"></q-icon>
				<q-icon name="search" class="cursor-pointer" @click="search(blockHash)"></q-icon>
			</template>
		</q-input>
		<div v-if="show">
			<div style="margin-bottom: 20px">
				<div class="text-subtitle1">{{ $t("blockHeader") }}</div>
				<div class="list">
					<div class="row">
						<div>{{ $t("height") }}</div>
						<div>{{ blockData.height }}</div>
					</div>
					<div class="row">
						<div>{{ $t("hash") }}</div>
						<div class="mono-font">{{ blockData.header.hash }}</div>
					</div>
					<div class="row">
						<div>{{ $t("preHash") }}</div>
						<div class="mono-font">
							{{ blockData.header.preHash }}
							<q-btn
								class="open-in-new"
								flat
								icon="open_in_new"
								size="sm"
								padding="none"
								@click="goToExplorerPage('explorer-block-header', blockData.header.preHash)"
							/>
						</div>
					</div>
					<div class="row">
						<div>{{ $t("merkleroot") }}</div>
						<div class="mono-font">{{ blockData.header.merkleroot }}</div>
					</div>
					<div class="row">
						<div>{{ $t("nBit") }}</div>
						<div class="mono-font">{{ blockData.header.nBit }}</div>
					</div>
					<div class="row">
						<div>{{ $t("nonce") }}</div>
						<div class="mono-font">{{ blockData.header.nonce }}</div>
					</div>
					<div class="row">
						<div>{{ $t("time") }}</div>
						<div>{{ new Date(blockData.header.time * 1000).toLocaleString("en-US") }}</div>
					</div>
					<div class="row">
						<div>{{ $t("blockVersion") }}</div>
						<div>{{ blockData.header.version }}</div>
					</div>
				</div>
			</div>
			<div>
				<div class="text-subtitle1">{{ $t("blockTx") }}</div>
				<div class="list">
					<div class="row" v-for="(txhash, i) in blockData.txidList">
						<div>{{ `${this.$t("transation")} [${i}]` }}</div>
						<div class="mono-font">
							{{ txhash }}
							<q-btn
								class="open-in-new"
								flat
								icon="open_in_new"
								size="sm"
								padding="none"
								@click="goToExplorerPage('explorer-tx', txhash)"
							/>
						</div>
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

	export default defineComponent({
		name: "ExplorerHeaderPage",
		data() {
			return {
				blockHash: ref(""),
				show: ref(false),
				hintShow: ref(false),
				dense: ref(false),
				blockData: ref({ height: 0, header: {}, txidList: {} }),
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
				let data;
				if (hash.length !== 64 || !/^([a-f0-9]{2})+$/.test(hash)) {
					let height = parseInt(hash);
					if (Number.isNaN(height) || 4030165 < height || height < 0) {
						this.searchError = true;
						this.errorText = this.$t("explorerHeaderInputHint");
						return;
					}
					data = await this.getBlockHeaderByHeight(height);
				} else {
					data = await this.getBlockHeaderByHash(hash);
				}

				if (!data) {
					this.searchError = true;
					this.errorText = this.$t("notfound");
					return;
				}
				this.blockData.height = data.height;
				this.blockData.header = data.header;
				this.blockData.txidList = data.txidList.map((x) => {
					let txidStr = "";
					for (let i = 0; i < x.length; i++) {
						txidStr += x[i].toString(16).padStart(2, "0");
					}
					return txidStr;
				});
				this.searchError = false;
				this.errorText = "";
				this.show = true;
			},
			async setInit(hash) {
				await this.search(hash);
				this.blockHash = hash;
			},
			async getBlockHeaderByHash(hash) {
				let blockData = await window.electronAPI.getBlockDataByHash(hash);
				if (!blockData.result) {
					return false;
				}
				return blockData.result;
			},
			async getBlockHeaderByHeight(height) {
				let blockData = await window.electronAPI.getBlockDataByHeight(height);
				if (!blockData.result) {
					return false;
				}
				return blockData.result;
			},
		},
	});
</script>
