const { ipcMain } = require('electron');
const base58ckOrigin = require('aegispqccoin/dist/src/crypto/bs58ck');
const { getSignSysAll } = require('aegispqccoin/dist/src/blockchain/signType');
const { floatToPercentage, bigIntToFloatString } = require('aegispqccoin/dist/src/api/type');
const { jsonParse, jsonStringify } = require('aegispqccoin/dist/src/api/json');
const { chAddress } = require('aegispqccoin/dist/src/wallet/cliArg');
const { getHexStrByBuf, numberFormat } = require('../../src/utils/utils');

function bs58Decode(str, returnString = false)
{
	let addressBuf = false;
	try {
		addressBuf = base58ckOrigin.default.decode(str);
	} catch (error) {
		return false;
	}
	if (!returnString || !addressBuf)
	{
		return addressBuf;
	}

	return getHexStrByBuf(addressBuf);
}

function open(rpcHandle){
	ipcMain.handle('getSignSysAll', (event, ...args) => getSignSysAll().map((x, i) => ({ signSysName: x.signSysName, version: 0, signType: i })));
	ipcMain.handle('floatToPercentage', (event, ...args) => floatToPercentage(...args));
	ipcMain.handle('bigIntToFloatString', (event, ...args) => bigIntToFloatString(...args));
	ipcMain.handle('jsonParse', (event, ...args) => jsonParse(...args));
	ipcMain.handle('jsonStringify', (event, ...args) => jsonStringify(...args));
	ipcMain.handle('chAddress', (event, ...args) => chAddress(...args));
	ipcMain.handle('base58Encode', (event, ...args) => base58ckOrigin.default.encode(...args));
	ipcMain.handle('base58Decode', (event, ...args) => bs58Decode(...args));
	ipcMain.handle('numberFormat', (event, ...args) => numberFormat(...args));
}

function close(){
	ipcMain.removeHandler('getSignSysAll');
	ipcMain.removeHandler('floatToPercentage');
	ipcMain.removeHandler('bigIntToFloatString');
	ipcMain.removeHandler('jsonParse');
	ipcMain.removeHandler('jsonStringify');
	ipcMain.removeHandler('chAddress');
	ipcMain.removeHandler('base58Encode');
	ipcMain.removeHandler('base58Decode');
	ipcMain.removeHandler('numberFormat');
}

module.exports = {
	open, close
};
