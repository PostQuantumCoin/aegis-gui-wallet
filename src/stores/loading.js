import { defineStore } from 'pinia'

export const useLoadingStore = defineStore('loading', {
	state: () => ({
		loadingFlag: false,
		loadingLabel: 'loading',
		timeoutTemp: undefined
	}),
	getters: {},
	actions: {
		openLoading(label, force) {
			if (this.loadingFlag === true) {
				return;
			}
			clearTimeout(this.timeoutTemp);
			if (typeof label === 'string' && label !== '') {
				this.loadingLabel = label;
			}
			else {
				this.loadingLabel = 'loading';
			}
			this.loadingFlag = true;
			if (!force) {
				this.timeoutTemp = setTimeout(() => {
					this.loadingFlag = false;
				}, 30000);
			}
		},
		closeLoading() {
			this.loadingFlag = false;
			clearTimeout(this.timeoutTemp);
		},
	},
})
