const { expect } = require('chai');
const eth = require('ethers'); // wtf buidler-ethers?
const BN = require('bn.js');

const getWallets = require('../scripts/wallets.js');
const C = require('./utils/constants.js');

describe("Minisig runtime", () => {
  var msig;
  var targ;
  var usrs;
  var usrAddrs;
  const m = 2; // m of n multisig
  const n = 3;

  beforeEach("deploy minisig", async () => {
    usrs = sortByAddr(getWallets(n));
    usrAddrs = usrs.map(u => u.address);

    const msigFactory = await ethers.getContractFactory("Minisig");
    msig = await msigFactory.deploy(m, usrAddrs);

    const targFactory = await ethers.getContractFactory("Target");
    targ = await targFactory.deploy();
  });

  describe("getters", () => {
    it("allSigners()", async () => {
      expect(await msig.allSigners()).to.deep.eq(usrAddrs);
    });
    it("threshold()", async () => {
      expect(await msig.threshold()).to.eq(m);
    });
    it("nonce", async () => {
      expect((await msig.nonce()).toString()).to.eq('0');
    });
    it("DOMAIN_SEPARATOR()", async () => {
      //todo
    });
  });

  describe("execute()", () => {
    it("works", async () => {
      // const val = eth.utils.parseEther('1');
      const val = 0;

      // get digest
      const digest = await msig.encode(0, val, targ.address, '0x');
      console.log('digest', digest);

      // sign
      const keys = usrs.map(u => new eth.utils.SigningKey(u.privateKey));
      const sigs = keys.map(k => eth.utils.joinSignature(k.signDigest(digest)));
      const allSigs = eth.utils.hexlify(eth.utils.concat(sigs));
      await msig.execute(0, val, targ.address, '0x', allSigs)
    });
  });
});

const sortByAddr = (wallets) => (
  wallets.sort((a, b) => (
    (new BN(a.address.slice(2), 16)).sub(new BN(b.address.slice(2), 16))
  ))
);
