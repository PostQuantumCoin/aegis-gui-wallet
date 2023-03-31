if(process.env.isCore) {
    require('./core-launcher.js');
}
else {
    require('./electron-main-wallet.js');
}
