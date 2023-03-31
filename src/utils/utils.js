function delay(ms) {
	return new Promise((res) => {
		setTimeout(() => {
			res(true);
		}, ms);
	});
}

function getBestHeight(p2pList) {
	let heightTemp = {};
	if (Array.isArray(p2pList)) {
		for (let i = 0; i < p2pList.length; i++) {
			let item = p2pList[i];
			if (item && item.height) {
				if (typeof heightTemp[item.height] === 'number') {
					heightTemp[item.height]++;
				}
				else {
					heightTemp[item.height] = 1;
				}
			}
		}
	}
	let topHeight = 0;
	for (let i in heightTemp) {
		let height = parseInt(i);
		if (height > topHeight) {
			topHeight = height;
		}
	}
	return topHeight;
}

async function checkReindexAfter() {
	let count = 0;
	while (count++ < 360) {
		let status = await window.electronAPI.getStatus();
		if (status && !status.err && status?.result?.walletReindexing === false) {
			return true;
		} else {
			await delay(10000);
		}
	}
	return false;
}

async function checkCoreActivation() {
	let count = 0;
	while (count++ < 12) {
		let status = await window.electronAPI.getLastBlockHeight();
		if (status && !status.err && typeof status?.result === 'number') {
			return true;
		} else if (status.err && status.err.toString().includes('ETIMEDOUT')){
			count +=5;
		}
		await delay(5000);
	}
	return false;
}

function getHexStrByBuf(buf) {
	let hexStr = '';
	for (let i = 0; i < buf.length; i++) {
		hexStr += buf[i].toString(16).padStart(2, '0');
	}
	return hexStr;
}

function bigIntToFloatString(v) {
	let str = v.toString().padStart(9, '0');
	str = str.split('');
	str.splice(-8, 0, '.');
	return str.join('');
}

function numberFormat(valueStr) {
	return new Intl.NumberFormat('en', { minimumFractionDigits: 8 }).format(valueStr);
}

export {
	delay, getBestHeight, checkReindexAfter, checkCoreActivation, bigIntToFloatString, numberFormat, getHexStrByBuf
}
