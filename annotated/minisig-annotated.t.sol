pragma solidity ^0.6.0;

import "ds-test/test.sol";

import "./Minisig.sol";

contract MinisigTest is DSTest {
    function setUp() public {}

    function testExecute() public {
        uint8 threshold = 2;
        address[] memory signers = new address[](3);
        signers[0] = 0x1eEE1d40A057D50C84a7bD5632e553eDf4beb93b;
        signers[1] = 0x70BBEd4c4D037e89E1e606997C0E5671f7c38D7f;
        signers[2] = 0x9b410c059f3b0E0B45A747a34D4Bf5431c282921;

        Minisig msig = new Minisig(threshold, signers);
        // domSep = '0x6edd5fb8f80f6e3e748e6da8ed3048cd085077429aa0a80a7994c1b59363470f';

        address target = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;
        Minisig.CallType ctype = Minisig.CallType.Call;
        uint256 gas = 100000;
        uint256 val = 1 ether;
        bytes memory data = hex'abababababababababababababababababababababababababababababababababababababababab';
        // 0x083a52516903417ccb61d57ab9ebd8c24fa196f2891d130a803acc3f22ced4516edc945456d277a4e6eaf33fde4d9bd7b117f793eb6687b4355344e57ec0334c1b,
        // 0x9309f9feb508f97d7d3b81e7c20ef803da67d1add646d6521e17bcef6fd986ba4bdda2dc8046a8c31df091bace7de1631f771d851e10a18648562ca5a9ed4bd51c,
        // 0xd24dd44289025ead0fcf7f77f1366f3676e7cc8a76abd62496e151b564dd85f8017ea0f71ac0ede9ac72089727fe4b1cf8bd560370ab011adade19ced65908821b ]
        bytes memory sigs = hex'083a52516903417ccb61d57ab9ebd8c24fa196f2891d130a803acc3f22ced4516edc945456d277a4e6eaf33fde4d9bd7b117f793eb6687b4355344e57ec0334c1b9309f9feb508f97d7d3b81e7c20ef803da67d1add646d6521e17bcef6fd986ba4bdda2dc8046a8c31df091bace7de1631f771d851e10a18648562ca5a9ed4bd51cd24dd44289025ead0fcf7f77f1366f3676e7cc8a76abd62496e151b564dd85f8017ea0f71ac0ede9ac72089727fe4b1cf8bd560370ab011adade19ced65908821b';

        msig.execute{value: 1 ether}(target, ctype, gas, val, data, sigs);
    }

}
