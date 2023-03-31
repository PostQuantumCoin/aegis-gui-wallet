<template>
	<q-dialog persistent v-model="openFlag" class="bg-blur" @keyup.esc="openFlag = false">
		<q-layout
			view="hHh LpR fFf"
			container
			:style="{ width: '60%', maxWidth: '60%', height: windowHeight + 'px' }"
			class="theme-dialog-window-c0"
		>
			<q-header class="q-pl-lg q-py-xs">
				<q-toolbar class="q-pl-sm" style="min-height: 40px">
					<q-toolbar-title class="text-h6">{{ $t("addAddress") }}</q-toolbar-title>
					<q-btn class="close-btn" flat v-close-popup round dense icon="close" />
				</q-toolbar>
			</q-header>

			<q-page-container>
				<q-page :style-fn="containerTweak">
					<q-card class="scroll q-px-md q-pt-lg q-pb-xs" style="min-width: 350px; max-height: 100%" flat>
						<q-card-section class="q-pt-none">
							<span class="text-body1">{{ $t("multiPqcSignatures") }}</span>
							<CryptoCheckbox ref="signSysListRef" :minAmount="selectLevel" />
						</q-card-section>
						<q-card-section class="q-pt-none">
							<div class="text-body1" style="display: inline-flex; justify-content: center; align-items: center">
								{{ $t("addressSecurityLevel") + ": " + selectLevel }}
								<HelpTooltips align="right" color="c0" size="md" :tooltipText="$t('addressSecurityLevelHint')" />
							</div>
							<div class="q-px-sm">
								<q-slider dark v-model="selectLevel" :min="2" :max="maxLevel" color="amber" markers />
							</div>
							<span class="text-body1"
								>{{ $t("addressFakeCert") + ": " + selectFakeCert }}
								<HelpTooltips align="right" color="c0" size="md" :tooltipText="$t('addressFakeCertHint')" />
							</span>
							<div class="q-px-sm">
								<q-slider dark v-model="selectFakeCert" :min="0" :max="5" color="amber" markers />
							</div>
							<div>
								<q-checkbox v-model="shuffle" :label="$t('addressShuffle')" color="amber" keep-color />
								<HelpTooltips align="right" color="c0" size="md" :tooltipText="$t('addressShuffleHint')" />
							</div>
						</q-card-section>
					</q-card>
				</q-page>
			</q-page-container>
			<q-footer class="bg-unset row no-wrap justify-end q-py-sm q-px-md">
				<q-btn flat :label="$t('cancel')" class="theme-button-cancel-c0" v-close-popup />
				<q-btn :label="$t('confirm')" class="theme-button-confirm-c0" @click="addAddress" />
			</q-footer>
		</q-layout>
	</q-dialog>
</template>

<script>
	import { defineComponent, ref } from "vue";
	import ProtoDialogVue from "./ProtoDialog.vue";
	import CryptoCheckbox from "src/components/CryptoCheckbox.vue";
	import HelpTooltips from "components/HelpTooltips.vue";

	export default defineComponent({
		name: "AddressAdd",
		extends: ProtoDialogVue,
		data() {
			return {
				shuffle: ref(true),
				selectFakeCert: ref(1),
				selectLevel: ref(2),
				maxLevel: ref(0),
			};
		},
		components: {
			CryptoCheckbox,
			HelpTooltips,
		},
		emits: ["newAddress"],
		methods: {
			open(signSysList) {
				this.openFlag = true;
				this.$nextTick(function () {
					if (Array.isArray(signSysList)) {
						this.maxLevel = signSysList.length;
						this.selectLevel = 2;
						this.selectFakeCert = 1;
						this.shuffle = true;
						this.$refs.signSysListRef.init(signSysList);
						this.$refs.signSysListRef.selectAll();
					}
				});
			},
			getNewAddressData() {
				let signSysList = this.$refs.signSysListRef.getData();
				if (!Array.isArray(signSysList)) return false;
				return {
					level: this.selectLevel,
					keypairs: signSysList,
					fakeCert: this.selectFakeCert,
					shuffle: this.shuffle,
				};
			},
			async addAddress() {
				let data = this.getNewAddressData();
				if (data) {
					let r = await window.electronAPI.walletAddAddress(data.keypairs, data.level, data.fakeCert, 0, data.shuffle);
					if (r.result) {
						this.$emit("newAddress", { data: r.result });
					} else {
						this.$emit("newAddress", { err: true });
					}
				} else {
					this.$emit("newAddress", { err: true });
				}
				this.openFlag = false;
			},
		},
	});
</script>
