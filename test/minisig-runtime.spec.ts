import { ethers } from "ethers";
import { solidity } from "ethereum-waffle";
import chai from "chai";

// contract artifacts
import Minisig from "../artifacts/Minisig.json";
import Target from "../artifacts/Target.json";

// utilities
import { getWallets } from "../scripts/wallets";
import { checkExecute } from "./utils/tests";
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

    it("with msg.value == _value > 0", async () => {
      const action = {
        callType: 0,
        value: ethers.utils.parseEther('1'),
        nonce: 0,
        data: '0x'
      };
      await checkExecute(
        msig,
        targ,
        usrs,
        action,
        action.value,
        domSep
      );
      /* const val = ethers.utils.parseEther('1'); */

      /* // get digest */
      /* const digest = utils.encodeExecuteDigest( */
      /*   domSep, */
      /*   0, */
      /*   ethers.BigNumber.from(0), */
      /*   val, */
      /*   targ.address, */
      /*   '0x' */
      /* ); */

      /* // get signatures */
      /* const allSigs = utils.allSign(usrs, digest); */

      /* // execute */
      /* await msig.execute(0, val, targ.address, '0x', allSigs, {value: val}); */

      /* // check resulting world state */
      /* expect(await msig.nonce()).to.eq(1); */
      /* /1* expect(await targ.calls((await target.nonce()).sub(1)); *1/ */
      /* const log = await targ.calls((await targ.nonce()).sub(1)); */
      /* expect(log.callType).to.eq(0); */
      /* expect(log.src).to.eq(msig.address); */
      /* expect(log.val).to.eq(val); */
      /* expect(log.data).to.eq('0x'); */

    });
  });
});

function sortByAddr(wallets: ethers.Wallet[]) {
  return wallets.sort((a, b) => (
    Number(a.address.toLowerCase()) - Number(b.address.toLowerCase())
  ));
};
