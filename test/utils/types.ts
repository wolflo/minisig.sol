import { ethers } from "ethers";

interface Factories {
  msig: ethers.ContractFactory,
  targ: ethers.ContractFactory
}

interface Action {
  type: number,
  gas: ethers.BigNumberish,
  value: ethers.BigNumberish,
  data: string
}

export {
  Factories,
  Action
}
