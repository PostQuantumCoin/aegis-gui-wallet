<template>
	<q-dialog persistent v-model="isOpen" class="bg-blur" @keyup.esc="isOpen = false">
		<q-card style="width: 50vw; min-height: 150px" class="theme-dialog-c0">
			<q-card-section class="row items-center q-py-xs">
				<div class="text-h6">{{ dialogInfoTitle }}</div>
				<q-space />
				<q-btn icon="close" flat round dense v-close-popup />
			</q-card-section>
			<q-separator style="background-color: var(--theme-border-c0)" />
			<q-card-section>
				<div class="q-ml-sm text-body1" style="min-height: 28px">
					<q-icon v-show="dialogShowIcon" :name="dialogInfoIcon" :color="dialogInfoIconColor" size="28px" />
					{{ dialogInfoText }}
				</div>
			</q-card-section>
			<q-card-section align="right">
				<q-btn flat :label="$t('cancel')" v-if="isConfirm" @click="clickBtn(false)" class="theme-button-cancel-c0" />
				<q-btn :label="$t('confirm')" @click="clickBtn(true)" class="theme-button-confirm-c0" />
			</q-card-section>
		</q-card>
	</q-dialog>
</template>

<script>
	import { defineComponent, ref } from "vue";
	let asyncRes = undefined;
	export default defineComponent({
		name: "confirmDialog",
		data() {
			return {
				isOpen: false,
				isConfirm: false,
				dialogInfoTitle: "Error",
				dialogInfoText: "add wallet fail.",
				dialogShowIcon: true,
				dialogInfoIcon: "error",
				dialogInfoIconColor: "red",
			};
		},
		emits: ["confirm"],
		methods: {
			setTitleText: function (title, text) {
				if (typeof title !== "string") {
					this.dialogInfoTitle = "";
				} else {
					this.dialogInfoTitle = title;
				}

				if (typeof text !== "string") {
					this.dialogInfoText = "";
				} else {
					this.dialogInfoText = text;
				}
			},
			setIcon: function (icon, iconColor) {
				if (typeof icon !== "string") {
					this.dialogShowIcon = false;
					this.dialogInfoIcon = "";
				} else {
					this.dialogShowIcon = true;
					this.dialogInfoIcon = icon;
				}

				if (typeof iconColor !== "string") {
					this.dialogInfoIconColor = "amber";
				} else {
					this.dialogInfoIconColor = iconColor;
				}
			},
			openInfo: function (title, text, icon, iconColor) {
				return new Promise((res) => {
					this.isConfirm = false;
					asyncRes = res;
					this.setTitleText(title, text);
					this.setIcon(icon, iconColor);
					this.isOpen = true;
				});
			},
			openConfirm: function (title, text, icon, iconColor) {
				return new Promise((res) => {
					this.isConfirm = true;
					asyncRes = res;
					this.setTitleText(title, text);
					this.setIcon(icon, iconColor);
					this.isOpen = true;
				});
			},
			clickBtn(isConfirm) {
				if (asyncRes) {
					asyncRes(isConfirm);
				}
				this.$emit("confirm", isConfirm);
				this.isOpen = false;
			},
		},
	});
</script>
