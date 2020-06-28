import { ethers } from "ethers"; // wtf buidler-ethers?
import chai from "chai";
import { solidity } from "ethereum-waffle";
import BN from "bn.js";

// contract artifacts
import Minisig from "../artifacts/Minisig.json";
import Target from "../artifacts/Target.json";

// utilities
import { getWallets } from "../scripts/wallets";
import C from "./utils/constants";

// configure chai to use waffle matchers
chai.use(solidity);
const { expect } = chai;

const msigParams = { m: 2, n: 3 } // m of n multisig

describe("Minisig runtime", () => {
  let sender: ethers.Signer;
  let usrs: ethers.Wallet[];
  let usrAddrs: string[];

  let msig: ethers.Contract;
  let targ: ethers.Contract;
  let msigFactory: ethers.ContractFactory;
  let targFactory: ethers.ContractFactory;

  before("get provider", () => {
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    sender = provider.getSigner();

    msigFactory = new ethers.ContractFactory(
      new ethers.utils.Interface(Minisig.abi),
      Minisig.bytecode,
      sender
    );
    targFactory = new ethers.ContractFactory(
      new ethers.utils.Interface(Target.abi),
      Target.bytecode,
      sender
    );
  });

  beforeEach("deploy minisig", async () => {
    usrs = sortByAddr(getWallets(msigParams.n));
    usrAddrs = usrs.map(u => u.address);

    msig = await msigFactory.deploy(msigParams.m, usrAddrs);
    targ = await targFactory.deploy();
  });

  describe("getters", () => {
    it("allSigners()", async () => {
      expect(await msig.allSigners()).to.deep.eq(usrAddrs);
    });
    it("threshold()", async () => {
      expect(await msig.threshold()).to.eq(msigParams.m);
    });
    it("nonce", async () => {
      expect(await msig.nonce()).to.eq(0);
    });
    it("DOMAIN_SEPARATOR()", async () => {
      //todo
    });
  });

  // TODO:
  // - typescript
  // - provider versatility / get rid of buidler-ethers
  // - encode digest in js
  describe("execute", () => {
    it("works", async () => {
      const val = ethers.utils.parseEther('1');

      // get digest
      const digest = await msig.encode(0, val, targ.address, '0x');

      // sign
      const keys = usrs.map(u => new ethers.utils.SigningKey(u.privateKey));
      const sigs = keys.map(k => ethers.utils.joinSignature(k.signDigest(digest)));
      const allSigs = ethers.utils.hexlify(ethers.utils.concat(sigs));
      await msig.execute(0, val, targ.address, '0x', allSigs, {value: val});
      expect(await msig.nonce()).to.eq(1);
    });
  });
});

function sortByAddr(wallets: ethers.Wallet[]) {
  return wallets.sort((a, b) => (
    Number(a.address.toLowerCase()) - Number(b.address.toLowerCase())
  ));
};
