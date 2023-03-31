<template>
	<q-btn-dropdown color="amber" text-color="text-card" no-caps flat dense :label="selectedAddress">
		<q-list dense class="select-content-area">
			<q-item v-for="address in addressList" clickable v-close-popup>
				<q-item-section>
					<q-item-label class="mono-font" @click="changeAddress(address.id)">{{ address.label }}</q-item-label>
				</q-item-section>
			</q-item>
		</q-list>
	</q-btn-dropdown>
</template>

<script>
	import { defineComponent, ref } from "vue";

	export default defineComponent({
		name: "selectAddress",
		data() {
			return {
				selectedAddress: ref(""),
				addressList: ref([]),
			};
		},
		emits: ["changeAddress"],
		methods: {
			changeAddress(id) {
				this.selectedAddressId = id;
				this.selectedAddress = this.addressList[id].label;
				this.$emit("changeAddress", this.addressList[id].label);
			},
			async changeWallet(wid, addressinit) {
				let r = await window.electronAPI.walletGetAddressList(wid);
				let addressItem = [];
				this.addressList = addressItem;
				if (Array.isArray(r?.result)) {
					if (r.result.length === 0) {
						addressItem.push({
							id: 0,
							label: this.$t("addressNotfound"),
						});
						this.changeAddress(0);
					}
					r.result.map((item, index) => {
						addressItem.push({
							id: index,
							label: item,
						});
						if (index === 0 && !addressinit) {
							this.changeAddress(0);
						}
						if (addressinit === item) {
							this.changeAddress(index);
						}
					});
				}
			},
		},
		async mounted() {},
	});
</script>
