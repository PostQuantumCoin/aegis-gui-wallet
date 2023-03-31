const { BrowserWindow, ipcMain } = require('electron');
const { WalletUtil } = require('../wallet/wallet-util');
const dialog = require('../utils/electron-dialog');
var walletUtil;
async function getWalletFileDetail(walletUtil) {
	let bws = BrowserWindow.getAllWindows();
	if (bws.length < 1) return false;
	let filePath = await dialog.showOpenWalletDialog(bws[0]);
	if (!filePath.canceled && filePath.filePaths[0]) {
		return await walletUtil.getWalletFileDetail(filePath.filePaths[0]);
	}
	else {
		return false;
	}
}
async function importWalletByJson(walletUtil, data) {
	let dataTemp = JSON.parse(data);
	let walletData = {
		keySeed: Buffer.from(dataTemp.keySeed),
		addrSeed: Buffer.from(dataTemp.addrSeed),
		addrs: dataTemp.addrs,
		encryptionFlag: dataTemp.encryptionFlag,
		label: dataTemp.label
	}
	return await walletUtil.importWalletByJson(walletData, dataTemp.password);
}
async function exportWalletFile(walletUtil, exportAllFlag) {
	let bws = BrowserWindow.getAllWindows();
	if (bws.length < 1) return false;
	let filePath = await dialog.showSaveWalletDialog(bws[0]);
	if (!filePath.canceled && filePath.filePath) {
		return await walletUtil.exportWalletFile(filePath.filePath, exportAllFlag);
	}
	else {
		return false;
	}
}

function open(rpcHandle, walletFilePath) {
	walletUtil = new WalletUtil(rpcHandle, walletFilePath);
	//Rpc
	ipcMain.handle('postRpcServer', rpcHandle.handlePost.bind(rpcHandle));
	//wallet
	ipcMain.handle('generateWallet', (event, ...args) => walletUtil.generateWallet(...args));
	ipcMain.handle('getWalletFileDetail', (event, ...args) => getWalletFileDetail(walletUtil, ...args));
	ipcMain.handle('importWalletByJson', (event, ...args) => importWalletByJson(walletUtil, ...args));
	ipcMain.handle('exportWalletFile', (event, ...args) => exportWalletFile(walletUtil, ...args));
	ipcMain.handle('walletGetSignSysList', (event, ...args) => walletUtil.walletGetSignSysList(...args));
	ipcMain.handle('walletAddAddress', (event, ...args) => walletUtil.walletAddAddress(...args));
	ipcMain.handle('walletGetAddressList', (event, ...args) => walletUtil.walletGetAddressList(...args));
	ipcMain.handle('walletGetAddressDetails', (event, ...args) => walletUtil.walletGetAddressDetails(...args));
	ipcMain.handle('walletASendCreateNewTx', (event, ...args) => walletUtil.walletASendCreateNewTx(...args));
	ipcMain.handle('signTxMultiAddress', (event, ...args) => walletUtil.signTxMultiAddress(...args));
	ipcMain.handle('walletASend', (event, ...args) => walletUtil.walletASend(...args));
	ipcMain.handle('switchWallet', (event, ...args) => walletUtil.switchWallet(...args));
	ipcMain.handle('nowWalletID', (event, ...args) => walletUtil.nowWalletID(...args));
	ipcMain.handle('getWalletList', (event, ...args) => walletUtil.getWalletList(...args));
	ipcMain.handle('walletGetBalance', (event, ...args) => walletUtil.walletGetBalance(...args));
	ipcMain.handle('walletGetTxList', (event, ...args) => walletUtil.walletGetTxList(...args));
	ipcMain.handle('walletGetUTXOList', (event, ...args) => walletUtil.walletGetUTXOList(...args));
	ipcMain.handle('walletAutoWatch', (event, ...args) => walletUtil.walletAutoWatch(...args));
	ipcMain.handle('walletAutoWatchAll', (event, ...args) => walletUtil.walletAutoWatchAll(...args));
	ipcMain.handle('walletIsEncryption', (event, ...args) => walletUtil.walletIsEncryption(...args));
	ipcMain.handle('getTxTempData', (event, ...args) => walletUtil.getTxTempData(...args));
}

async function close() {
	ipcMain.removeHandler('postRpcServer');
	ipcMain.removeHandler('generateWallet');
	ipcMain.removeHandler('getWalletFileDetail');
	ipcMain.removeHandler('importWalletByJson');
	ipcMain.removeHandler('exportWalletFile');
	ipcMain.removeHandler('walletGetSignSysList');
	ipcMain.removeHandler('walletAddAddress');
	ipcMain.removeHandler('walletGetAddressList');
	ipcMain.removeHandler('walletGetAddressDetails');
	ipcMain.removeHandler('walletASendCreateNewTx');
	ipcMain.removeHandler('signTxMultiAddress');
	ipcMain.removeHandler('walletASend');
	ipcMain.removeHandler('switchWallet');
	ipcMain.removeHandler('nowWalletID');
	ipcMain.removeHandler('getWalletList');
	ipcMain.removeHandler('walletGetBalance');
	ipcMain.removeHandler('walletGetTxList');
	ipcMain.removeHandler('walletGetUTXOList');
	ipcMain.removeHandler('walletAutoWatch');
	ipcMain.removeHandler('walletAutoWatchAll');
	ipcMain.removeHandler('walletIsEncryption');
	ipcMain.removeHandler('getTxTempData');
	ipcMain.removeHandler('mine');

	if (walletUtil) {
		await walletUtil.exit();
	}
}

module.exports = {
	open, close
};
