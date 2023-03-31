<template>
	<div class="row no-wrap justify-start items-center content-start">
		<div>
			<q-icon size="md" name="wallet" style="color: var(--theme-card-text-c0)" />
			{{ sendPageRef.nowWalletLabel }}
		</div>
	</div>

	<div class="q-pt-md">{{ $t("fromTableInfo") }}</div>

	<q-table
		class="theme-card"
		style="background: rgba(0, 0, 0, 0); backdrop-filter: none; box-shadow: none"
		dark
		dense
		:rows="sendPageRef.fromAddressList"
		:columns="fromColumns"
		row-key="address"
		:pagination="{ rowsPerPage: 0 }"
		:rows-per-page-options="[]"
		:selected-rows-label="getFromSelectedString"
		selection="multiple"
		:no-data-label="$t('fromTableNoDataLabel')"
		v-model:selected="sendPageRef.fromSelected"
		@update:selected="updateFromSelectedHTML"
	>
		<template v-slot:body="props">
			<q-tr :props="props" :key="`m_${props.row.index}`">
				<q-td>
					<q-checkbox
						:disable="fromAddressIsDisable(props.row.address)"
						v-model="props.selected"
						dark
						dense
						color="amber"
						@update:model-value="
							(value, evt) => {
								if (value) {
									if (props.row.signSelect.length < props.row.details.level) {
										signSysCheckboxCryptoShow[props.row.address] = true;
										openSignSetting(props.row.address);
									}
								} else {
									signSysCheckboxCryptoShow[props.row.address] = false;
								}
							}
						"
					/>
				</q-td>
				<q-td key="setting" auto-width>
					<q-btn
						size="sm"
						flat
						dense
						@click="
							() => {
								signSysCheckboxCryptoShow[props.row.address] = !signSysCheckboxCryptoShow[props.row.address];
								openSignSetting(props.row.address);
							}
						"
						:color="props.row.details.level <= props.row.signSelect.length ? 'amber' : ''"
						:icon="props.row.details.level <= props.row.signSelect.length ? 'settings' : 'settings'"
					/>
				</q-td>
				<q-td
					key="address"
					:props="props"
					@click="
						() => {
							if (fromAddressIsDisable(props.row.address)) return;
							if (!props.selected) {
								if (props.row.signSelect.length < props.row.details.level) {
									signSysCheckboxCryptoShow[props.row.address] = true;
									openSignSetting(props.row.address);
								}
							} else {
								signSysCheckboxCryptoShow[props.row.address] = false;
							}
							props.selected = !props.selected;
						}
					"
				>
					{{ props.row.address }}
				</q-td>
				<q-td key="confirmed" :props="props">
					<span class="value">{{ props.row.confirmed }}</span
					><span class="value" style="margin-left: 3px; color: var(--theme-normal-text-c0)">AGS</span>
				</q-td>
				<q-td key="useAllUTXO" :props="props">
					<q-checkbox v-model="props.row.useAllUTXO" dark dense color="amber" @click="clickCellUseAllUTXOCheckbox" />
				</q-td>
			</q-tr>
			<q-tr v-show="signSysCheckboxCryptoShow[props.row.address]" :props="props">
				<q-td colspan="100%">
					<div class="text-left">{{ $t("signatureSystem") }}:</div>
					<div class="row wrap justify-start items-start content-start">
						<CryptoCheckbox
							:ref="`signSysListRef_${props.row.address}`"
							:minAmount="props.row.details.level"
							:maxAmount="props.row.details.level"
							:changeSelect="(v) => checkboxCryptoChangeSelcet(props.row.address, v)"
						/>
						<div class="q-pl-md q-pt-sm">
							<q-btn
								:disable="signSysBtnEnable[props.row.address] ? false : true"
								size="sm"
								text-color="dark"
								color="amber"
								:label="$t('save')"
								@click="signSysCheckboxCryptoShow[props.row.address] = false"
							/>
						</div>
					</div>
				</q-td>
			</q-tr>
		</template>
		<template v-slot:header-cell-address="props">
			<th :align="props.col.align">{{ $t(props.col.label) }}</th>
		</template>
		<template v-slot:header-cell-confirmed="props">
			<th :align="props.col.align">{{ $t(props.col.label) }}</th>
		</template>
		<template v-slot:header-cell-useAllUTXO="props">
			<th :class="'row no-wrap justify-center items-center content-center' + props.col.__thClass">
				<q-checkbox dark dense v-model="useAllUTXO" class="q-pr-xs" color="amber" @click="clickUseAllUTXOCheckbox" />
				{{ $t(props.col.label) }}
				<HelpTooltips align="top" size="md" color="c0" :tooltipText="$t('fromTableTooltipText')" />
			</th>
		</template>
		<template v-slot:header-selection> </template>
		<template v-slot:bottom="props">
			<div v-html="tableBottomInfo"></div>
		</template>
	</q-table>
	<div class="flex justify-end">
		<q-btn flat :label="$t('cancel')" class="theme-button-cancel-c0" @click="reset()" />
		<q-btn :label="$t('continue')" class="theme-button-confirm-c0" icon="navigate_next" @click="clickNext()" />
	</div>
</template>

<script>
	import { defineComponent, ref, toRaw } from "vue";
	import StepPrototype from "./StepPrototype.vue";
	import CryptoCheckbox from "components/CryptoCheckbox.vue";

	const fromColumns = [
		{
			name: "setting",
			align: "center",
			label: "",
			field: "setting",
			sortable: false,
		},
		{
			name: "address",
			required: true,
			label: "address",
			align: "left",
			field: "address",
			format: (val) => `${val}`,
			classes: "mono-font",
			sortable: false,
		},
		{
			name: "confirmed",
			align: "right",
			label: "confirmed",
			field: "confirmed",
			sortable: false,
		},
		{
			name: "useAllUTXO",
			align: "center",
			label: "useAllUTXO",
			field: "useAllUTXO",
			sortable: false,
		},
	];

	export default defineComponent({
		name: "FromAddrStep",
		extends: StepPrototype,
		props: {},
		data() {
			return {
				lockContinue: false,
				useAllUTXO: ref(),
				signSysCheckboxCryptoShow: ref({}),
				signSysBtnEnable: ref({}),
				fromColumns,
				tableBottomInfo: ref(""),
			};
		},
		components: {
			CryptoCheckbox,
		},
		methods: {
			reset() {
				this.clean();
				this.clickCellUseAllUTXOCheckbox();
				this.resetCallBack();
			},
			clean() {
				this.lockContinue = false;
				this.signSysCheckboxCryptoShow = {};
				this.signSysBtnEnable = {};
			},
			clickUseAllUTXOCheckbox() {
				if (this.useAllUTXO) {
					for (const key in this.sendPageRef.fromAddressList) {
						this.sendPageRef.fromAddressList[key].useAllUTXO = true;
					}
				} else {
					for (const key in this.sendPageRef.fromAddressList) {
						this.sendPageRef.fromAddressList[key].useAllUTXO = false;
					}
				}
			},
			fromAddressIsDisable(address) {
				for (const key in this.sendPageRef.fromAddressList) {
					if (this.sendPageRef.fromAddressList[key].address === address) {
						if (this.sendPageRef.fromAddressList[key].confirmedBigInt == 0n) {
							return true;
						} else {
							return false;
						}
					}
				}
				return true;
			},
			checkboxCryptoChangeSelcet(address, v) {
				for (const key in this.sendPageRef.fromAddressList) {
					if (this.sendPageRef.fromAddressList[key].address === address) {
						this.sendPageRef.fromAddressList[key].signSelect = toRaw(v);
						if (this.sendPageRef.fromAddressList[key].details.level <= v.length) {
							this.signSysBtnEnable[address] = true;
						} else {
							this.signSysBtnEnable[address] = false;
						}
					}
				}
			},
			openSignSetting(address) {
				for (const key in this.sendPageRef.fromAddressList) {
					if (this.sendPageRef.fromAddressList[key].address === address) {
						this.$refs[`signSysListRef_${address}`].init(this.sendPageRef.fromAddressList[key].signSysList);
						this.$refs[`signSysListRef_${address}`].setCryptos(this.sendPageRef.fromAddressList[key].signSelect);
					}
				}
			},
			getFromSelectedString(numberOfRows) {
				let text = this.$t("sendAddressSelectedAndTotalAmount", {
					addressAmount: numberOfRows,
					totalAmount: this.getFromSelectedUnit(),
				});
				if (text.includes("{addressAmount}")) {
					text = text.replace("{addressAmount}", numberOfRows);
					text = text.replace("{totalAmount}", this.getFromSelectedUnit());
				}
				return text;
			},
			updateFromSelectedHTML(newSelected) {
				let numberOfRows = newSelected.length;
				if (numberOfRows > 0) {
					let text = this.$t("sendAddressSelectedAndTotalAmount", {
						addressAmount: numberOfRows,
						totalAmount: `<span class="value q-px-xs"> ${this.getFromSelectedUnit()} </span>`,
					});
					if (text.includes("{addressAmount}")) {
						text = text.replace("{addressAmount}", numberOfRows);
						text = text.replace("{totalAmount}", `<span class="value q-px-xs"> ${this.getFromSelectedUnit()} </span>`);
					}
					this.tableBottomInfo = text;
				} else {
					this.tableBottomInfo = "";
				}
			},
			clickCellUseAllUTXOCheckbox() {
				let trueCount = 0;
				let falseCount = 0;
				for (const key in this.sendPageRef.fromAddressList) {
					if (this.sendPageRef.fromAddressList[key].useAllUTXO) {
						trueCount++;
					} else {
						falseCount++;
					}
				}
				if (trueCount === 0) {
					this.useAllUTXO = false;
				} else if (falseCount === 0) {
					this.useAllUTXO = true;
				} else {
					this.useAllUTXO = null;
				}
			},
			clickNext() {
				if (this.lockContinue) return;
				this.lockContinue = true;
				if (this.sendPageRef.fromSelected.length === 0) {
					this.lockContinue = false;
					return this.sendPageRef.$refs.confirmDialogRef.openInfo(
						this.$t("fail"),
						this.$t("fromAddressNoSelected"),
						"report_problem",
						"red"
					);
				}
				for (const key in this.sendPageRef.fromSelected) {
					if (this.sendPageRef.fromSelected[key].signSelect.length != this.sendPageRef.fromSelected[key].details.level) {
						this.lockContinue = false;
						let confirmText = this.$t("addressSignSystemNoSelected", {
							address: this.sendPageRef.fromSelected[key].address,
						});
						if (confirmText.includes("{address}")) {
							confirmText = confirmText.replace("{address}", this.sendPageRef.fromSelected[key].address);
						}
						return this.sendPageRef.$refs.confirmDialogRef.openInfo(this.$t("fail"), confirmText, "report_problem", "red");
					}
					if (this.sendPageRef.fromSelected[key].confirmedBigInt <= 0n) {
						this.lockContinue = false;
						let confirmText = this.$t("addressBalanceEmpty", {
							address: this.sendPageRef.fromSelected[key].address,
						});
						if (confirmText.includes("{address}")) {
							confirmText = confirmText.replace("{address}", this.sendPageRef.fromSelected[key].address);
						}
						return this.sendPageRef.$refs.confirmDialogRef.openInfo(this.$t("fail"), confirmText, "report_problem", "red");
					}
				}

				this.sendPageRef.defaultChangeAddress = this.sendPageRef.fromSelected[
					this.sendPageRef.fromSelected.length - 1
				].address;
				this.sendPageRef.done.fromAddress = true;
				this.lockContinue = false;
				this.stepperRef.next();
			},
		},
		async mounted() {
			this.clean();
			for (const key in this.sendPageRef.fromAddressList) {
				this.signSysCheckboxCryptoShow[this.sendPageRef.fromAddressList[key].address] = false;
			}
			this.clickCellUseAllUTXOCheckbox();
		},
	});
</script>
