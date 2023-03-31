const { ipcMain, dialog } = require('electron');

async function showOpenDialog(bw) {
	if (!bw) return false;
	let filePath = await dialog.showOpenDialog(bw, { properties: ['openFile'] });
	return filePath;
}

async function showOpenWalletDialog(bw) {
	if (!bw) return false;
	let filePath = await dialog.showOpenDialog(bw, {
		filters: [
			{ name: 'Wallet', extensions: ['wallet'] },
		],
		properties: [
			'openFile', 'promptToCreate', 'dontAddToRecent'
		]
	});
	return filePath;
}

async function showSaveDialog(bw) {
	if (!bw) return false;
	let filePath = await dialog.showSaveDialog(bw, {});
	return filePath;
}

async function showSaveWalletDialog(bw) {
	if (!bw) return false;
	let filePath = await dialog.showSaveDialog(bw, {
		filters: [
			{ name: 'Wallet', extensions: ['wallet'] },
		],
		properties: [
			'showOverwriteConfirmation', 'dontAddToRecent'
		]
	});
	if(filePath?.filePath && filePath.filePath.slice(-7) !== '.wallet'){
		filePath.filePath += ".wallet";
	}
	return filePath;
}

async function showMessageBox(bw, event, title, message) {
	if (!bw) return false;
	dialog.showMessageBox(bw, { title, message });
}

async function showErrorBox(event, title, content) {
	dialog.showErrorBox(title, content);
}

module.exports = {
	ipcApi(){
		ipcMain.handle('showOpenDialog', showOpenDialog);
		ipcMain.handle('showSaveDialog', showSaveDialog);
		ipcMain.handle('showMessageBox', showMessageBox);
		ipcMain.handle('showErrorBox', showErrorBox);
	},
	showOpenDialog,
	showOpenWalletDialog,
	showSaveDialog,
	showSaveWalletDialog,
	showMessageBox,
	showErrorBox,
}
