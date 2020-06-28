import { ethers } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import utils from "./utils";

chai.use(solidity);
const { expect } = chai;

//td
interface Action {
  callType: number,
  value: ethers.BigNumberish,
  nonce: ethers.BigNumberish,
  data: string,
}

export async function checkExecute(
  msig: ethers.Contract,
  targ: ethers.Contract,
  usrs: ethers.Wallet[],
  act: Action,
  callValue: ethers.BigNumberish,
  domSep: string,
) {
    // get digest
    const digest = utils.encodeExecuteDigest(
      domSep,
      act.callType,
      act.nonce,
      act.value,
      targ.address,
      act.data
    );

    // get signatures
    const allSigs = utils.allSign(usrs, digest);

    const targNonce0 = await targ.nonce();
    /* const targBal0 = await targ. */
    const targBal0 = await targ.provider.getBalance(targ.address);

    // execute
    await msig.execute(
      act.callType,
      act.value,
      targ.address,
      act.data,
      allSigs,
      {value: callValue}
    );

    // check resulting state
    expect(await msig.nonce()).to.eq(ethers.BigNumber.from(act.nonce).add(1));

    // check call
    const log = await targ.calls(targNonce0);
    expect(log.callType).to.eq(act.callType);
    expect(log.src).to.eq(msig.address);
    expect(log.val).to.eq(act.value);
    expect(log.data).to.eq(act.data);
    expect(await targ.provider.getBalance(targ.address)).to.eq(targBal0.add(act.value));
}
