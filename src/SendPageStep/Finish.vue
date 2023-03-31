<template>
	<div class="flex column content-center">
		<div style="width: 900px">
			<div class="flex column content-center">
				<h3 class="q-my-md">{{ $t("finishSuccess") }}</h3>
			</div>
			<q-field class="q-pb-md" dark dense filled stack-label color="amber" label-color="amber" :label="$t('txid')">
				<template v-slot:control>
					<div class="self-center full-width no-outline">{{ sendPageRef.sendTxid }}</div>
				</template>
				<template v-slot:append>
					<q-icon
						name="content_copy"
						size="xs"
						color="amber"
						@click="copyText(sendPageRef.sendTxid)"
						class="cursor-pointer"
					/>
				</template>
			</q-field>

			<div v-for="checkItem in sendPageRef.finalCheckList" class="q-pb-md">
				<div v-if="checkItem.type == 'from'" class="flex justify-center items-center content-center">
					<div class="col-grow">
						<q-field color="amber" dark dense filled :label="checkItem.label" stack-label>
							<template v-slot:control>
								<div class="self-center full-width no-outline" tabindex="0">
									{{ checkItem.address }}
								</div>
							</template>
						</q-field>
					</div>
					<div class="flex justify-center items-center content-center" style="width: 45px">
						<q-icon class="q-px-md" name="east" size="sm" style="color: var(--theme-card-text-c0)" />
					</div>
					<div style="width: 250px">
						<q-field color="amber" dark dense filled>
							<template v-slot:control>
								<div class="value unit self-center full-width no-outline text-right" tabindex="0">
									{{ checkItem.amount }}
								</div>
							</template>
						</q-field>
					</div>
				</div>
				<div v-else-if="checkItem.type == 'to'" class="flex justify-center items-center content-center">
					<div class="col-grow">
						<q-field color="amber" dark dense filled :label="checkItem.label" stack-label>
							<template v-slot:control>
								<div class="self-center full-width no-outline" tabindex="0">
									{{ checkItem.address }}
								</div>
							</template>
						</q-field>
					</div>
					<div class="flex justify-center items-center content-center" style="width: 45px">
						<q-icon class="q-px-md" name="west" size="sm" style="color: var(--theme-card-text-c0)" />
					</div>
					<div style="width: 250px">
						<q-field color="amber" dark dense filled>
							<template v-slot:control>
								<div class="value unit self-center full-width no-outline text-right" tabindex="0">
									{{ checkItem.amount }}
								</div>
							</template>
						</q-field>
					</div>
				</div>
				<div v-else-if="checkItem.type == 'textarea'">
					<q-field label-color="amber" color="amber" dark dense filled :label="checkItem.label" stack-label>
						<template v-slot:control>
							<div class="self-center full-width no-outline text-wrap" tabindex="0">
								{{ checkItem.value }}
							</div>
						</template>
					</q-field>
				</div>
				<div v-else>
					<q-field color="amber" dark dense filled :label="checkItem.label" stack-label>
						<template v-slot:control>
							<div class="self-center full-width no-outline" tabindex="0">
								{{ checkItem.value }}
							</div>
						</template>
					</q-field>
				</div>
			</div>

			<q-list dark bordered class="rounded-borders">
				<q-expansion-item dark dense v-model="finalCheckDetailExpanded" icon="info_outline" :label="$t('photonDetail')">
					<q-field
						class="q-pt-md q-px-md"
						v-for="checkItem in sendPageRef.finalCheckDetailList"
						color="amber"
						dark
						dense
						filled
						:label="checkItem.label"
						stack-label
					>
						<template v-slot:control>
							<div class="self-center full-width no-outline" tabindex="0">
								{{ checkItem.value }}
							</div>
						</template>
					</q-field>
					<div class="q-px-md q-pb-md">
						<q-linear-progress
							v-for="checkPhotonItem in sendPageRef.finalCheckPhotonList"
							dark
							stripe
							rounded
							size="30px"
							:value="checkPhotonItem.value"
							color="amber"
							class="q-mt-sm"
						>
							<div class="absolute-full flex flex-center">
								<q-badge color="white" text-color="black" :label="checkPhotonItem.label" />
							</div>
						</q-linear-progress>
					</div>
				</q-expansion-item>
			</q-list>
		</div>
	</div>

	<div class="q-pt-xl flex justify-end">
		<q-btn :label="$t('finish')" class="theme-button-confirm-c0" @click="reset()" />
	</div>
</template>

<script>
	import { defineComponent } from "vue";
	import StepPrototype from "./StepPrototype.vue";

	export default defineComponent({
		name: "FinishStep",
		extends: StepPrototype,
		props: {},
		data() {
			return {
				finalCheckDetailExpanded: false,
			};
		},
		components: {},
		methods: {
			reset() {
				this.resetCallBack();
			},
			async copyText(text) {
				try {
					await navigator.clipboard.writeText(text);
					this.sendPageRef.$refs.confirmDialogRef.openInfo("", this.$t("copySuccess"));
				} catch (e) {}
			},
		},
		async mounted() {},
	});
</script>
