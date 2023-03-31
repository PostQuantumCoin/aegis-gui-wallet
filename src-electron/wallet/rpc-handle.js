const { PostRequest } = require('aegispqccoin/dist/src/wallet/postRequest');
const { jsonParse } = require('aegispqccoin/dist/src/api/json');

class RPCHandle {

	constructor(rpcOpt) {
		this.rpcOpt = rpcOpt;
		this.postRequest = new PostRequest(rpcOpt);
	}

	async post(msg) {
		return await this.postRequest.emit(msg);
	}

	async handlePost(event, msg) {
		let r = await this.post(msg);
		if (r.err) {
			console.error('ERROR: ', r.err, msg);
			return r;
		}

		try {
			let obj = jsonParse(r.data);
			if (obj.error) {
				console.error('ERROR: ', obj.error, msg);
				return { err: obj.error };
			}
			return obj;
		}
		catch (e) {
			console.error(`ERROR: ${e} ${msg}`);
			return { err: e };
		}
	}

	close() {
		this.post = function () { };
		this.handlePost = function () { };
		delete this.postRequest;
	}
}

exports.RPCHandle = RPCHandle;
