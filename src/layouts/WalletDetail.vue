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
					<q-toolbar-title class="text-h6">{{ walletLabel }}</q-toolbar-title>
					<q-btn class="close-btn" flat v-close-popup round dense icon="close" />
				</q-toolbar>
			</q-header>

			<q-page-container>
				<q-page :style-fn="containerTweak">
					<q-card class="bg-container scroll q-px-md q-pt-md q-pb-xs" style="min-width: 350px; max-height: 100%" flat>
						<q-card-section class="q-px-md q-pt-none">
							<span class="text-body1">{{ $t("canUsedSignatures") }}</span>
							<div class="q-px-sm">
								<div v-for="crypto in signSysList">
									<q-badge color="amber" class="text-dark">
										{{ crypto.index + 1 }}
									</q-badge>
									{{ $t(crypto.label) }}
								</div>
							</div>
						</q-card-section>
					</q-card>
				</q-page>
			</q-page-container>
			<q-footer class="bg-unset row no-wrap justify-end q-py-sm q-px-md">
				<q-btn :label="$t('export')" @click="exportWallet" class="theme-button-confirm-c0" />
			</q-footer>
			<ConfirmDialog ref="exportDialogRef" />
		</q-layout>
	</q-dialog>
</template>

<script>
	import { defineComponent, ref } from "vue";
	import ProtoDialogVue from "./ProtoDialog.vue";
	import ConfirmDialog from "components/ConfirmDialog.vue";

	export default defineComponent({
		name: "WalletDetail",
		extends: ProtoDialogVue,
		data() {
			return {
				walletLabel: ref(""),
				signSysList: ref([]),
				exportFilePath: ref(""),
			};
		},
		components: {
			ConfirmDialog,
		},
		methods: {
			open(label, signSysList) {
				this.openFlag = true;
				this.walletLabel = label;
				this.signSysList = signSysList;
			},
			async exportWallet() {
				let exportStatus = await window.electronAPI.exportWalletFile(false);
				if (exportStatus?.result) {
					await this.$refs.exportDialogRef.openInfo(
						this.$t("success"),
						this.$t("exportWalletDone"),
						"check_circle",
						"green"
					);
					return (this.openFlag = false);
				} else {
					return this.$refs.exportDialogRef.openInfo(this.$t("error"), this.$t("exportWalletFail"), "error", "red");
				}
			},
		},
	});
</script>
