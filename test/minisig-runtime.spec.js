const { expect } = require('chai');
const BN = require('bn.js');

describe("Minisig runtime", () => {
  var msig;
  var usrs;
  var usrAddrs;
  const m = 2; // m of n multisig
  const n = 3;

  beforeEach("deploy minisig", async () => {
    const signers = await ethers.getSigners();
    usrs = signers.slice(1, n + 1);
    usrAddrs = sortHex(
      await Promise.all(usrs.map( (usr) => usr.getAddress() ))
    );

    const msigFactory = await ethers.getContractFactory("Minisig");
    msig = await msigFactory.deploy(m, usrAddrs);
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
      // todo
    });
  });

  describe("execute", () => {
    it("works", async () => {

    });
  });
});

const sortHex = (addrs) => (
  addrs.sort((a, b) => (
    (new BN(a.slice(2), 16)).sub(new BN(b.slice(2), 16))
  ))
);
