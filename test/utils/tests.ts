import { ethers } from "ethers";
import { solidity } from "ethereum-waffle";
import chai from "chai";

import { Action } from "./types";
import utils from "./utils";

chai.use(solidity);
const { expect } = chai;

async function doExec(
  msig: ethers.Contract,
  dst: string,
  usrs: ethers.Wallet[],
  domSep: string,
  nonce: ethers.BigNumberish,
  act: Action,
  callValue: ethers.BigNumberish,
) {
    // get digest
    const digest = utils.encodeExecDigest(
      domSep,
      nonce,
      dst,
      act
    );

    // get signatures
    const allSigs = utils.allSign(usrs, digest);

    await msig.execute(
      dst,
      act.type,
      act.gas,
      act.value,
      act.data,
      allSigs,
      {value: callValue}
    );
}

async function testExecCall(
  msig: ethers.Contract,
  targ: ethers.Contract,
  usrs: ethers.Wallet[],
  domSep: string,
  nonce: ethers.BigNumberish,
  act: Action,
  callValue: ethers.BigNumberish,
) {
  const provider = msig.provider;

  const targNonce0 = await targ.count();
  const targBal0 = await provider.getBalance(targ.address);
  const msigBal0 = await provider.getBalance(msig.address);

  // execute
  await doExec(
    msig,
    targ.address,
    usrs,
    domSep,
    nonce,
    act,
    callValue
  );

  // check resulting state
  expect(await msig.nonce()).to.eq(ethers.BigNumber.from(nonce).add(1));

  // get log of call from target
  const filter = targ.filters.Call();
  const rawLog = (await targ.queryFilter(filter, 'latest'))[0];
  const log = targ.interface.parseLog(rawLog).args;

  // check logged call
  expect(log.callType).to.eq(act.type);
  expect(log.data).to.eq(act.data);

  expect(log.src).to.eq(msig.address);
  expect(log.val).to.eq(act.value);
  expect(await provider.getBalance(targ.address))
    .to.eq(targBal0.add(act.value));
}

async function testExecDCall(
  msig: ethers.Contract,
  targ: ethers.Contract,
  usrs: ethers.Wallet[],
  domSep: string,
  nonce: ethers.BigNumberish,
  act: Action,
  callValue: ethers.BigNumberish,
) {
  const provider = msig.provider;

  const msigBal0 = await provider.getBalance(msig.address);

  // execute
  await doExec(
    msig,
    targ.address,
    usrs,
    domSep,
    nonce,
    act,
    callValue
  );

  // check resulting state
  expect(await msig.nonce()).to.eq(ethers.BigNumber.from(nonce).add(1));

  // get log of call from target
  const filter = targ.filters.Call();
  const rawLog = (await msig.queryFilter(filter, 'latest'))[0];
  const log = targ.interface.parseLog(rawLog).args;

  expect(log.callType).to.eq(act.type);
  expect(log.data).to.eq(act.data);

  expect(log.src).to.eq(await msig.signer.getAddress());
  expect(log.val).to.eq(callValue);
  expect(await provider.getBalance(msig.address))
    .to.eq(msigBal0.add(callValue));
}

export {
  testExecCall,
  testExecDCall
}
