import { ethers } from "ethers";

import { Action } from "./types";
import C from "./constants";

const coder = ethers.utils.defaultAbiCoder;

// from wighawag/buidler-ethers-v5
function fixProvider(provider: any): any {
  // alow it to be used by ethers without any change
  if (provider.sendAsync === undefined) {
    provider.sendAsync = (
      req: {
        id: number;
        jsonrpc: string;
        method: string;
        params: any[];
      },
      callback: (error: any, result: any) => void
    ) => {
      provider
        .send(req.method, req.params)
        .then((result: any) =>
          callback(null, { result, id: req.id, jsonrpc: req.jsonrpc })
        )
        .catch((error: any) => callback(error, null));
    };
  }
  return provider;
}

function getFactory(signer: ethers.Signer, artifact: any) {
  return new ethers.ContractFactory(
    new ethers.utils.Interface(artifact.abi),
    artifact.bytecode,
    signer
  );
}

// todo: restrict types
function encodeExecDigest(
  domSep: string,   // bytes32
  nonce: ethers.BigNumberish,
  target: string,   // address
  act: Action,
) {
  const hashData = ethers.utils.solidityKeccak256(['bytes'], [act.data]);
  const hashStruct = ethers.utils.keccak256(
    coder.encode(
      ['bytes32', 'address', 'uint8', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [C.msig.EXEC_TYPEHASH, target, act.type, nonce, act.gas, act.value, hashData]
    )
  );
  const preImg = ethers.utils.solidityPack(
    ['uint8', 'uint8', 'bytes32', 'bytes32'],
    ['0x19', '0x01', domSep, hashStruct]
  );
  return ethers.utils.keccak256(preImg);
}

function encodeDomSep(
  chainId: number,
  block: number,
  addr: string
) {
  const preImg = coder.encode(
    ['bytes32', 'uint256', 'uint256', 'address'],
    [C.msig.DOMSEP_TYPEHASH, chainId, block, addr]
  );
  return ethers.utils.keccak256(preImg);
}

function allSign(wallets: ethers.Wallet[], digest: string) {
  const keys = wallets.map(wallet => (
    new ethers.utils.SigningKey(wallet.privateKey)
  ));
  const sigs = keys.map(key => (
    ethers.utils.joinSignature(key.signDigest(digest))
  ));
  return ethers.utils.hexlify(ethers.utils.concat(sigs));
}

function randBytes(len: number) {
  return `0x${  Buffer.from(ethers.utils.randomBytes(len)).toString("hex")}`;
}

export default {
  fixProvider,
  getFactory,
  encodeDomSep,
  encodeExecDigest,
  allSign,
  randBytes
}
