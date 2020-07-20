import { ethers } from "ethers";
import { solidity } from "ethereum-waffle";
import chai from "chai";

// contract artifacts
import Minisig from "../artifacts/Minisig.json";
import Target from "../artifacts/Target.json";

// utilities
import { getWallets } from "../scripts/wallets";
import { testExecute } from "./utils/tests";
import utils from "./utils/utils";
import C from "./utils/constants";

// configure chai to use waffle matchers
chai.use(solidity);
const { expect } = chai;

const msigParams = { m: 2, n: 3 } // m of n multisig

interface Factories {
  msig: ethers.ContractFactory,
  targ: ethers.ContractFactory
}

describe("Minisig runtime", () => {
  let sender: ethers.Signer;
  let usrs: ethers.Wallet[];
  let usrAddrs: string[];

  let factories: Factories
  let msig: ethers.Contract;
  let targ: ethers.Contract;

  before("get provider", () => {
    const provider = new ethers.providers.JsonRpcProvider();
    sender = provider.getSigner();
    usrs = sortByAddr(getWallets(msigParams.n));
    usrAddrs = usrs.map(u => u.address);

    factories = {
      msig: utils.getFactory(sender, Minisig),
      targ: utils.getFactory(sender, Target)
    }
  });

  beforeEach("deploy contracts", async () => {
    msig = await factories.msig.deploy(msigParams.m, usrAddrs);
    targ = await factories.targ.deploy()
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
      const domSep = utils.encodeDomainSeparator(
        msig.deployTransaction.chainId,
        msig.deployTransaction.blockNumber!,
        msig.address
      );
      expect(await msig.DOMAIN_SEPARATOR()).to.eq(domSep);
    });
  });

  // TODO:
  describe("execute", () => {
    let domSep: string;
    let badUsr: ethers.Wallet;

    before("generate badUsr wallet", () => {
      badUsr = ethers.Wallet.createRandom();
    });

    beforeEach("set domain separator", () => {
      domSep = utils.encodeDomainSeparator(
        msig.deployTransaction.chainId,
        msig.deployTransaction.blockNumber!,  // not null because we deployed it
        msig.address
      );
    });

    describe("CALL", () => {
      const callType = 0;

      it("no data, no value", async () => {
        const callValue = 0;
        const action = {
          callType: callType,
          value: 0,
          nonce: 0,
          data: '0x'
        };
        await testExecute(msig, targ, usrs, action, callValue, domSep);
      });

      it("data, value", async () => {
        const callValue = 0;
        const action = {
          callType: callType,
          value: ethers.utils.parseEther('1'),
          nonce: 0,
          data: utils.randBytes(50)
        };
        // seed msig with some eth
        await sender.sendTransaction({ to: msig.address, value: action.value });
        await testExecute(msig, targ, usrs, action, callValue, domSep);
      });

      it("data, callValue", async () => {
        const callValue = ethers.utils.parseEther('1');
        const action = {
          callType: callType,
          value: callValue,
          nonce: 0,
          data: utils.randBytes(50)
        };
        await testExecute(msig, targ, usrs, action, callValue, domSep);
      });
    });

    // TODO: do we need to go back to event so we can log from delegatecall?
    describe("DELEGATE_CALL", () => {
      const callType = 1;

      it("no data, no value", async () => {
        const callValue = 0;
        const action = {
          callType: callType,
          value: 0,
          nonce: 0,
          data: '0x'
        };
        await testExecute(msig, targ, usrs, action, callValue, domSep);
      });

      it("data, value", async () => {
        const callValue = 0;
        const action = {
          callType: callType,
          value: ethers.utils.parseEther('1'),
          nonce: 0,
          data: utils.randBytes(50)
        };
        // seed msig with some eth
        await sender.sendTransaction({ to: msig.address, value: action.value });
        await testExecute(msig, targ, usrs, action, callValue, domSep);
      });

      it("data, callValue", async () => {
        const callValue = ethers.utils.parseEther('1');
        const action = {
          callType: callType,
          value: callValue,
          nonce: 0,
          data: utils.randBytes(50)
        };
        await testExecute(msig, targ, usrs, action, callValue, domSep);
      });

    });


  });
});

function sortByAddr(wallets: ethers.Wallet[]) {
  return wallets.sort((a, b) => (
    Number(a.address.toLowerCase()) - Number(b.address.toLowerCase())
  ));
};
