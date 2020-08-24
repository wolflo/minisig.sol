pragma solidity 0.6.6;

// The point of this contract is to provide an executable solidity reference
// implementation that will approximate the huff implementation. The result
// is exceptionally bad solidity, and this should not be used except for
// comparison with huff impl. It will also not match the huff particularly
// well, because the huff uses an approach that can't be built in solidity.
contract Minisig {

    // --- Data structures ---
    enum CallType {
        Call,
        DelegateCall
    }

    // --- State ---
    uint256 public nonce;

    // --- Immutables and constants ---
    address[] internal signers; // approved signers, immutable in huff impl.
    uint8 public immutable threshold;   // minimum required signers

    // EIP712 stuff
    bytes32 public immutable DOMAIN_SEPARATOR;
    // keccak256("EIP712Domain(uint256 chainId,uint256 deployBlock,address verifyingContract)");
    bytes32 internal constant DOMAIN_SEPARATOR_TYPEHASH = 0x0a684fcd4736a0673611bfe1e61ceb93fb09bcd288bc72c1155ebe13280ffeca;
    // keccak256("Execute(address target,uint8 callType,uint256 nonce,uint256 txGas,uint256 value,bytes data)");
    bytes32 internal constant EXECUTE_TYPEHASH = 0x9c1370cbf5462da152553d1b9556f96a7eb4dfe28fbe07e763227834d409103a;

    // --- Fallback function ---
    receive () external payable {} // recieve ether only if calldata is empty

    // --- Constructor ---
    constructor(uint8 _threshold, address[] memory _signers) public payable {
        require(_signers.length >= _threshold, "signers-invalid-length");

        // set domain separator for EIP712 signatures
        uint256 chainId;
        assembly { chainId := chainid() }
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            DOMAIN_SEPARATOR_TYPEHASH,
            chainId,
            block.number,
            address(this)
        ));

        // signers must be ascending order, and cannot be 0
        address prevSigner;
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] > prevSigner, "invalid-signer");
            prevSigner = _signers[i];
        }

        // set threshold and valid signers
        threshold = _threshold;
        signers = _signers;
    }

    /*
    Key vals:
    - 0x25a (602) = ?
    - 0x224 (548) = calldatasize
    - 0xc0  (192) = 32 bytes * 6 args, also offset to _data len
    - 0x120 (288) = offset to _sigs len
    - 0x28  (40)  = len(_data)
    - 0xc3  (195) = len(_sigs)
    - 0x82  (130) = 2 * 65 (threshold * len of a sig)
    - 0x6edd5fb8f80f6e3e748e6da8ed3048cd085077429aa0a80a7994c1b59363470f = domSep
    - 0x9c1370cbf5462da152553d1b9556f96a7eb4dfe28fbe07e763227834d409103a = exec typehash
    1. dispatcher
    2. check !(calldatasize - 4 < 192)
    3. calldataload _target and mask address
    4. calldataload _callType and mask uint8 -- should we check if 0 or 1 specifically?
    5. calldataload _txGas
    6. calldataload _value
    7. calldataload _data_ost
        - check !(_data_ost > 0x100000000)
        - check !(_data_ost + 4 + 32 > calldatasize)
    8. calldataload len(_data)
        - check !(_data_ost + 4 + 32 + len(_data)*1 > calldatasize || len(_data) > 0x100000000)
-------- 0x1f5
    9. calldataload _sigs_ost
        - check !(_sigs_ost > 0x100000000)
        - check !(_sigs_ost + 4 + 32 > calldatasize)
-------- 0x228
    10. calldataload len(_sigs) -- 0xc3
        - check !(_sigs_ost + 4 + 32 + len(_sigs)*1 > calldatasize || len(_sigs) > 0x100000000)
-------- 0x24a
-------- swaps and pops a bunch, then jumps to 0x350
    11. 0x355 pushes what may be the threshold onto the stack, then multiplies it by 65 (after uint8 masking it lol)
        - check !(len(_sigs) < threshold * 65
-------- jumps to 0x3f1
    12. sload nonce from slot 0
    13. sstore nonce + 1 to slot 0
-------- 0x406
    14. push domain separator and execute typehash (then shl the exec typehash by 0, bc why not)
        - stack at 0x458 (guess based on values):
        [ free_mem_ptr, len(_data), _data_ost+4+32, _value, _txGas, _callType?,
          nonce?, target, exec_typehash, domSep ]
    15. hash _data
        - copy _data w/o len or padding to mem -- calldatacopy(free_mem_ptr, _data_ost+4+32, len(_data))
        - sha3(ptr, len(_data))
        - 80270202348959009926229887598690632564689311952133868757846825114064811156193
          (0xb1775312b2633a4a45fe7eeca3bc95f5c3fd760a80564c97329f9e5bb3d762e1)
-------- 0x472
    16. keccak256(abi.encode(EXEC_THASH, _target, _ctype, nonce, _txGas, _value, keccak(_data)))
        - mstore(free_mem_ptr+32, exec_typehash)
        - mstore(ptr_to_exec_thash+32, _target) (after masking target twice, just to be sure)
        - check !(_callType > 1) -- hits invalid op if so, checking for enum overflow
        - mask _callType
        - mstore(ptr_to_target+32, _callType)
        - mstore(ptr_to_ctype+32, original_nonce)
        - mstore(ptr_to_nonce+32, _txGas)
        - mstore(ptr_to_txGas+32, _value)
        - mstore(ptr_to_value+32, keccak(_data))
        - mstore(free_mem_ptr, 0xe0)
            - 0xe0 = len_data_to_hash = end_of_data_to_hash - free_mem_ptr - 32
            - free_mem_ptr is also the word right before the start of the data to hash
        - store new free_mem_ptr -- mstore(0x40, 0x180) where 0x180 is end_of_data_to_hash
        - mload len_data_to_hash from old free_mem_ptr
-------- 0x4f7
        - sha3(start_of_data_to_hash, len_data_to_hash)
        - sha3(0xa0, 0xe0)
        - 52338643092673742869439231165330154939021212843735210262070227489406434979142
        - 0x73b69f48c7a06db62993a022933c4618f952870bda057d9cb60bde4f73d0ad46
-------- 0x4fc
    17. keccak256(abi.encodePacked("\x19\x01", DOM_SEP, struct_hash)
        - mstore(
            free_mem_ptr + 32
            0x1901000000000000000000000000000000000000000000000000000000000000,
          )
        - mstore(free_mem_ptr+32+2, domSep) -- mstore domsep immediately after separator bytes
        - mstore(ptr_to_domsep+32, struct_hash)
        - mstore(free_mem_ptr, len_data_to_hash)
            - mstore(0x180, 0x42)
            - len_data_to_hash = end_of_data_to_hash - free_mem_ptr - 32 = 66 bytes
        - mstore new mem ptr -- mstore(0x40, 0x1e2)
        - mload len_data_to_hash from old free_mem_ptr
        - sha3(start_of_data_to_hash, len_data_to_hash)
        - sha3(0x1a0, 0x42)
            - 93845864599993429841562554618472796251025162734423712218336403257576261726994
            - 0xcf7ae085e8a38f9af9a9a35e8e58af1ed24fa50d7572b3b98222527ef190b312
^ signed digest
-------- 0x551
-------- 0x562 jumpdest -- start of signature validation loop
    18. push and mask threshold?
        - check (thresh > counter?) -> if not, jump to 0x7bd
        64 < 195


notes:
    - solidity does not overwrite the data from generating the struct_hash when
      it generates the digest hash
    - solidity uses the word just before the data that's being hashed to pass
      the length of data to hash
    - the threshold seems to be pushed in at least 2 separate places
*/
    function execute(
        address _target,
        CallType _callType,
        uint256 _txGas,
        uint256 _value,
        bytes calldata _data,
        bytes calldata _sigs
    )
        external
        payable
        returns (bool)
    {
        // must submit enough signatures to satisfy threshold
        // max(uint8) * 65 << max(uint256), so no overflow check
        require(_sigs.length >= uint256(threshold) * 65, "sigs-invalid-length");

        // update nonce
        uint256 origNonce = nonce;
        uint256 newNonce = origNonce + 1;
        nonce = newNonce;

        // signed message hash
        bytes32 digest = keccak256(abi.encodePacked(
            // byte(0x19), byte(0x01)
            "\x19\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                EXECUTE_TYPEHASH,
                _target,
                _callType,
                origNonce,
                _txGas,
                _value,
                keccak256(_data)
            ))
        ));

        // check signature validity
        // Note: a single invalid sig will cause a revert, even if there are
        // `>= threshold` valid sigs. But, an invalid sig after `threshold`
        // valid sigs is ignored
        uint256 signerIdx = 0;
        for (uint256 i = 0; i < threshold; i++) {
            // sig should be 65 bytes total, {32 byte r}{32 byte s}{1 byte v}
            uint256 sigIdx = 65 * i;
            bytes32 r = abi.decode(_sigs[ sigIdx : sigIdx + 32 ], (bytes32));
            bytes32 s = abi.decode(_sigs[ sigIdx + 32 : sigIdx + 64 ], (bytes32));
            uint8 v = uint8(_sigs[ sigIdx + 64 ]);
            address addr = ecrecover(digest, v, r, s);

            // for current signerIdx to end of signers, check each signer against
            // recovered address.
            // If we exhaust the list without a match, revert
            // if we find a match, signerIdx = match index, continue looping through sigs
            bool elem = false;
            for (uint256 j = signerIdx; j < signers.length && !elem; j++) {
                if (addr == signers[j]) {
                    elem = true;
                    signerIdx = j;
                    // break
                }
            }
            require(elem, "not-signer");
        }

        // make call dependent on callType
        bool success;
        if (_callType == CallType.Call) {
            (success,) = _target.call{value: _value, gas: _txGas}(_data);
        }
        else if (_callType == CallType.DelegateCall) {
            require(_value == msg.value, "delegatecall-wrong-signed-value");

            // existence check
            uint256 targetCodeSize;
            assembly { targetCodeSize := extcodesize(_target) }
            require(targetCodeSize > 0, "delegatecall-to-empty-code");

            (success,) = _target.delegatecall{gas: _txGas}(_data);

            // check nonce unchanged. Prevents delegatecall from overwriting
            // nonce slot.
            require(nonce == newNonce, "nonce-changed");
        }

        // check call succeeded
        require(success, "call-failure");

        return true;
    }

    // return signers array
    function allSigners() external view returns (address[] memory) {
        return signers;
    }

}
