// usePlugin('buidler-ethers-v5');
import { BuidlerConfig, task } from "@nomiclabs/buidler/config";
import { getWallets } from "./scripts/wallets";

task("wallets", "Prints mnemonic-derived wallet addresses", async () => {
  const wallets = getWallets(3);
  for(const wallet of wallets) {
    console.log(wallet.address);
  }
});

const config: BuidlerConfig = {
  defaultNetwork: "buidlerevm",
  solc: {
    version: "0.6.6",
    optimizer: {
      enabled: false,
      runs: 200
    },
  },
};

export default config;
