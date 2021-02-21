import pytest
import brownie

from brownie.convert.datatypes import HexString

import utils.utils as utils
import utils.constants as C

web3 = brownie.web3

def test_success(msig, usr_ids):
    assert msig.nonce() == 0
    assert msig.getThreshold() == C.THRESHOLD
    assert msig.getDOMAIN_SEPARATOR() == utils.encode_dom_sep(msig)
    assert msig.getAllSigners() == usr_ids

def test_deploy_with_value(Minisig, deployer, usr_ids):
    value = 100
    inst = Minisig.deploy(C.THRESHOLD, usr_ids, {'from': deployer, 'value': value})
    assert inst.balance() == value

def test_fail_zero_head(Minisig, deployer, usr_ids):
    bad_usr_ids = usr_ids.copy()
    bad_usr_ids.insert(0, C.ZERO_ADDRESS)
    with brownie.reverts():
        Minisig.deploy(C.THRESHOLD, bad_usr_ids, {'from': deployer})

def test_fail_unordered_signers(Minisig, deployer, usr_ids):
    bad_usr_ids = usr_ids.copy()
    bad_usr_ids[0], bad_usr_ids[1] = bad_usr_ids[1], bad_usr_ids[0]
    with brownie.reverts():
        Minisig.deploy(C.THRESHOLD, bad_usr_ids, {'from': deployer})

def test_fail_insufficient_signers(Minisig, deployer, usr_ids):
    with brownie.reverts():
        Minisig.deploy(len(usr_ids) + 1, usr_ids, {'from': deployer})
