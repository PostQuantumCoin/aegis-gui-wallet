<template>
	<div><q-icon size="md" name="wallet" style="color: var(--theme-card-text-c0)" /> {{ sendPageRef.nowWalletLabel }}</div>
	<q-input
		dark
		dense
		v-model="sendPasswd"
		filled
		color="amber"
		:type="isPwd ? 'password' : 'text'"
		:label="$t('password')"
		@keydown.enter.prevent="clickNext()"
	>
		<template v-slot:append>
			<q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
		</template>
	</q-input>

	<div class="q-pt-md flex justify-end">
		<q-btn flat :label="$t('cancel')" class="theme-button-cancel-c0" @click="reset()" />
		<q-btn flat :label="$t('back')" class="theme-button-cancel-c0" icon="navigate_before" @click="stepperRef.previous()" />
		<q-btn :label="$t('continue')" class="theme-button-confirm-c0" icon="navigate_next" @click="clickNext()" />
	</div>
</template>

<script>
	import { defineComponent, ref } from "vue";
	import StepPrototype from "./StepPrototype.vue";

	export default defineComponent({
		name: "PasswordStep",
		extends: StepPrototype,
		props: {},
		data() {
			return {
				isPwd: ref(true),
				sendPasswd: ref(""),
			};
		},
		components: {},
		methods: {
			reset() {
				this.sendPasswd = "";
				this.resetCallBack();
			},
			async clickNext() {
				let sr = await window.electronAPI.signTxMultiAddress(this.sendPasswd);
				if (sr?.error) {
					return this.sendPageRef.$refs.confirmDialogRef.openInfo(
						this.$t("fail"),
						this.$t("wrongPassword"),
						"report_problem",
						"red"
					);
				}
				this.sendPageRef.done.walletPassword = true;
				this.stepperRef.next();
			},
		},
		async mounted() {},
	});
</script>
