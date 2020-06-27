const { expect } = require('chai');
const ethers = require('ethers'); // wtf buidler-ethers?
const BN = require('bn.js');

const Minisig = require('../artifacts/Minisig.json');
const Target = require('../artifacts/Target.json');
const getWallets = require('../scripts/wallets.js');
const C = require('./utils/constants.js');

describe("Minisig runtime", () => {
  var msig;
  var targ;
  var usrs;
  var usrAddrs;
  const m = 2; // m of n multisig
  const n = 3;

  before("get provider", () => {
    this.provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    this.sender = this.provider.getSigner();

    this.msigFactory = new ethers.ContractFactory(
      new ethers.utils.Interface(Minisig.abi),
      Minisig.bytecode,
      this.sender
    );
    this.targFactory = new ethers.ContractFactory(
      new ethers.utils.Interface(Target.abi),
      Target.bytecode,
      this.sender
    );
  });

  beforeEach("deploy minisig", async () => {
    usrs = sortByAddr(getWallets(n));
    usrAddrs = usrs.map(u => u.address);

    // const msigFactory = await ethers.getContractFactory("Minisig");
    // const targFactory = await ethers.getContractFactory("Target");
    msig = await this.msigFactory.deploy(m, usrAddrs);
    targ = await this.targFactory.deploy();

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

  // TODO:
  // - typescript
  // - provider versatility / get rid of buidler-ethers
  // - encode digest in js
  describe("execute", () => {
    it("works", async () => {
      const val = ethers.utils.parseEther('1');
      // const val = 0;

      // get digest
      const digest = await msig.encode(0, val, targ.address, '0x');

      // sign
      const keys = usrs.map(u => new ethers.utils.SigningKey(u.privateKey));
      const sigs = keys.map(k => ethers.utils.joinSignature(k.signDigest(digest)));
      const allSigs = ethers.utils.hexlify(ethers.utils.concat(sigs));
      await msig.execute(0, val, targ.address, '0x', allSigs, {value: val});
      // console.log('bal', await targ.);
      expect((await msig.nonce()).toString()).to.eq('1');
    });
  });
});

const sortByAddr = (wallets) => (
  wallets.sort((a, b) => (
    (new BN(a.address.slice(2), 16)).sub(new BN(b.address.slice(2), 16))
  ))
);
