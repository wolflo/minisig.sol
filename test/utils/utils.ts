import { ethers } from "ethers";
import C from "./constants";

const coder = ethers.utils.defaultAbiCoder;

function getFactory(signer: ethers.Signer, artifact: any) {
  return new ethers.ContractFactory(
    new ethers.utils.Interface(artifact.abi),
    artifact.bytecode,
    signer
  );
}

// todo: restrict types
function encodeExecuteDigest(
  domSep: string,   // bytes32
  callType: number, // number
  nonce: ethers.BigNumberish,
  value: ethers.BigNumberish,
  target: string,   // address
  data: string      // hex string
) {
  const hashData = ethers.utils.solidityKeccak256(['bytes'], [data]);
  const hashStruct = ethers.utils.keccak256(
    coder.encode(
      ['bytes32', 'uint8', 'uint256', 'uint256', 'address', 'bytes32'],
      [C.msig.EXECUTE_TYPEHASH, callType, nonce, value, target, hashData]
    )
  );
  const preImg = ethers.utils.solidityPack(
    ['uint8', 'uint8', 'bytes32', 'bytes32'],
    ['0x19', '0x01', domSep, hashStruct]
  );
  return ethers.utils.keccak256(preImg);
}

function encodeDomainSeparator(
  chainId: number,
  block: number,
  addr: string
) {
  const preImg = coder.encode(
    ['bytes32', 'uint256', 'uint256', 'address'],
    [C.msig.DOMAIN_SEPARATOR_TYPEHASH, chainId, block, addr]
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
  getFactory,
  encodeDomainSeparator,
  encodeExecuteDigest,
  allSign,
  randBytes
}
