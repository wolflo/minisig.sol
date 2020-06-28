import { ethers } from "ethers";
const mnemonic = "trim amount saddle learn guitar estate body this harsh never mango swarm";

const getWallets = (n: number) => {
  return Array.from(Array(n).keys()).map(n =>
    ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${n}`)
  );
}

export { getWallets }
