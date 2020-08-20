pragma solidity ^0.6.0;

import "../Minisig.sol";

contract Target {

    bytes32 internal constant checkBytes = keccak256("target");

    bytes32 public reserve1;
    bytes32 public slot2 = checkBytes;
    uint256 public count;

    event Call(
        uint256 indexed count,
        Minisig.CallType callType,
        address src,
        uint256 val,
        bytes data
    );

    modifier logs() { _log(); _; }

    receive() external payable logs {}
    fallback () external payable logs {}

    function store(uint256 key, uint256 val) external logs {
        assembly { sstore(key, val) }
    }

    function _log() internal {
        Minisig.CallType ctype;
        if (slot2 == checkBytes) { ctype = Minisig.CallType.Call; }
        else { ctype = Minisig.CallType.DelegateCall; }
        emit Call(count, ctype, msg.sender, msg.value, msg.data);
        count++;
    }
}
