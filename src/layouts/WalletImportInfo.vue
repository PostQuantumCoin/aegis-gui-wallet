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
					<q-toolbar-title class="text-h6">{{ $t("result") }}</q-toolbar-title>
					<q-btn class="close-btn" flat round dense icon="close" @click="closeDialog" />
				</q-toolbar>
			</q-header>

			<q-page-container>
				<q-page :style-fn="containerTweak">
					<q-card class="bg-container scroll q-px-md q-pt-md q-pb-xs" style="min-width: 350px; max-height: 100%" flat>
						<q-card-section class="q-pt-none" v-if="errorData.length > 0">
							<span class="text-body1 text-error">{{ $t("importError") }}</span>
							<div class="q-px-sm">
								<div v-for="(item, index) in errorData">
									<q-badge color="amber" class="text-dark">
										{{ index + 1 }}
									</q-badge>
									{{ item }}
								</div>
							</div>
						</q-card-section>
						<q-card-section class="q-pt-none" v-if="successData.length > 0">
							<span class="text-body1">{{ $t("importSuccess") }}</span>
							<div class="q-px-sm">
								<div v-for="(item, index) in successData">
									<q-badge color="amber" class="text-dark">
										{{ index + 1 }}
									</q-badge>
									{{ item }}
								</div>
							</div>
						</q-card-section>
						<q-card-section class="q-pt-none" v-if="duplicateData.length > 0">
							<span class="text-body1 text-yellow-8">{{ $t("importDuplicate") }}</span>
							<div class="q-px-sm">
								<div v-for="(item, index) in duplicateData">
									<q-badge color="amber" class="text-dark">
										{{ index + 1 }}
									</q-badge>
									{{ item }}
								</div>
							</div>
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
	
	let asyncRes = undefined;

	export default defineComponent({
		name: "WalletImportInfo",
		extends: ProtoDialogVue,
		data() {
			return {
				successData: ref([]),
				errorData: ref([]),
				duplicateData: ref([]),
			};
		},
		methods: {
			open(success, error, duplicate) {
				return new Promise((res) => {
					asyncRes = res;
					this.openFlag = true;
					if (Array.isArray(success)) {
						this.successData = success;
					} else {
						this.successData = [];
					}
					if (Array.isArray(error)) {
						this.errorData = error;
					} else {
						this.errorData = [];
					}
					if (Array.isArray(duplicate)) {
						this.duplicateData = duplicate;
					} else {
						this.duplicateData = [];
					}
				});
			},
			closeDialog() {
				if (asyncRes) {
					asyncRes(true);
				}
				this.openFlag = false;
			},
		},
	});
</script>
