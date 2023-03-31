const { Wallet } = require("aegispqccoin/dist/src/wallet/wallet");
const fs = require('fs');
const { PQCertRoot } = require('aegispqccoin/dist/src/blockchain/pqcert');
const { jsonParse, jsonStringify } = require('aegispqccoin/dist/src/api/json');
const { getCompactSizeBufferByNumber } = require('aegispqccoin/dist/src/blockchain/util');
const { SafePasswordBuf } = require('aegispqccoin/dist/src/crypto/safePassword');
const { OpReturn, Vout } = require('aegispqccoin/dist/src/blockchain/blockTx');
const { BlockTx } = require('aegispqccoin/dist/src/core');
const { shake256 } = require('aegispqccoin/dist/src/crypto/hash');
const { bigIntToFloatString } = require('aegispqccoin/dist/src/api/type');
const { checkAddressIsBs58ck, chAddress } = require('aegispqccoin/dist/src/wallet/cliArg');
const { deserialize, serialize } = require('bson');

const bs58ck = require('aegispqccoin/dist/src/crypto/bs58ck');

class WalletUtil {
	constructor(rpcHandle, walletPath = './walletFile') {
		this.rpcHandle = rpcHandle;
		this.wallet = new Wallet(walletPath);
		this.addressBs58ck = true;
	}

	async generateWallet(label, keyTypes, pwd) {
		let aesKey = undefined;
		if (pwd != undefined) {
			aesKey = new SafePasswordBuf(shake256(Buffer.from(pwd, 'utf8')));
		}
		let opt = { keyTypes };
		let newWid = await this.wallet.genNewWallet(opt, aesKey, label);
		if (newWid === false) {
			return { error: 'Failed to create a new wallet. ' }
		}
		this.wallet.switchWallet(newWid);
		return { result: `Done.` };
	}

	getWalletFileDetail(walletFilePath) {
		let walletBson;
		let walletJson;
		try {
			walletBson = fs.readFileSync(walletFilePath);
			walletJson = deserialize(walletBson, { promoteBuffers: true });
		} catch (error) {
			return { error };
		};

		if (walletJson.wallets == undefined || !Array.isArray(walletJson.wallets) || walletJson.wallets.length == 0) {
			return { error: 'Failed to import wallet file!' };
		}
		return { result: walletJson };
	}

	async importWalletByJson(walletJson, pw = '') {
		let aesKey;
		if (walletJson.encryptionFlag) {
			if (!pw) {
				return { error: 'AesKey failed!' };
			}
			aesKey = new SafePasswordBuf(shake256(Buffer.from(pw)));
		}

		let r = await this.wallet.importWallet(walletJson, aesKey);
		if (!r) {
			return false;
		}
		else if (typeof r.duplicated === 'number') {
			return { duplicated: r.duplicated }
		}

		for (let i = 0; i < r.address.length; i++) {
			let address = r.address[i];
			let req = await this.rpcHandle.post({
				method: "walletAddWatchAddress",
				params: [address]
			});
			if (req.err) {
				return { error: req.err };
			}
		}

		return true;
	}

	exportWalletFile(path, exportAllFlag) {
		let exportJson;
		if (exportAllFlag) {
			exportJson = this.wallet.exportAllWallet();
		} else {
			exportJson = this.wallet.exportWallet();
		}

		if (!exportJson) {
			return { error: 'exportWallet failed!' };
		}

		let bsonData = serialize(exportJson);
		if (!bsonData) {
			return { error: 'exportWallet bsonData failed!' };
		}

		try {
			fs.writeFileSync(path, bsonData);
		} catch (error) {
			return { error };
		}

		return { result: `${path}` };
	}

	walletGetSignSysList() {
		let kps = this.wallet.getKeyPair();
		if (!kps) {
			return { error: 'ERROR: Getting wallet keypairs failed' };
		}
		let data = [];
		for (let x in kps) {
			data.push({
				pubHash: kps[x].hash.toString('hex'),
				version: kps[x].version,
				signType: kps[x].signType,
				signName: kps[x].signSysName
			});
		}
		return { result: data };
	}

	async walletAddAddress(pkhs, level, fakeAmount = 1, version = 0, shuffleFlag = false) {
		if (pkhs == undefined || level == undefined) {
			return { error: 'ERROR: input failed!' };
		}
		if (!Array.isArray(pkhs)) {
			return { error: 'ERROR: is not array' };
		}

		let r = await this.wallet.createAddress(pkhs, level, fakeAmount, version, shuffleFlag);
		if (!r) {
			return { error: 'ERROR: Generating address failed.' };
		}

		let r2 = await this.rpcHandle.post({
			method: "walletAddWatchAddress",
			params: [r]
		});

		if (r2.err || r2.data.error) {
			console.log('\x1b[33m%s\x1b[0m', 'Not successfully synchronized with the node, please synchronize manually.(use walletAutoWatch)');
		}

		return { result: bs58ck.default.encode(r) };
	}

	walletGetAddressList(wid) {
		if (wid == undefined) {
			wid = this.wallet.wid;
		}
		let list = this.wallet.getAddressesList(wid);
		if (!list) {
			return { error: `ERROR: Get wallet ${wid} addresses list failed.` };
		}

		return { result: list.map(x => bs58ck.default.encode(x)) };
	}

	walletGetAddressDetails(address, origin) {
		if (address === undefined) {
			return { error: 'ERROR: input failed' };
		}
		let inputAddress = address;
		if (checkAddressIsBs58ck(address)) {
			let bs58 = bs58ck.default.decode(address);
			if (!bs58) {
				return { error: 'ERROR: base58check' };
			}
			address = bs58.toString('hex');
		}

		if (origin) {
			let result = this.wallet.getAddress(address);
			if (!result) {
				return { error: `ERROR: ${inputAddress} is not found` };
			}
			result.pqcertRoot = PQCertRoot.serializeToJson(result.pqcertRoot.serialize);
			return { result };
		}

		let result = this.wallet.getAddressDetails(address);
		if (!result) {
			return { error: `ERROR: ${inputAddress} is not found` };
		}
		return { result };
	}

	async signTxMultiAddress(pw) {
		let addressList = this.useAddress;
		let txRaw = this.txRawTemp;

		for (let i = 0; i < addressList.length; i++) {
			if (checkAddressIsBs58ck(addressList[i].address)) {
				let bs58 = bs58ck.default.decode(addressList[i].address);
				if (!bs58) {
					return { error: 'ERROR: base58check failed.' };
				}
				addressList[i].address = bs58.toString('hex');
			}

			if (!Array.isArray(addressList[i].signSelect)) {
				return { error: 'ERROR: Input formatting failed.' };
			}
		}

		let blockTx = (txRaw) ? BlockTx.serializeToClass(Buffer.from(txRaw, 'hex')) : this.txTemp;
		if (!blockTx) {
			return { error: 'ERROR: Serialize block transaction failed.' };
		}

		let aesKey;//: SafePasswordBuf;
		if (this.wallet.isEncryption()) {
			if (!pw) {
				return { error: 'ERROR: password empty.' };
			}
			aesKey = new SafePasswordBuf(shake256(Buffer.from(pw, 'utf8')));
		}

		let signedTx = this.wallet.signTxMultiAddress(addressList, blockTx, this.feeRatio, undefined, aesKey);
		if (!signedTx) {
			return { error: 'ERROR: sign transaction failed.' };
		}

		let json = signedTx.json;
		if (!json) {
			return { error: 'ERROR: Json failed.' };
		}

		let raw = signedTx.getSerialize();
		if (!raw) {
			return { error: 'ERROR: Get serialize failed.' };
		}

		let result = { json, raw: raw.toString('hex') };
		if (!result?.raw) {
			return { error: 'Signing failed.' };
		}

		this.txRawTemp = raw.toString('hex');
		this.txTemp = signedTx;
		return { result: 'walletASendSignTx Done!' };
	}

	async walletASendCreateNewTx(source, target, isOpReturnHEX, opReturnStr, feeRatio, changeAddress)//[source: {address: string, signSelect: number[], useAllUTXO: boolean}, target: {address: string, value: BigInt}]
	{
		if (feeRatio < 1n) {
			return { error: 'ERROR: walletSend feeRatio < 1.' };
		}
		this.feeRatio = feeRatio;
		this.source = source;
		this.target = target;
		let srcAddressDuplicateTable = {};
		let viewAddress = { source: [], target: [] };
		let srcAddressList = [];
		for (let i = 0; i < source.length; i++) {
			viewAddress.source[i] = source[i].address;
			if (checkAddressIsBs58ck(source[i].address)) {
				let bs58 = bs58ck.default.decode(source[i].address);
				if (!bs58) {
					return { error: 'ERROR: base58check failed.' };
				}
				source[i].address = bs58.toString('hex');
				if (!this.wallet.addressDoseExist(source[i].address)) {
					return { error: `ERROR: FromAddress ${viewAddress.source[i]} is not found.` };
				}
				if (srcAddressDuplicateTable[source[i].address]) {
					return { error: 'ERROR: FromAddress ${viewAddress.source[i]} was duplicated.' };
				}
			}
			srcAddressDuplicateTable[source[i].address] = true;
			srcAddressList.push(source[i].address);
		}
		let totalValue = 0n;
		for (let i = 0; i < target.length; i++) {
			viewAddress.target[i] = target[i].address;
			if (checkAddressIsBs58ck(target[i].address)) {
				let bs58 = bs58ck.default.decode(target[i].address);
				if (!bs58) {
					return { error: 'ERROR: base58check failed.' };
				}
				target[i].address = bs58.toString('hex');
				totalValue += target[i].value;
			}
		}
		let balance = await this.rpcHandle.post({
			method: "walletGetBalance",
			params: [srcAddressList]
		});
		if (balance.err) {
			return { error: balance.err };
		}
		try {
			let obj = jsonParse(balance.data);
			if (obj.error) {
				return { error: `ERROR: ${obj.error}` };
			}
			if (BigInt(obj.result.total.confirmed) < totalValue) {
				return { error: `ERROR: Insufficient balance.` };
			}
			balance = obj;
		}
		catch (e) {
			return { error: `ERROR: ${e}` };
		}

		let opReturn;
		if (isOpReturnHEX) {
			if (opReturnStr !== '') {
				if (!/^([a-f0-9]{2})+$/.test(opReturnStr)) {
					return { error: `ERROR: OpReturn format is not a hex.` };
				}
			}
			opReturn = new OpReturn(Buffer.from(opReturnStr, 'hex'));
		}
		else {
			opReturn = new OpReturn(Buffer.from(opReturnStr));
		}

		let basePhoton = opReturn.serialize.length * 5;
		let voutCS = getCompactSizeBufferByNumber(target.length);
		if (!voutCS) {
			return { error: `ERROR: getCompactSizeBufferByNumber error!` };;
		}
		basePhoton += voutCS.length;
		basePhoton += (target.length * 8);
		let oprCs = getCompactSizeBufferByNumber(opReturn.serialize.length);
		if (!oprCs) {
			return { error: 'ERROR: pubHashs error!' };
		}
		basePhoton += oprCs.length;
		let useValue = 0n;
		let totalExtraValue = 0n;
		this.useAddress = [];
		let thisBlockTx = BlockTx.jsonDataToClass({
			version: 0,
			vin: [],
			vout: target.map(({ address, value }) => ({ value: value.toString(), lockScript: `20${address}fc` })),
			pqcert: [],
			opReturn: opReturn.toString(),
			nLockTime: 0
		});
		if (!thisBlockTx) {
			return { error: 'ERROR: creat tx error!' };
		}

		let pqcertHashTable = {};
		for (let i = 0; i < source.length; i++) {
			let srcAddress = source[i].address;
			let useAllThis = source[i].useAllUTXO;
			let signSelect = source[i].signSelect;
			if (useValue >= totalValue && !useAllThis) {
				continue;
			}

			let thisAddrBalance = balance.result?.sub[srcAddress]?.confirmed;
			if (thisAddrBalance === undefined) {
				return { error: `${thisAddrBalance} balance not found` };
			}
			let thisValue = totalValue - useValue;
			let addressD = this.walletGetAddressDetails(srcAddress);
			if (addressD.error) {
				return { error: addressD.error };
			}

			if (signSelect.length !== addressD.result.level) {
				return { error: `ERROR: The number of signatures is incorrect! (It should be ${addressD.result.level}, you entered ${signSelect.length})` };
			}
			let photon = this.wallet.getSignPhoton(srcAddress, signSelect);
			if (!photon) {
				return { error: 'ERROR: walletSend failed!' };
			}

			let pqcertCheck = await this.checkSignPqcert(srcAddress, signSelect, true);
			let pqcertAdd = [];
			if (pqcertCheck.error) {
				return { error: 'ERROR: Pqcert check error!' };
			}

			if (!pqcertCheck.result.root.check) {
				if (!pqcertHashTable[srcAddress]) {
					let pqcertRoot = this.wallet.getPqcertRootByAddress(srcAddress);
					if (!pqcertRoot) {
						return { error: 'pqcertRoot is not found!' }
					}

					photon += pqcertRoot.serialize.length * 2;
					let cs = getCompactSizeBufferByNumber(pqcertRoot.serialize.length);
					if (!cs) {
						return { error: 'ERROR: Pqcert error!' };
					}
					photon += cs.length;
					pqcertAdd.push(pqcertRoot);
					pqcertHashTable[srcAddress] = true;
				}
			}

			for (let i = 0; i < pqcertCheck.result.pubHashs.length; i++) {
				if (!pqcertCheck.result.pubHashs[i].check) {
					if (!pqcertHashTable[pqcertCheck.result.pubHashs[i].hash]) {
						let pqcertPubKey = this.wallet.getPqcertPubKeyByHash(pqcertCheck.result.pubHashs[i].hash);
						if (!pqcertPubKey) {
							return { error: 'pqcertPubKey is not found!' };
						}
						photon += pqcertPubKey.serialize.length * 2;
						let cs = getCompactSizeBufferByNumber(pqcertPubKey.serialize.length);
						if (!cs) {
							return { error: 'ERROR: pubHashs error!' };
						}
						photon += cs.length;
						pqcertAdd.push(pqcertPubKey);
						pqcertHashTable[pqcertCheck.result.pubHashs[i].hash] = true;
					}
				}
			}

			let extraValue = (i === 0) ? BigInt(basePhoton + photon) * feeRatio : BigInt(photon) * feeRatio;
			let Signs = [];
			let addressDetails = this.wallet.getAddressDetails(srcAddress);
			if (!addressDetails) {
				return { error: 'addressDetails is not found!' }
			}
			for (let i = 0; i < signSelect.length; i++) {
				let signName = addressDetails.signSys[signSelect[i]];
				if (signName === 'FAKE') {
					return { error: 'sign is FAKE!' }
				}
				Signs.push(signName);
			}
			let r0;
			if (thisValue + extraValue + totalExtraValue > thisAddrBalance || useAllThis) {
				// use all utxo
				r0 = await this.walletCreateAdvancedTransation(srcAddress, 0n, extraValue + totalExtraValue, feeRatio, true, true, false);
				if (r0.result) {
					if (extraValue > r0.result.inValue) {
						totalExtraValue += (extraValue - r0.result.inValue);
					}

				}
			}
			else {
				r0 = await this.walletCreateAdvancedTransation(srcAddress, thisValue, extraValue + totalExtraValue, feeRatio, false, true, false);
				totalExtraValue = 0n;
			}
			if (r0.error) {
				return { error: r0.error };
			}
			useValue += r0.result.inValue;
			let tx = BlockTx.serializeToClass(Buffer.from(r0.result.blockTx.raw, 'hex'));
			if (!tx) {
				return { error: 'ERROR: BlockTx error!' };
			}
			for (let j = 0; j < tx.vin.length; j++) {
				thisBlockTx.vin.push(tx.vin[j]);
			}
			for (let j = 0; j < pqcertAdd.length; j++) {
				thisBlockTx.addPqcert(pqcertAdd[j]);
			}
			this.useAddress.push({ address: srcAddress, signSelect, signSelectName: Signs, inValue: r0.result.inValue });
		}

		if (changeAddress === '') {
			changeAddress = this.useAddress[this.useAddress.length - 1].address;
		}
		else if (!chAddress(changeAddress)) {
			return { error: 'ERROR: change address' }
		}
		if (checkAddressIsBs58ck(changeAddress)) {
			let bs58 = bs58ck.default.decode(changeAddress);
			if (!bs58) {
				return { error: 'ERROR: base58check!' };
			}
			changeAddress = bs58.toString('hex');
		}

		let changeVout = Vout.jsonDataToSerialize({ value: (useValue - totalValue).toString(), lockScript: `20${changeAddress}fc` });
		if (!changeVout) {
			return { error: 'ERROR: changeVout!' };
		}
		thisBlockTx.vout.push(new Vout(changeVout, true));
		let txRaw = thisBlockTx.getSerialize();
		if (!txRaw) {
			return { error: 'ERROR: BlockTx raw error!' };
		}

		this.txRawTemp = txRaw.toString('hex');
		this.useValue = useValue;
		this.totalValue = totalValue;

		return { result: "walletASendCreateNewTx OK!" };
	}

	getTxTempData() {
		if (!this.txTemp) {
			return { error: 'ERROR: txTemp was not found' }
		}

		let source = [];
		let changeVoutIndex = this.txTemp.vout.length - 1;
		let finalTarget = this.txTemp.vout.slice(0, changeVoutIndex).map(({ address, value }) => ({ address: bs58ck.default.encode(address), value: bigIntToFloatString(value) }));
		let inValue;
		let changeAmount = (this.txTemp.vout[changeVoutIndex]) ? this.txTemp.vout[changeVoutIndex].value : 0n;//: bigint | string
		let sendAmount;
		let fee = this.useValue - this.totalValue - changeAmount;
		let finalChange = (this.txTemp.vout[changeVoutIndex]) ? { address: bs58ck.default.encode(this.txTemp.vout[changeVoutIndex].address), value: this.txTemp.vout[changeVoutIndex].value } : null;

		if (finalChange && !finalChange.address) {
			return { error: "ERROR: final change address error" };
		}
		let actualPhoton = this.txTemp.getPhoton();
		if (!actualPhoton) {
			return { error: 'Getting ActualPhoton failed!' };
		}
		let photonDetails = this.txTemp.getPhotonDetails();
		if (!photonDetails) {
			return { error: 'Getting Photon details failed!' };
		}

		inValue = bigIntToFloatString(this.useValue);
		sendAmount = bigIntToFloatString(this.totalValue);
		changeAmount = bigIntToFloatString(changeAmount);
		fee = bigIntToFloatString(fee);
		this.useAddress.forEach(x => {
			source.push({
				address: bs58ck.default.encode(x.address),
				signSelect: x.signSelect,
				signSelectName: x.signSelectName,
				inValue: bigIntToFloatString(x.inValue)
			});
		});

		return {
			source,
			target: finalTarget,
			UTXOAmount: inValue,
			sendAmount,
			changeAmount,
			fee,
			actualPhoton,
			photonDetails,
		};
	}

	async walletASend(sendFlag = false) {
		if (sendFlag) {
			if (!this.txTemp) {
				return { error: 'ERROR: txTemp is not found' };
			}
			let r = await this.rpcHandle.post({
				method: "addTx",
				params: [this.txTemp.json]
			});
			if (r.err) {
				return { error: r.err };
			}
			let result = jsonParse(r.data);
			this.clearTxTemp();
			return result;
		}
		else {
			return this.clearTxTemp();
		}
	}

	switchWallet(walletID) {
		if (this.wallet.switchWallet(walletID)) {
			return { result: 'Switch done.' };
		}
		return { error: 'ERROR: Wallet switch failed.' };
	}

	nowWalletID() {
		return this.wallet.wid;
	}

	getWalletList() {
		let kp = this.wallet.getWalletList();
		if (!kp) {
			return { error: 'ERROR: Get wallet list failed.' };
		}

		if (kp.length === 0) {
			return { error: 'ERROR: no wallet.' };
		}

		return { result: kp }
	}

	async walletAutoWatch(wid) {
		let result = [];
		let addressList = this.wallet.getAddressesList(wid);
		if (!addressList) {
			return { error: 'wallet is not found' };
		}

		for (let i = 0; i < addressList.length; i++) {
			let address = addressList[i];
			let r = await this.rpcHandle.post({
				method: "walletAddWatchAddress",
				params: [address]
			});
			if (r.err) {
				return { error: r.err };
			}
			result.push(bs58ck.default.encode(address));
		}
		return { result };
	}

	async walletAutoWatchAll() {
		let walletList = await this.getWalletList();
		if (Array.isArray(walletList?.result)) {
			for (let i = 0; i < walletList.result.length; i++) {
				await this.walletAutoWatch(walletList.result[i].id);
			}
		}
	}

	async walletGetBalance(address) {
		if (!Array.isArray(address)) {
			return { error: 'ERROR: is not array' };
		}
		for (let i = 0; i < address.length; i++) {
			if (checkAddressIsBs58ck(address[i])) {
				let bs58 = bs58ck.default.decode(address[i]);
				if (!bs58) {
					return { error: 'ERROR: base58check' };
				}
				address[i] = bs58.toString('hex');
			}
		}

		let r = await this.rpcHandle.post({
			method: "walletGetBalance",
			params: [address]
		});
		if (r.err) {
			return { error: r.err };
		}

		try {
			let obj = jsonParse(r.data);
			if (obj.error) {
				return { error: obj.error };
			}

			for (let x in obj.result.sub) {
				let b58 = bs58ck.default.encode(x);
				obj.result.sub[b58] = obj.result.sub[x];
				delete obj.result.sub[x];
			}

			return obj;
		}
		catch (e) {
			return { error: `ERROR: ${e}` };
		}
	}

	async walletGetTxList(address, limit, page, reverse) {
		if (checkAddressIsBs58ck(address)) {
			let bs58 = bs58ck.default.decode(address);
			if (!bs58) {
				return { error: 'ERROR: base58check' };
			}
			address = bs58.toString('hex');
		}

		let skip = page * limit;
		let r = await this.rpcHandle.post({
			method: "walletGetTxList",
			params: [address, limit, skip, reverse, true]
		});
		if (r.err) {
			return { error: r.err };
		}

		let obj;
		try {
			obj = jsonParse(r.data);
			if (obj.error) {
				return { error: obj.error };
			}
		}
		catch (e) {
			return { error: `ERROR: ${e}` };
		}
		let newObj = { txList: [], waitTx: [], mining: [] };

		//txList
		obj.result.txList.forEach(x => {
			newObj.txList.push({ txid: x.txid, sendValue: x.sendValue, receiveValue: x.receiveValue, height: x.height, time: x.time });
		});

		//waitTx
		obj.result.waitTx.forEach(x => {
			newObj.waitTx.push({ txid: x.txid, sendValue: x.value.sendValue, receiveValue: x.value.receiveValue });
		});

		//mining
		obj.result.mining.forEach(x => {
			newObj.mining.push({ txid: x.txid, sendValue: x.value.sendValue, receiveValue: x.value.receiveValue });
		});

		return { result: newObj };
	}

	async walletGetUTXOList(address, limit, page, reverse) {
		if (checkAddressIsBs58ck(address)) {
			let bs58 = bs58ck.default.decode(address);
			if (!bs58) {
				return { error: 'ERROR: base58check' };
			}
			address = bs58.toString('hex');
		}

		let skip = page * limit;
		let r = await this.rpcHandle.post({
			method: "walletGetUTXOList",
			params: [address, limit, skip, reverse]
		});
		if (r.err) {
			return { error: r.err };
		}
		try {
			let obj = jsonParse(r.data);
			if (obj.error) {
				return { error: obj.error };
			}
			return obj;
		}
		catch (e) {
			return { error: `ERROR: ${e}` };
		}
	}

	async checkSignPqcert(address, signSelect, returnObj) {
		if (checkAddressIsBs58ck(address)) {
			let bs58 = bs58ck.default.decode(address);
			if (!bs58) {
				return { error: 'ERROR: base58check' };
			}
			address = bs58.toString('hex');
		}

		if (!Array.isArray(signSelect)) {
			return { error: 'ERROR: Input formatting error' };
		}

		let check = { root: {}, pubHashs: [] };
		let r = await this.rpcHandle.post({ method: 'getPqcertByHash', params: [address] });
		if (r.err) {
			return { error: r.err };
		}

		let obj
		try {
			obj = jsonParse(r.data);
		}
		catch (e) {
			return { error: `ERROR: ${e}` };
		}

		check.root = { hash: address, check: (obj.error) ? false : true };
		let addressData = this.wallet.getAddress(address);
		if (!addressData) {
			return { error: 'addressData is not found' };
		}

		let pubHashs = addressData.pqcertRoot.getPubKeyHashAll();
		if (!pubHashs) {
			return { error: 'pubHashs is not found' };
		}

		for (let i = 0; i < signSelect.length; i++) {
			if (addressData.addressSeed.keys[signSelect[i]] === -1) {
				return { error: `ERROR: sign order ${signSelect[i]} is fake` };
			}

			let key = pubHashs[signSelect[i]].toString('hex');
			if (!key) {
				return { error: `ERROR: sign order ${signSelect[i]} is not found` };
			}

			let r = await this.rpcHandle.post({ method: 'getPqcertByHash', params: [key] });
			if (r.err) {
				return { error: r.err };
			}

			try {
				obj = jsonParse(r.data);
			}
			catch (e) {
				return { error: `ERROR: ${e}` };
			}

			check.pubHashs[i] = { hash: key, check: (obj.error) ? false : true };
		}

		if (returnObj) {
			return { result: check };
		}

		let json = jsonStringify(check);
		if (!json) {
			return { error: true };
		}

		return { result: json };
	}

	async walletCreateAdvancedTransation(srcAddress, target, extraValue = 10000n, feeRatio = 1n, useAllUTXO = false, rawFlag = true, tempFlag = true) {
		if (checkAddressIsBs58ck(srcAddress)) {
			let bs58 = bs58ck.default.decode(srcAddress);
			if (!bs58) {
				return { error: 'ERROR: base58check' };
			}
			srcAddress = bs58.toString('hex');
		}
		let r;
		if (typeof target === 'bigint') {
			r = await this.rpcHandle.post({
				method: "walletCreateAdvancedTransation",
				params: [srcAddress, target.toString(), extraValue.toString(), feeRatio.toString(), useAllUTXO, rawFlag]
			});
		}
		else {
			let targetCopy = target.map(x => {
				let address;
				if (checkAddressIsBs58ck(x.address)) {
					let bs58 = bs58ck.default.decode(x.address);
					if (!bs58) {
						return { error: 'ERROR: base58check' };
					}
					address = bs58.toString('hex');
				}
				else {
					address = x.address;
				}
				return { address, value: x.value.toString() }
			});
			r = await this.rpcHandle.post({
				method: "walletCreateAdvancedTransation",
				params: [srcAddress, targetCopy, extraValue.toString(), feeRatio.toString(), useAllUTXO, rawFlag]
			});
		}


		if (r.err) {
			return { error: r.err };
		}

		try {
			let obj = jsonParse(r.data);
			if (obj.error) {
				return { error: `ERROR: ${obj.error}` };
			}
			if (tempFlag) {
				let blockTx = BlockTx.jsonDataToClass((rawFlag) ? obj.result.blockTx.json : obj.result.blockTx);
				if (blockTx) {
					this.txTemp = blockTx;
				}
			}
			return { result: obj.result }
		}
		catch (e) {
			return { error: `ERROR: ${e}` };
		}
	}

	clearTxTemp() {
		delete this.useAddress;
		delete this.txTemp;
		delete this.txRawTemp;
		delete this.source;
		delete this.target;
		delete this.feeRatio;
		delete this.useValue;
		delete this.totalValue;

		return { result: 'Clear tx temp!' };
	}

	walletIsEncryption() {
		return this.wallet.isEncryption();
	}

	async exit() {
		return await this.wallet.exit();
	}
}

exports.WalletUtil = WalletUtil;
