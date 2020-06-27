const ethers = require('ethers');
const mnemonic = "trim amount saddle learn guitar estate body this harsh never mango swarm";

module.exports = (n) => {
  return [...Array(n).keys()].map(n =>
    ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`)
  );
}
