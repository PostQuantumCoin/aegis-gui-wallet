<template>
	<div class="q-pt-md">
		<q-toggle v-model="useFahrenheit" color="amber" :label="$t('useFahrenheit')" left-label />
		<q-markup-table
			flat
			class="theme-card GPU-table"
			color="deep-purple-2"
			dark
			style="padding: 0; background-color: transparent; backdrop-filter: none"
		>
			<tbody>
				<tr v-for="gpu in usedGPUList">
					<td class="text-left">{{ gpu.name }}</td>
					<td class="text-center">
						<q-icon name="memory" size="1.5rem" /><span class="GPU-table-text is-percent">{{
							gpu["utilization.gpu"]
						}}</span>
					</td>
					<td class="text-center">
						<q-icon name="device_thermostat" size="1.5rem" /><span
							:class="useFahrenheit ? 'GPU-table-text is-temp-f' : 'GPU-table-text is-temp-c'"
							>{{ useFahrenheit ? Math.floor(1.8 * gpu["temperature.gpu"]) + 32 : gpu["temperature.gpu"] }}</span
						>
					</td>
					<td class="text-center">
						<q-icon name="sym_r_mode_fan" size="1.5rem" /><span class="GPU-table-text is-percent">{{
							gpu["fan.speed"]
						}}</span>
					</td>
				</tr>
			</tbody>
		</q-markup-table>
	</div>
</template>

<style scoped>
	.GPU-table-text {
		display: inline-block;
		min-width: 3em;
	}
	.is-percent::after {
		content: "%";
	}
	.is-temp-f::after {
		content: "\2109";
	}
	.is-temp-c::after {
		content: "\2103";
	}
</style>

<script>
	import { defineComponent, ref, toRaw } from "vue";
	let getGPUStatusInterval = undefined;
	const PollingGPUStatusTime = 1000;
	export default defineComponent({
		name: "GPUStatus",
		props: {
			GPUList: Array,
		},
		data() {
			return {
				usedGPUList: ref({}),
				useFahrenheit: ref(true),
			};
		},
		methods: {
			updateGPUStatus(gpuList) {
				gpuList.map((item) => {
					if (this.usedGPUList[item.uuid]) {
						this.usedGPUList[item.uuid] = item;
					}
				});
			},
			async getGPUStatus() {
				let gpuStatus = await window.electronAPI.getGPUStatus();
				if (Array.isArray(gpuStatus?.result) && gpuStatus.result.length > 0) {
					return gpuStatus.result;
				} else {
					return false;
				}
			},
		},
		unmounted() {
			clearInterval(getGPUStatusInterval);
		},
		async created() {
			if (!Array.isArray(this.GPUList)) return;
			this.usedGPUList = {};
			let allGPU = await this.getGPUStatus();
			if (Array.isArray(allGPU)) {
				allGPU.map((item) => {
					if (this.GPUList.includes(item.uuid)) {
						this.usedGPUList[item.uuid] = item;
					}
				});
			}
			clearInterval(getGPUStatusInterval);
			getGPUStatusInterval = setInterval(async () => {
				let gpuList = await this.getGPUStatus();
				if (gpuList) {
					this.updateGPUStatus(gpuList);
				}
			}, PollingGPUStatusTime);
		},
	});
</script>
