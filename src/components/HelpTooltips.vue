<template>
	<span>
		<q-avatar :size="size" :text-color="color" :align="align" icon="help_outline" />
		<q-tooltip
			class="theme-hover-tooltip-help q-pa-sm"
			transition-duration="0"
			:anchor="tooltipAnchor"
			:self="tooltipSelf"
			:offset="[0, 0]"
			style="font-size: 0.85em"
		>
			{{ tooltipText }}
		</q-tooltip>
	</span>
</template>

<script>
	import { defineComponent, ref } from "vue";

	export default defineComponent({
		name: "HelpTooltips",
		data() {
			return {
				tooltipSelf: ref("center left"),
				tooltipAnchor: ref("center right"),
			};
		},
		props: {
			size: {
				type: String,
				default: "sm",
			},
			color: {
				type: String,
				default: "amber",
			},
			align: {
				type: String,
				default: "right",
			},
			tooltipText: {
				type: String,
				default: "",
			},
		},
		async mounted() {
			if (this.align === "top") {
				this.tooltipSelf = "bottom middle";
				this.tooltipAnchor = "top middle";
			} else if (this.align === "bottom") {
				this.tooltipSelf = "top middle";
				this.tooltipAnchor = "bottom middle";
			} else if (this.align === "left") {
				this.tooltipSelf = "center right";
				this.tooltipAnchor = "center left";
			} else {
				this.tooltipSelf = "center left";
				this.tooltipAnchor = "center right";
			}
		},
		methods: {},
	});
</script>
