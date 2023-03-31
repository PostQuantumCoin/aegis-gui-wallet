<template>
	<q-dialog persistent v-model="openFlag" class="bg-blur" @keyup.esc="openFlag = false">
		<q-layout
			view="hHh LpR fFf"
			container
			:style="{ width: '60%', maxWidth: '60%', height: windowHeight + 'px' }"
			class="theme-dialog-window-c0"
		>
			<q-header class="q-pl-lg q-py-xs">
				<q-toolbar class="q-px-sm" style="min-height: 40px">
					<q-toolbar-title class="text-h6">{{ address }}</q-toolbar-title>
					<q-btn class="close-btn" flat v-close-popup round dense icon="close" />
				</q-toolbar>
			</q-header>

			<q-page-container>
				<q-page :style-fn="containerTweak">
					<q-card class="bg-container scroll q-px-md q-pt-md q-pb-xs" style="min-width: 350px; max-height: 100%" flat>
						<q-card-section class="q-pt-none">
							<span class="text-body1">{{ $t("multiPqcSignatures") }}</span>
							<div class="q-px-sm">
								<div v-for="crypto in signSysList">
									<q-badge color="amber" class="text-dark">
										{{ crypto.index + 1 }}
									</q-badge>
									{{ $t(crypto.label) }}
								</div>
							</div>
						</q-card-section>
						<q-card-section class="q-pt-none">
							<div class="text-body1">{{ $t("addressSecurityLevel") + ": " + level }}</div>
							<div class="text-body1">{{ $t("addressFakeCert") + ": " + fakeCert }}</div>
						</q-card-section>
					</q-card>
				</q-page>
			</q-page-container>
		</q-layout>
	</q-dialog>
</template>

<script>
	import { defineComponent, ref } from "vue";
	import ProtoDialogVue from "./ProtoDialog.vue";

	export default defineComponent({
		name: "AddressDetail",
		extends: ProtoDialogVue,
		data() {
			return {
				address: "",
				signSysList: [],
				level: 0,
				fakeCert: 0,
			};
		},
		methods: {
			open(address, signSysList, level, fakeCert) {
				this.openFlag = true;
				this.address = address;
				this.signSysList = signSysList;
				this.level = level;
				this.fakeCert = fakeCert;
			},
		},
	});
</script>
