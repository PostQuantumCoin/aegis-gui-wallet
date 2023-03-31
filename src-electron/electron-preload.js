const { contextBridge, ipcRenderer } = require('electron');

function getPostMsg(method, ...params) {
	return { method, params }
}

async function getTxDetials(txid) {
	let data = await method.getTransactionByTxid(txid);
	if (!data.result) {
		return;
	}

	let lastHeight = await method.getLastBlockHeight();
	if (lastHeight.result === undefined) {
		return;
	}

	let totalInput = 0n;
	let totalOutput = 0n;
	for (let i = 0; i < data.result.tx.vin.length; i++) {
		for (let j = 0; j < data.result.tx.vin[i].previousOutouts.length; j++) {
			let lastTx = await method.getTransactionByTxid(data.result.tx.vin[i].previousOutouts[j].txid);
			if (!lastTx.result) {
				return;
			}
			if (lastTx.result.tx.vout[data.result.tx.vin[i].previousOutouts[j].voutn] === undefined) {
				return;
			}
			totalInput += BigInt(lastTx.result.tx.vout[data.result.tx.vin[i].previousOutouts[j].voutn].value);
		}
	}
	for (let i = 0; i < data.result.tx.vout.length; i++) {
		totalOutput += BigInt(data.result.tx.vout[i].value);
		data.result.tx.vout[i].address = await method.base58Encode(data.result.tx.vout[i].lockScript.slice(2, -2));
	}

	let temp = data.result;
	temp.confirmations = lastHeight.result - temp.blockHeight + 1
	temp.totalInput = totalInput;
	temp.totalOutput = totalOutput;
	temp.fee = (temp.totalInput !== 0n) ? (totalInput - totalOutput) : 0n ;
	return temp;
}

async function getTxPoolDetials(txid) {
	let data = await method.getTxPoolByTxid(txid);
	if (!data.result) {
		return;
	}

	let lastHeight = await method.getLastBlockHeight();
	if (lastHeight.result === undefined) {
		return;
	}

	let totalInput = 0n;
	let totalOutput = 0n;
	for (let i = 0; i < data.result.blockTx.vin.length; i++) {
		for (let j = 0; j < data.result.blockTx.vin[i].previousOutouts.length; j++) {
			let lastTx = await method.getTransactionByTxid(data.result.blockTx.vin[i].previousOutouts[j].txid);
			if (!lastTx.result) {
				return;
			}
			if (lastTx.result.tx.vout[data.result.blockTx.vin[i].previousOutouts[j].voutn] === undefined) {
				return;
			}
			totalInput += BigInt(lastTx.result.tx.vout[data.result.blockTx.vin[i].previousOutouts[j].voutn].value);
		}
	}
	for (let i = 0; i < data.result.blockTx.vout.length; i++) {
		totalOutput += BigInt(data.result.blockTx.vout[i].value);
		data.result.blockTx.vout[i].address = await method.base58Encode(data.result.blockTx.vout[i].lockScript.slice(2, -2));
	}

	let temp = data.result;
	temp.confirmations = 0;
	temp.totalInput = totalInput;
	temp.totalOutput = totalOutput;
	temp.fee = (temp.totalInput !== 0n) ? (totalInput - totalOutput) : 0n ;
	return temp;
}

let method = {
	// init
	startMainWindow: (finish) => ipcRenderer.invoke('startMainWindow', finish),
	rebootCore: (msg) => ipcRenderer.invoke('rebootCore', msg),

	// event listener
	newBlockListener: (callback) => ipcRenderer.on('newBlock', callback),
	addTxListener: (callback) => ipcRenderer.on('addTx', callback),
	coreErrListener: (callback) => ipcRenderer.on('coreErr', callback),

	//rpc
	walletReindex: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('walletReindex', ...params)),
	getStatus: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getStatus', ...params)),
	getGPUStatus: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getGPUStatus', ...params)),
	getLastBlock: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getLastBlock', ...params)),
	getLastBlockHeight: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getLastBlockHeight', ...params)),
	getBlockDataByHash: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getBlockDataByHash', ...params)),
	getBlockDataByHeight: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getBlockDataByHeight', ...params)),
	getTransactionByTxid: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getTransactionByTxid', ...params)),
	getTxPoolByTxid: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getTxPoolByTxid', ...params)),
	getTxPoolList: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getTxPoolList', ...params)),
	getDifficulty: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getDifficulty', ...params)),
	getPqcertByHash: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getPqcertByHash', ...params)),
	getPqcertDetailsByHash: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('getPqcertDetailsByHash', ...params)),
	mine: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('mine', ...params)),
	mineAdvance: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('mineAdvance', ...params)),

	// p2p
	p2pStatus: (...params) => ipcRenderer.invoke('postRpcServer', getPostMsg('p2pStatus', ...params)),

	//Dialog
	showOpenDialog: () => ipcRenderer.invoke('showOpenDialog'),
	showSaveDialog: () => ipcRenderer.invoke('showSaveDialog'),
	showMessageBox: (title, message) => ipcRenderer.invoke('showMessageBox', title, message),
	showErrorBox: (title, message) => ipcRenderer.invoke('showErrorBox', title, message),

	//wallet
	generateWallet: (...args) => ipcRenderer.invoke('generateWallet', ...args),
	getWalletFileDetail: (...args) => ipcRenderer.invoke('getWalletFileDetail', ...args),
	importWalletByJson: (...args) => ipcRenderer.invoke('importWalletByJson', ...args),
	exportWalletFile: (...args) => ipcRenderer.invoke('exportWalletFile', ...args),
	walletGetSignSysList: (...args) => ipcRenderer.invoke('walletGetSignSysList', ...args),
	walletAddAddress: (...args) => ipcRenderer.invoke('walletAddAddress', ...args),
	walletGetAddressList: (...args) => ipcRenderer.invoke('walletGetAddressList', ...args),
	walletGetAddressDetails: (...args) => ipcRenderer.invoke('walletGetAddressDetails', ...args),
	walletASendCreateNewTx: (...args) => ipcRenderer.invoke('walletASendCreateNewTx', ...args),
	signTxMultiAddress: (...args) => ipcRenderer.invoke('signTxMultiAddress', ...args),
	walletASend: (...args) => ipcRenderer.invoke('walletASend', ...args),
	switchWallet: (...args) => ipcRenderer.invoke('switchWallet', ...args),
	nowWalletID: (...args) => ipcRenderer.invoke('nowWalletID', ...args),
	getWalletList: (...args) => ipcRenderer.invoke('getWalletList', ...args),
	walletGetBalance: (...args) => ipcRenderer.invoke('walletGetBalance', ...args),
	walletGetTxList: (...args) => ipcRenderer.invoke('walletGetTxList', ...args),
	walletGetUTXOList: (...args) => ipcRenderer.invoke('walletGetUTXOList', ...args),
	walletAutoWatch: (...args) => ipcRenderer.invoke('walletAutoWatch', ...args),
	walletIsEncryption: (...args) => ipcRenderer.invoke('walletIsEncryption', ...args),
	getTxTempData: (...args) => ipcRenderer.invoke('getTxTempData', ...args),

	//tool
	base58Encode: (...args) => ipcRenderer.invoke('base58Encode', ...args),
	base58Decode: (...args) => ipcRenderer.invoke('base58Decode', ...args),
	getSignSysAll: (...args) => ipcRenderer.invoke('getSignSysAll', ...args),
	walletAutoWatchAll: (...args) => ipcRenderer.invoke('walletAutoWatchAll', ...args),
	floatToPercentage: (...args) => ipcRenderer.invoke('floatToPercentage', ...args),
	bigIntToFloatString: (...args) => ipcRenderer.invoke('bigIntToFloatString', ...args),
	getTxDetials,
	getTxPoolDetials,
	userTemporaryJson: (...args) => ipcRenderer.invoke('userTemporaryJson', ...args),
	settingsJson: (...args) => ipcRenderer.invoke('settingsJson', ...args),
	jsonStringify: (...args) => ipcRenderer.invoke('jsonStringify', ...args),
	jsonParse: (...args) => ipcRenderer.invoke('jsonParse', ...args),
	chAddress: (...args) => ipcRenderer.invoke('chAddress', ...args),
	numberFormat: (...args) => ipcRenderer.invoke('numberFormat', ...args),
}

contextBridge.exposeInMainWorld('electronAPI', method);
