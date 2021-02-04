import brownie
import eth_abi

from eth_abi import encode_abi, decode_single
from eth_account.messages import encode_structured_data
from eth_account._utils.signing import sign_message_hash
from brownie.convert import to_address as checksum
from brownie.convert.datatypes import HexString
from brownie.network.event import eth_event, EventDict

from utils.types import MinisigImmutables
import utils.constants as C

web3 = brownie.network.web3

def derive_accts(mnemonic, n):
    return [ web3.eth.account.from_mnemonic(C.MNEMONIC, f"m/44'/60'/0'/0/{i}") for i in range(n) ]

def encode_dom_sep(inst):
    chain_id = brownie.network.chain.id
    preimg = encode_abi(
        [ 'bytes32', 'uint256', 'uint256', 'address' ],
        [
            bytes.fromhex(C.DOMAIN_SEPARATOR_TYPEHASH[2:]),
            chain_id,
            inst.tx.block_number,
            inst.address
        ]
    )
    return web3.keccak(preimg).hex()

def encode_digest(inst, nonce, action):
    dom_sep = encode_dom_sep(inst)
    hash_data = web3.solidityKeccak(['bytes'], [action.data])
    struct_preimg = encode_abi(
        [
            'bytes32',
            'address',
            'address',
            'uint8',
            'uint256',
            'uint256',
            'uint256',
            'bytes32'
        ],
        [
            bytes.fromhex(C.EXECUTE_TYPEHASH[2:]),
            action.source,
            action.target,
            action.type,
            nonce,
            action.gas,
            action.value,
            hash_data
        ]
    )
    hash_struct = web3.keccak(struct_preimg)
    digest = web3.solidityKeccak(
        [ 'bytes1', 'bytes1', 'bytes32', 'bytes32' ],
        [ '0x19', '0x01', dom_sep, hash_struct ]
    )
    return digest

def allSign(usrs, digest):
    sigs = [ bytes(u.signHash(digest).signature).hex() for u in usrs ]
    return ''.join(sigs)

def signAndExecute(inst, usrs, action, opts={}):
    nonce = inst.nonce()
    digest = encode_digest(
        inst,
        nonce,
        action
    )
    sigs = allSign(usrs, digest)
    return inst.execute(
        action.source,
        action.target,
        action.type,
        action.gas,
        action.value,
        action.data,
        sigs,
        opts
    )

def signAndEncodeCalldata(inst, usrs, action):
    nonce = inst.nonce()
    digest = encode_digest(inst, nonce, action)
    sigs = allSign(usrs, digest)
    return inst.execute.encode_input(
        action.source,
        action.target,
        action.type,
        action.gas,
        action.value,
        action.data,
        sigs
    )

def last_call_log(logs, abi):
    decoded = eth_event.decode_logs(logs, eth_event.get_topic_map(abi))
    events = EventDict(decoded)
    call = events[-1]
    return call

def write_hevm_debug(msig, usrs, action):
    calldata = signAndEncodeCalldata(msig, usrs, action)
    bytecode = bytes.hex(web3.eth.getCode(msig.address))
    with open('./hevm/calldata.bin', 'w') as f:
        f.write(calldata[2:])
    with open('./hevm/bytecode.bin', 'w') as f:
        f.write(bytecode)
