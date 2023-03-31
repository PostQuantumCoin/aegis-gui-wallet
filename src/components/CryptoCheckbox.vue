<template>
	<div class="q-gutter-sm">
		<q-checkbox
			dark
			v-for="crypto in signSysList"
			v-model="cryptos"
			:disable="crypto.disable"
			:val="crypto.index"
			:label="$t(crypto.label)"
			color="amber"
		/>
		<div class="text-error" v-if="errorSlide" style="font-size: 11px">{{ $t("minSignaturesUsed") + ": " + minAmountData }}</div>
	</div>
</template>

<script>
	const DefaultCrypto = ["Secp256k1", "Nist_round3_Dilithium3", "Nist_round3_Falcon512"];
	import { defineComponent, ref } from "vue";

	export default defineComponent({
		name: "CheckboxCrypto",
		props: {
			minAmount: Number,
			maxAmount: Number,
			isDefault: Boolean,
			lock: Boolean,
			changeSelect: {
				type: Function,
			},
		},
		data() {
			return {
				signSysList: ref([]),
				errorSlide: ref(false),
				cryptos: ref([]),
				allSignList: ref([]),
				defaultList: [],
				minAmountData: 0,
				maxAmountData: 1000,
			};
		},
		methods: {
			init(signSysList) {
				if (Array.isArray(signSysList)) {
					this.signSysList = signSysList;
					let signSysIndex = [];
					let defaultList = [];
					signSysList.map((item) => {
						if (DefaultCrypto.includes(item.label)) {
							defaultList.push(item.index);
						}
						signSysIndex.push(item.index);
					});
					this.allSignList = ref(signSysIndex);
					this.defaultList = defaultList;
				}
			},
			getData() {
				let data = [];
				this.signSysList.map((item) => {
					if (this.cryptos.includes(item.index)) {
						data.push(item.index);
					}
				});
				return data;
			},
			cleanAll() {
				this.cryptos = ref([]);
			},
			selectAll() {
				this.cryptos = ref(this.allSignList.slice(0));
			},
			selectDefalut() {
				this.cryptos = ref(this.defaultList.slice(0));
			},
			setCryptos(value) {
				if (Array.isArray(value)) {
					this.cryptos = value;
				}
			},
			verifyCryptoAmount() {
				if (this.cryptos.length < this.minAmountData) {
					this.errorSlide = true;
				} else {
					this.errorSlide = false;
				}
			},
		},
		mounted() {
			let minAmount = parseInt(this.minAmount);
			if (!isNaN(minAmount)) {
				this.minAmountData = minAmount;
			}
			let maxAmount = parseInt(this.maxAmount);
			if (!isNaN(maxAmount)) {
				this.maxAmountData = maxAmount;
			}
		},
		watch: {
			minAmount: function (newValue) {
				let minAmount = parseInt(newValue);
				if (!isNaN(minAmount)) {
					this.minAmountData = minAmount;
				}
				this.verifyCryptoAmount();
			},
			maxAmount: function (newValue) {
				let maxAmount = parseInt(newValue);
				if (!isNaN(maxAmount)) {
					this.maxAmountData = maxAmount;
				}
				this.verifyCryptoAmount();
			},
			cryptos: function (newValue) {
				if (this.changeSelect) {
					this.changeSelect(newValue);
				}
				if (this.lock === true) return;
				this.verifyCryptoAmount();
				let crypto = this.cryptos.slice(0);
				if (newValue.length >= this.maxAmountData) {
					this.signSysList.map((item) => {
						if (!crypto.includes(item.index)) {
							item.disable = true;
						}
					});
				} else {
					this.signSysList.map((item) => {
						item.disable = false;
					});
				}
			},
			isDefault: function (newValue) {
				if (newValue === true && Array.isArray(this.signSysList)) {
					this.selectDefalut();
				}
			},
		},
	});
</script>
