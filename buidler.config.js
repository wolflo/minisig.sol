usePlugin('buidler-ethers-v5');

const getWallets = require('./scripts/wallets.js');

task("wallets", "Prints mnemonic-derived wallet addresses", async () => {
  const wallets = getWallets();
  for(const wallet of wallets) {
    console.log(wallet.address);
  }
});

module.exports = {
  defaultNetwork: "buidlerevm",
  solc: {
    version: "0.6.6",
    optimizer: {
      enabled: false,
      runs: 200
    },
  },
};
