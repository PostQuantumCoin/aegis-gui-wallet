const path = require('path');
const crypto = require('crypto');
const settingsJson = require('./utils/json-data');
const coreSettingInitData = require('./template/app-config.json');
coreSettingInitData.rpcOpt.auth.pw = crypto.randomBytes(16).toString('base64');
const coreSettingJson = new settingsJson(path.join(process.cwd(), 'app-config.json'), coreSettingInitData);
const coreConfig = coreSettingJson.getData();

const RpcServer = require('aegispqccoin/dist/src/api/rpcServer.js');
const { Task } = require('aegispqccoin/dist/src/task.js');
const { configValidate } = require('aegispqccoin/dist/src/indexUtil/configValidate.js');
const P2P = require('aegispqccoin/dist/src/p2p/p2p.js');
const { mainNet, testNet } = require('aegispqccoin/dist/src/p2p/lib/networkList.js');
const testMode = false;
var exiting = false;

(async function(){
	let v = configValidate(coreConfig);
	if (!v) {
		return console.error(configValidate.errors);
	}
	if (coreConfig.coreOpt?.minerFeeRatio) {
		coreConfig.coreOpt.minerFeeRatio = BigInt(coreConfig.coreOpt.minerFeeRatio);
	}

	let task = new Task(coreConfig.taskOpt, coreConfig.coreOpt, coreConfig.walletHistoryOpt, undefined, testMode);
	await task.init();

	let p2p;
	if (coreConfig.p2pOpt) {
		if(testMode){
			p2p = new P2P.default(testNet, task, coreConfig.p2pOpt, coreConfig.services);
		}
		else{
			p2p = new P2P.default(mainNet, task, coreConfig.p2pOpt, coreConfig.services);
		}
		let r = await p2p.initialize();
		if (r && coreConfig.p2pOpt.serverDisable !== true) {
			p2p.serverOn(coreConfig.p2pOpt.listenPort);
		}
	}

	let rpcServer;
	if (coreConfig.rpcOpt && !coreConfig.rpcOpt.disable) {
		if (coreConfig.rpcOpt.PQCEncrypt) {
			for (let x in coreConfig.rpcOpt.PQCEncrypt) {
				coreConfig.rpcOpt.PQCEncrypt[x] = Buffer.from(coreConfig.rpcOpt.PQCEncrypt[x], 'base64');
			}
		}
		rpcServer = new RpcServer.default(coreConfig.rpcOpt, task, p2p);
		rpcServer.start();
	}

	task.eventEmit.on('newBlock', (m) => {
		process.send({
			type: 'newBlock',
			data: m.toString('hex')
		});
	});
	task.eventEmit.on('forkBlock', (m) => {
		process.send({
			type: 'forkBlock',
			data: JSON.stringify({ startHeight: m.startHeight, endHeight: m.endHeight, blockHashList: m.blockHashList.map(x => x.toString('hex')) })
		});
	});
	task.eventEmit.on('addTx', (m) => {
		process.send({
			type: 'addTx',
			data: JSON.stringify({ txid: m.txid.toString('hex'), mining: m.mining })
		});
	});

	async function exitHandler() {
		if (!exiting) {
			exiting = true;
			let p = [];
			if (p2p) {
				p.push(p2p.exit());
			}
			if (rpcServer) {
				p.push(rpcServer.exit());
			}
			p.push(task.exit());

			await Promise.all(p);
			process.exit();
		}
		else{
			console.log('exiting...');
		}
	}

	process.on('message', async (msg) => {
		if(typeof msg === 'object'){
			if(msg.type === 'exit'){
				await exitHandler();
			}
		}
	});

	process.on('exit', exitHandler);
	process.on('SIGINT', exitHandler);
	process.on('SIGUSR1', exitHandler);
	process.on('SIGUSR2', exitHandler);
	process.on('SIGTERM', exitHandler);
	process.on('beforeExit', exitHandler);
	process.on('uncaughtException', (e) => {
		console.error(e);
	});
})();
