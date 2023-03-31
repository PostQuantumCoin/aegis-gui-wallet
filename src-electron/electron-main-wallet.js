const { app, BrowserWindow, Menu, nativeTheme, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('node:child_process');
const { RPCHandle } = require('./wallet/rpc-handle');
const commonIpcApi = require('./ipcHandle/common-api');
const walletIpcApi = require('./ipcHandle/wallet-api');
const settingsJson = require('./utils/json-data');
const coreSettingInitData = require('./template/app-config.json');
coreSettingInitData.rpcOpt.auth.pw = crypto.randomBytes(16).toString('base64');
const coreSettingJson = new settingsJson(path.join(process.cwd(), 'app-config.json'), coreSettingInitData);
const userTemporaryInitData = require('./template/user-temporary.json');
const userTemporaryJson = new settingsJson(path.join(process.cwd(), 'user.json'), userTemporaryInitData);
Menu.setApplicationMenu(false);

const platform = process.platform || os.platform();
try {
	if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
		require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
	}
} catch (_) { }

// aegis core child_process
var coreProcess, rpcHandle;
var rebooting = false;
var exiting = false;
function appSettings(){
	const setting = coreSettingJson.getData();
	const rpcOpt = setting.rpcOpt;
	const p2pOpt = setting.p2pOpt;
	const walletFilePath = setting.walletDataPath;
	const rpcHandle = new RPCHandle(rpcOpt);
	return {
		p2pOpt,
		rpcHandle,
		walletFilePath: walletFilePath?.dbDir
	};
}
function startupCore() {
	coreProcess = spawn(process.execPath, ['.'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'], env: { ...process.env, isCore: true } });
	coreProcess.stdout.setEncoding('utf8');
	coreProcess.stdout.on('data', (data) => {
		console.log(`Core: ${data}`);
	});
	coreProcess.stderr.setEncoding('utf8');
	coreProcess.stderr.on('data', (data) => {
		console.log(`ERRCORE: ${data}`);
		broadcastWindow('CoreErr', data);
	});
	coreProcess.on('message', (data) => {
		if (!data?.type) return;
		broadcastWindow(data.type, data.data);
	});
	coreProcess.on('error', (err) => {
		console.log(`ERRPROCESS: ${err}`);
	});
}
function killCore() {
	return new Promise(res => {
		if (coreProcess) {
			let setTimeoutTemp = setTimeout(() => {
				coreProcess.kill('SIGKILL');
				coreProcess = undefined;
				res(false);
			}, 10000);
			coreProcess.on('close', () => {
				clearTimeout(setTimeoutTemp);
				coreProcess = undefined;
				res(true);
			});
			coreProcess.send({type: 'exit'})
		}
		else{
			res(true);
		}
	});
}

var mainWindow, startWindow, startFlag = false;
function createStartWindow() {
	startWindow = new BrowserWindow({
		icon: path.resolve(__dirname, 'icons/icon.png'),
		width: 640,
		height: 420,
		title: 'AEGIS',
		useContentSize: true,
		show: false,
		resizable: false,
		autoHideMenuBar: true,
		transparent: true,
		frame: false,
		webPreferences: {
			contextIsolation: true,
			preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
		}
	})
	startWindow.setMinimumSize(640, 420);
	startWindow.webContents.once("did-finish-load", () => {
		startWindow.show();
	});
	startWindow.loadURL(process.env.APP_URL + '#startup');
	if (process.env.DEBUGGING) {
		startWindow.webContents.openDevTools()
	} else {
		startWindow.webContents.on('devtools-opened', () => {
			startWindow.webContents.closeDevTools()
		})
	}

	startWindow.on('closed', () => {
		startWindow = null
	})
}

function createMainWindow() {
	mainWindow = new BrowserWindow({
		icon: path.resolve(__dirname, 'icons/icon.png'),
		title: 'AEGIS',
		width: 1300,
		height: 800,
		useContentSize: true,
		autoHideMenuBar: true,
		webPreferences: {
			contextIsolation: true,
			preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
		}
	});
	mainWindow.setMinimumSize(1320, 850);
	mainWindow.webContents.once("did-finish-load", () => {
		mainWindow.show();
	});
	mainWindow.loadURL(process.env.APP_URL);

	if (process.env.DEBUGGING) {
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.webContents.on('devtools-opened', () => {
			mainWindow.webContents.closeDevTools();
		})
	}

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

function broadcastWindow(event, msg) {
	if (startWindow && startWindow.webContents) {
		startWindow.webContents.send(event, msg)
	}
	if (mainWindow && mainWindow.webContents) {
		mainWindow.webContents.send(event, msg)
	}
}

app.whenReady().then(() => {
	let rpc = appSettings();
	rpcHandle = rpc.rpcHandle;
	// startup
	ipcMain.handle('startMainWindow', function (event, finish) {
		if (startFlag === false) {
			startFlag = true;
			startWindow.close();
			createMainWindow(finish);
			setTimeout(() => {
				if (!startWindow || startWindow.isDestroyed()) {
				}
				else {
					startWindow.destroy();
				}
			}, 5000);
		}
		else {
			return;
		}
	});
	ipcMain.handle('rebootCore', async function (msg) {
		if(rebooting) return false;
		rebooting = true;
		commonIpcApi.close();
		await walletIpcApi.close();
		rpcHandle.close();
		let status = await killCore();
		if (!status) {
			rebooting = false;
			return false;
		}
		else {
			let rpc = appSettings();
			rpcHandle = rpc.rpcHandle;
			commonIpcApi.open(rpc.rpcHandle);
			walletIpcApi.open(rpc.rpcHandle, rpc.walletFilePath);
			if(rpc.p2pOpt && !rpc.p2pOpt.serverDisable){
				startupCore();
			}
			rebooting = false;
			return true;
		}
	});
	// json
	ipcMain.handle('userTemporaryJson', (event, ...args) => userTemporaryJson.command(...args));
	ipcMain.handle('settingsJson', (event, ...args) => coreSettingJson.command(...args));

	commonIpcApi.open(rpcHandle);
	walletIpcApi.open(rpcHandle, rpc.walletFilePath);
	if(rpc.p2pOpt && !rpc.p2pOpt.serverDisable){
		startupCore();
	}
	createStartWindow();
});

app.on('window-all-closed', async () => {
	if (platform !== 'darwin') {
		if(exiting) return;
		exiting = true;
		await killCore();
		if(typeof rpcHandle?.close === 'function') {
			rpcHandle.close();
		}
		app.quit()
	}
});

app.on('before-quit', async (event) => {
	if(exiting) return;
	exiting = true;
	await killCore();
	if(typeof rpcHandle?.close === 'function') {
		rpcHandle.close();
	}
	app.quit()
});
