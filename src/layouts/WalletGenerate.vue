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
					<q-toolbar-title class="text-h6">{{ $t("genWallet") }}</q-toolbar-title>
					<q-btn class="close-btn" flat v-close-popup round dense icon="close" />
				</q-toolbar>
			</q-header>
			<q-page-container>
				<q-page :style-fn="containerTweak">
					<q-stepper
						class="theme-card"
						vertical
						v-model="step"
						dark
						ref="stepper"
						animated
						style="min-width: 100%"
						flat
						active-color="c0"
						done-color="amber"
					>
						<q-step name="selectAddType" :title="$t('selectAddType')" icon="wallet">
							<q-stepper-navigation>
								<q-btn :label="$t('import')" class="theme-button-confirm-c0" @click="importWallet" />
								<q-btn :label="$t('generate')" class="theme-button-confirm-c0" @click="goToNewWallet" />
							</q-stepper-navigation>
						</q-step>
						<q-step name="generateWallet" :title="$t('genWallet')" icon="wallet">
							<q-card class="bg-container scroll q-pb-xs" style="min-width: 350px; max-height: 100%" flat>
								<q-card-section class="q-pt-none">
									<div class="text-body1">{{ $t("label") }}</div>
									<q-input
										ref="walletNameRef"
										v-model="walletName"
										dark
										dense
										color="amber"
										hint=""
										lazy-rules
										:rules="walletNameRules"
										:placeholder="$t('walletLabelPlaceholder')"
									/>
								</q-card-section>
								<q-card-section class="q-pt-none">
									<span class="text-body1">{{ $t("signatureSystem") }}</span>
									<q-toggle color="amber" v-model="ssDefaultSlide" :label="$t('default').toLocaleLowerCase()" />
									<q-slide-transition v-show="!ssDefaultSlide" :duration="750">
										<CryptoCheckbox ref="signSysListRef" :isDefault="ssDefaultSlide" :minAmount="3" />
									</q-slide-transition>
								</q-card-section>
								<q-card-section class="q-pt-none">
									<span class="text-body1">{{ $t("password") }}</span>
									<q-toggle color="amber" v-model="pwSlide" label="" />
									<q-slide-transition v-show="pwSlide" :duration="300">
										<div>
											<q-input
												ref="passwordRef"
												v-model="password"
												dark
												dense
												color="amber"
												:type="pwVisible ? 'text' : 'password'"
												hint=""
												lazy-rules
												:rules="pwRules"
												:placeholder="$t('walletPasswordPlaceholder')"
											>
												<template v-slot:append>
													<q-icon
														:name="pwVisible ? 'visibility_off' : 'visibility'"
														class="cursor-pointer"
														@click="pwVisible = !pwVisible"
													/>
												</template>
											</q-input>
											<q-input
												ref="passwordCheckRef"
												v-model="passwordCheck"
												dark
												dense
												color="amber"
												:type="pwCheckVisible ? 'text' : 'password'"
												hint=""
												lazy-rules
												:rules="pwCheckRules"
												:placeholder="$t('walletPasswordCheckPlaceholder')"
											>
												<template v-slot:append>
													<q-icon
														:name="pwCheckVisible ? 'visibility_off' : 'visibility'"
														class="cursor-pointer"
														@click="pwCheckVisible = !pwCheckVisible"
													/>
												</template>
											</q-input>
										</div>
									</q-slide-transition>
								</q-card-section>
							</q-card>
							<q-stepper-navigation>
								<div class="row justify-end" style="width: 100%">
									<q-btn
										flat
										:label="$t('back')"
										class="theme-button-cancel-c0"
										@click="$refs.stepper.goTo('selectAddType')"
									/>
									<q-btn :label="$t('confirm')" class="theme-button-confirm-c0" @click="addWallet" />
								</div>
							</q-stepper-navigation>
						</q-step>
					</q-stepper>
				</q-page>
			</q-page-container>
		</q-layout>
		<WalletImportChecking ref="walletImportChecking" @import-wallet="importWalletResult" />
	</q-dialog>
</template>

<script>
	import { defineComponent, ref, inject } from "vue";
	import CryptoCheckbox from "src/components/CryptoCheckbox.vue";
	import WalletImportChecking from "src/layouts/WalletImportChecking.vue";
	import ProtoDialogVue from "./ProtoDialog.vue";

	export default defineComponent({
		name: "WalletAdd",
		extends: ProtoDialogVue,
		data() {
			return {
				walletName: ref(""),
				walletNameRules: [(val) => (val && val.length > 0) || "The name cannot be empty."],
				pwSlide: ref(false),
				password: ref(""),
				pwVisible: ref(false),
				pwRules: [(val) => (val && val.length > 0) || "The password cannot be empty."],
				passwordCheck: ref(""),
				pwCheckVisible: ref(false),
				pwCheckRules: [(val) => val === this.password || "The password confirmation does not match."],
				ssDefaultSlide: ref(true),
				step: ref("selectAddType"),
			};
		},
		components: {
			CryptoCheckbox,
			WalletImportChecking,
		},
		emits: ["generateWallet", "importWallet"],
		methods: {
			init() {
				this.step = "selectAddType";
				this.walletName = "";
				this.pwSlide = false;
				this.password = "";
				this.pwVisible = false;
				this.passwordCheck = "";
				this.pwCheckVisible = false;
				this.ssDefaultSlide = true;
			},
			open() {
				this.openFlag = true;
				this.init();
			},
			async importWallet() {
				let walletDetail = await window.electronAPI.getWalletFileDetail();
				if (walletDetail.result) {
					this.$refs.walletImportChecking.open(walletDetail.result);
				} else {
					console.log("import wallet error");
				}
			},
			async importWalletResult(data) {
				this.$emit("importWallet", { data: data });
				this.openFlag = false;
			},
			async goToNewWallet() {
				this.$refs.stepper.goTo("generateWallet");
				this.$nextTick(function () {
					this.$refs.signSysListRef.init(Object.keys(this.signSysList).map((key) => this.signSysList[key]));
					this.$refs.signSysListRef.selectDefalut();
				});
			},
			getNewWalletData() {
				if (!this.$refs.walletNameRef.validate()) {
					this.$refs.walletNameRef.focus();
					return false;
				}
				let password = undefined;
				if (this.pwSlide === true) {
					if (!this.$refs.passwordRef.validate()) {
						this.$refs.passwordRef.focus();
						return false;
					}
					if (!this.$refs.passwordCheckRef.validate()) {
						this.$refs.passwordCheckRef.focus();
						return false;
					}
					password = this.passwordCheck;
				}
				let signSysList = this.$refs.signSysListRef.getData();
				if (!Array.isArray(signSysList)) return false;
				for (let i = 0; i < signSysList.length; i++) {
					signSysList[i] = {
						version: 0,
						signType: signSysList[i],
					};
				}
				return {
					label: this.walletName,
					keypairs: signSysList,
					password,
				};
			},
			async addWallet() {
				let data = this.getNewWalletData();
				if (data) {
					let r = await window.electronAPI.generateWallet(data.label, data.keypairs, data.password);
					if (r.result) {
						this.$emit("generateWallet", { data: r.result });
					} else {
						this.$emit("generateWallet", { err: true });
					}
					this.openFlag = false;
				}
			},
		},
		mounted() {
			this.signSysList = inject("signSysList").value;
		},
	});
</script>
