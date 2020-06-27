pragma solidity ^0.6.0;

import "../Minisig.sol";

contract Target {
    bytes32 public reserve1;
    bytes32 public slot2 = checkBytes;
    uint256 public nonce;
    bytes32 constant checkBytes = keccak256("target");

    event Call(
        uint256 indexed nonce,
        Minisig.CallType callType,
        address src,
        uint256 val,
        bytes data
    );

    modifier logs() { _log; _; }

    receive() external payable logs {}
    fallback () external payable logs {}

    function store(uint256 key, uint256 val) external logs {
        assembly { sstore(key, val) }
    }

    function _log() internal {
        Minisig.CallType ctype;
        if (slot2 == checkBytes) { ctype = Minisig.CallType.Call; }
        else { ctype = Minisig.CallType.DelegateCall; }
        emit Call(nonce, ctype, msg.sender, msg.value, msg.data);
        nonce++;
    }
}
