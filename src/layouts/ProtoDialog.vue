<script>
	import { defineComponent, ref } from "vue";
	import { containerMd } from "../utils/common";

	export default defineComponent({
		name: "ProtoDialog",
		data() {
			return {
				openFlag: ref(false),
				windowHeight: ref(containerMd.height),
			};
		},
		methods: {
			containerTweak: containerMd.tweak,
			open() {
				this.openFlag = true;
			},
			close() {
				this.openFlag = false;
			},
			destroyed() {},
		},
		watch: {
			openFlag(newValue) {
				if (newValue === false && typeof this.destroyed === "function") {
					this.destroyed();
				}
			},
		},
	});
</script>
