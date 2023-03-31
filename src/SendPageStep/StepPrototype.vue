<script>
	import { defineComponent } from "vue";
	import HelpTooltips from "components/HelpTooltips.vue";
	import { numberFormat } from "../utils/utils";

	export default defineComponent({
		name: "SendPageStepPrototype",
		data() {
			return {};
		},
		props: {
			sendPageRef: {
				type: Object,
				required: true,
			},
			stepperRef: {
				type: Object,
				required: false,
			},
			resetCallBack: {
				type: Function,
				required: true,
			},
		},
		components: {
			HelpTooltips,
		},
		methods: {
			getFromSelectedUnit() {
				let totalAmount = 0n;
				for (const key in this.sendPageRef.fromSelected) {
					totalAmount += this.sendPageRef.fromSelected[key].confirmedBigInt;
				}
				let totalAmountStr = totalAmount.toString().padStart(9, "0");
				totalAmountStr = numberFormat(totalAmountStr.slice(0, -8) + "." + totalAmountStr.slice(-8));
				return `${totalAmountStr}`;
			},
			numberFormat,
		},
	});
</script>
