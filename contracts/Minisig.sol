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
    address[] internal signers; // approved signers, immutable in huff impl.

    // --- Immutables and constants ---
    uint8 public immutable threshold;   // minimum required signers

    // EIP712 stuff
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 internal constant DOMAIN_SEPARATOR_TYPEHASH = keccak256("EIP712Domain(uint256 chainId,uint256 deployBlock,address verifyingContract)");
    bytes32 internal constant EXECUTE_TYPEHASH = keccak256("Execute(uint8 callType,uint256 nonce,uint256 value,address target,bytes data)");

    // --- Fallback function ---
    receive () external payable {} // recieve ether only if calldata is empty

    // --- Constructor ---
    constructor(uint8 _threshold, address[] memory _signers) public {
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

    function execute(
        CallType _callType,
        uint256 _value,
        address _target,
        bytes calldata _data,
        bytes calldata _sigs
    )
        external
        payable
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
                _callType,
                origNonce,
                _value,
                _target,
                keccak256(_data)
            ))
        ));

        // check signature validity
        // Note: a single invalid sig will cause a revert, even if there are
        // `>= threshold` valid sigs. But, an invalid sig after `threshold`
        // valid sigs is ignored
        uint256 sigIdx = 0;
        uint256 signerIdx = 0;
        for (uint256 i = 0; i < threshold; i++) {
            // sig should be 65 bytes total, {32 byte r}{32 byte s}{1 byte v}
            uint8 v = uint8(_sigs[sigIdx+64]);
            bytes32 r = abi.decode(_sigs[sigIdx:sigIdx+32], (bytes32));
            bytes32 s = abi.decode(_sigs[sigIdx+32:sigIdx+64], (bytes32));
            address addr = ecrecover(digest, v, r, s);
            sigIdx += 65;

            // TODO lol
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
            elem = false;
        }

        // make call dependent on callType
        bool success;
        if (_callType == CallType.Call) {
            (success,) = _target.call{value: _value}(_data);
        }
        if (_callType == CallType.DelegateCall) {
            // TODO: prevent delegatecall value confusion?
            // require(_value == 0 || _value == msg.value)
            (success,) = _target.delegatecall(_data);
        }

        // check call succeeded and nonce unchanged
        require(success, "call-failure");
        require(nonce == newNonce, "nonce-changed");
    }

    // return signers array
    function allSigners() external view returns (address[] memory) {
        return signers;
    }

    //td remove
    function encode(
        CallType _callType,
        uint256 _value,
        address _target,
        bytes calldata _data
    )
        external view returns (bytes32)
    {
        return keccak256(abi.encodePacked(
            // byte(0x19), byte(0x01)
            "\x19\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                EXECUTE_TYPEHASH,
                _callType,
                nonce,
                _value,
                _target,
                keccak256(_data)
            ))
        ));
    }
}
