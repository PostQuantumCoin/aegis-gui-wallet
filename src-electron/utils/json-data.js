const fs = require('fs');
const path = require ('path');
const cwd = process.cwd();

class JSONData {
	constructor(FilePath=path.join(cwd, 'app-config.json'), InitialData){
		this.file = FilePath;
		this.originData = {};
		try{
			if (!fs.existsSync(FilePath)) {
				fs.writeFileSync(FilePath, JSON.stringify(InitialData));
			}
			this.getData();
		}
		catch(e){console.log('Init json file error: ' + FilePath);}
	}

	getDataFromFs(){
		try {
			return JSON.parse(fs.readFileSync(this.file));
		} catch (e) {
			return null;
		}
	}

	getData() {
		let data = this.getDataFromFs();
		if(data){
			this.originData = data;
		}
		return data;
	}

	write(data){
		fs.writeFileSync(this.file, JSON.stringify(data));
	}

	update(key, value){
		if(!key) return;
		this.originData[key] = value;
		this.write(this.originData);
	}

	updateAll(data){
		if(!data || typeof data !== 'object') return;
		this.originData = data;
		this.write(this.originData);
	}

	async command(type, ...args){
		if(!this[type]) return false;
		return await this[type](...args);
	}
}

module.exports = JSONData;
