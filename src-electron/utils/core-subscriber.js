const delay = function(ms){
	return new Promise(res => {
		setTimeout(res, ms)
	});
}

class Subscriber {
	constructor(postRequest, eventEmit, postMethodName, postParams, eventName, timeOut = 57000) {
		this.postRequest = postRequest;
		this.eventEmit = eventEmit;
		this.postMethodName = postMethodName;
		this.postParams = postParams;
		this.eventName = eventName;
		this.timeOut = timeOut;
	}

	async start() {
		if (this.startFlag) {
			return;
		}
		this.startFlag = true;
		do {
			let r = await this.postRequest.emit({ method: this.postMethodName, params: this.postParams }, this.timeOut);
			if (r?.err) {
				if (r.err === 'timeout') {
					continue;
				}
				await delay(5000);
			}
			try {
				r = JSON.parse(r.data);
			}
			catch (e) {
				continue;
			}
			if (r.error) {
				await delay(5000);
				continue;
			}
			this.eventEmit.emit(this.eventName, r.result);
			await delay(100);
		} while (this.startFlag);
	}

	stop() {
		this.startFlag = false;
	}
}

module.exports = Subscriber;
