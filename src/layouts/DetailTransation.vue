<template>
	<q-dialog persistent v-model="openFlag" class="bg-blur" @keyup.esc="openFlag = false">
		<q-layout
			view="hHh LpR fFf"
			container
			:style="{ width: '900px', maxWidth: '900px', height: windowHeight + 'px' }"
			class="theme-dialog-window-c0 theme-card"
		>
			<q-header class="q-pl-lg q-py-xs">
				<q-toolbar class="q-px-sm" style="min-height: 40px">
					<q-toolbar-title class="text-h6" v-html="description"></q-toolbar-title>
					<q-btn class="close-btn" flat v-close-popup round dense icon="close" />
				</q-toolbar>
			</q-header>

			<q-page-container>
				<q-page :style-fn="containerTweak">
					<q-card class="bg-container scroll q-px-md q-pt-md q-pb-xs" style="min-width: 350px; max-height: 100%" flat>
						<q-card-section class="q-pt-none">
							<div class="text-subtitle1">{{ $t("transation") }}</div>
							<div class="q-px-sm list">
								<div class="row" v-if="detailData.blockHeight !== undefined">
									<div>{{ $t("blockHeight") }}</div>
									<div>{{ detailData.blockHeight }}</div>
								</div>
								<div class="row" v-if="detailData.blockHeight !== undefined">
									<div>{{ $t("blockHash") }}</div>
									<div>
										<span class="mono-font">{{ detailData.blockHash }}</span>
										<q-btn
											class="open-in-new"
											flat
											icon="open_in_new"
											size="sm"
											padding="none"
											@click="
												goTo('explorerPage', { page: 'explorer-block-header', props: detailData.blockHash })
											"
										/>
									</div>
								</div>
								<div class="row">
									<div>{{ $t("txid") }}</div>
									<div>
										<span class="mono-font">{{ detailData.txid }}</span>
										<q-btn
											v-if="detailData.blockTime"
											class="open-in-new"
											flat
											icon="open_in_new"
											size="sm"
											padding="none"
											@click="goTo('explorerPage', { page: 'explorer-tx', props: detailData.txid })"
										/>
									</div>
								</div>
								<div class="row no-wrap">
									<div>{{ $t("time") }}</div>
									<div v-if="detailData.blockTime">
										{{ new Date(detailData.blockTime * 1000).toLocaleString("en-US") }}
									</div>
									<div v-else class="text-red">{{ $t("txUnconfirm") }}</div>
								</div>
								<div class="row">
									<div>{{ $t("nLockTime") }}</div>
									<div>{{ detailData.tx.nLockTime }}</div>
								</div>
								<div class="row no-wrap">
									<div>{{ $t("opReturn") }}</div>
									<div style="overflow: auto">{{ detailData.tx.opReturn }}</div>
								</div>
								<div class="row">
									<div>{{ $t("pqcertAmount") }}</div>
									<div>{{ detailData.tx.pqcert.length }}</div>
								</div>
								<div class="row">
									<div>{{ $t("txConfirmations") }}</div>
									<div>{{ detailData.confirmations }}</div>
								</div>
								<div class="row">
									<div>{{ $t("txTotalInput") }}</div>
									<div>
										<span class="value unit">{{ numberFormat(bigIntToFloatString(detailData.totalInput)) }}</span>
									</div>
								</div>
								<div class="row">
									<div>{{ $t("txTotalOutput") }}</div>
									<div>
										<span class="value unit">{{ numberFormat(bigIntToFloatString(detailData.totalOutput)) }}</span>
									</div>
								</div>
								<div class="row">
									<div>{{ $t("fees") }}</div>
									<div>
										<span class="value unit">{{ numberFormat(bigIntToFloatString(detailData.fee)) }}</span>
									</div>
								</div>
								<div class="row">
									<div>{{ $t("txVersion") }}</div>
									<div>{{ detailData.tx.version }}</div>
								</div>
							</div>
						</q-card-section>
						<q-card-section class="q-pt-none" v-for="(vin, i) in detailData.tx.vin">
							<div class="text-subtitle1">{{ $t("vin") + " [" + i + "]" }}</div>
							<div class="q-px-sm list">
								<div class="row" v-for="(out, j) in vin.previousOutouts">
									<div>{{ $t("previousOutput") + " [" + j + "]" }}</div>
									<q-btn
										class="open-in-new"
										flat
										icon="open_in_new"
										size="sm"
										padding="none"
										@click="goTo('explorerPage', { page: 'explorer-tx', props: out.txid })"
										style="margin-right: 5px"
									/>
									<div class="mono-font">{{ out.txid }}</div>
									<div style="margin-left: 10px">{{ out.voutn }}</div>
								</div>
								<div class="row">
									<div>{{ $t("txSequence") }}</div>
									<div>{{ vin.sequence }}</div>
								</div>
								<div class="row no-wrap">
									<div>{{ $t("unlockScript") }}</div>
									<div class="mono-font" style="overflow: auto">{{ vin.unlockScript }}</div>
								</div>
							</div>
						</q-card-section>
						<q-card-section class="q-pt-none" v-for="(vout, i) in detailData.tx.vout">
							<div class="text-body1">{{ $t("vout") + " [" + i + "]" }}</div>
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
								<div class="row" v-if="detailData.voutspent">
									<div>{{ $t("txSpent") + " (" + $t("blockHeight").toLocaleLowerCase() + ")" }}</div>
									<div>
										{{ detailData.voutspent[i] }}
										<q-btn
											v-if="detailData.voutspent[i]"
											class="open-in-new"
											flat
											icon="open_in_new"
											size="sm"
											padding="none"
											@click="
												goTo('explorerPage', { page: 'explorer-block-header', props: detailData.voutspent[i] })
											"
										/>
									</div>
								</div>
							</div>
						</q-card-section>
						<q-card-section class="q-pt-none" v-for="(pqcert, i) in detailData.tx.pqcert">
							<div class="text-body1">{{ $t("pqcert") + " [" + i + "]" }}</div>
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
											@click="goTo('explorerPage', { page: 'explorer-pqcert', props: pqcert.hash })"
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
											@click="goTo('explorerPage', { page: 'explorer-pqcert', props: pubKeyHash })"
										/>
									</div>
								</div>
							</div>
							<div class="q-px-sm list" v-else-if="pqcert.pqcertType === 1">
								<div class="row">
									<div>{{ $t("pqcertHash") }}</div>
									<div>
										<span class="mono-font">{{ pqcert.hash }}</span>
										<q-btn
											class="open-in-new"
											flat
											icon="open_in_new"
											size="sm"
											padding="none"
											@click="goTo('explorerPage', { page: 'explorer-pqcert', props: pqcert.hash })"
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
									<div style="overflow: auto" class="mono-font">{{ pqcert.pubKey }}</div>
								</div>
							</div>
							<div class="q-px-sm list" v-else></div>
						</q-card-section>
					</q-card>
				</q-page>
			</q-page-container>
		</q-layout>
	</q-dialog>
</template>
<style scoped>
	.list > div > div:first-child {
		min-width: 150px;
	}
</style>

<script>
	import { defineComponent, ref } from "vue";
	import { bigIntToFloatString, numberFormat } from "../utils/utils";
	import ProtoDialogVue from "./ProtoDialog.vue";
	import { containerLg } from "../utils/common";

	export default defineComponent({
		name: "transationDetail",
		extends: ProtoDialogVue,
		data: {
			windowHeight: ref(containerLg.height),
		},
		props: {
			detailData: Object,
			description: String,
			goTo: Function,
		},
		methods: {
			containerTweak: containerLg.tweak,
			bigIntToFloatString,
			numberFormat,
		},
	});
</script>
