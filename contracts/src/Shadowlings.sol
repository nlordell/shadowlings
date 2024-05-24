// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import {SIG_VALIDATION_SUCCESS, SIG_VALIDATION_FAILED} from "account-abstraction/core/Helpers.sol";
import {IAccount, PackedUserOperation} from "account-abstraction/interfaces/IAccount.sol";

import {Verifier} from "./Verifier.sol";

contract Shadowlings is IAccount, Verifier {
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(uint256 chainId,address verifyingContract)");
    bytes32 public constant TRANSFER_TYPEHASH = keccak256("Transfer(address token,address to,uint256 amount)");

    bytes public constant SIGNATURE =
        hex"0174a52317b658076e35432533edc88c2f86823e2fcfd2b56f8fad46fb32d6a51718811e130eeacc4232614ef16382b62d0d6e04eadf9fb575647e9cca12f0147f";

    address public immutable ENTRY_POINT;

    mapping(bytes32 => bool) public nullified;

    error UnsupportedEntryPoint();
    error UnsupportedCall();
    error OnlyWithoutPrefund();
    error Nullified();
    error InvalidProof();

    constructor(address entryPoint) {
        ENTRY_POINT = entryPoint;
    }

    modifier onlyEntryPoint() {
        if (msg.sender != ENTRY_POINT) {
            revert UnsupportedEntryPoint();
        }
        _;
    }

    modifier onlySupportedCall(PackedUserOperation calldata userOp) {
        if (bytes4(userOp.callData[:4]) != this.execute.selector) {
            revert UnsupportedCall();
        }
        _;
    }

    modifier onlyWithoutPrefund(uint256 missingAccountFunds) {
        if (missingAccountFunds != 0) {
            revert OnlyWithoutPrefund();
        }
        _;
    }

    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external
        onlyEntryPoint
        onlySupportedCall(userOp)
        onlyWithoutPrefund(missingAccountFunds)
        returns (uint256 validationData)
    {
        (bytes32 commit) = abi.decode(userOp.callData[4:], (bytes32));
        (bytes32 nullifier, Proof memory proof) = abi.decode(userOp.signature, (bytes32, Proof));

        if (verifyProof(commit, nullifier, userOpHash, proof)) {
            validationData = SIG_VALIDATION_SUCCESS;
        } else {
            validationData = SIG_VALIDATION_FAILED;
        }
    }

    function execute(bytes32 commit, address token, address to, uint256 amount)
        public
        onlyEntryPoint
        returns (bool success)
    {
        address authority = getShadowling(commit);
        bytes memory authData = abi.encodePacked(SIGNATURE, commit);
        assembly ("memory-safe") {
            pop(auth(commit, add(authData, 0x20), mload(authData)))
        }

        if (token == address(0)) {
            assembly ("memory-safe") {
                success := authcall(gas(), to, amount, 0, 0, 0, 0)
            }
        } else {
            bytes memory callData = abi.encodeWithSignature("transfer(address,uint256)", to, amount);
            assembly ("memory-safe") {
                success := authcall(gas(), token, 0, add(callData, 0x20), mload(callData), 0, 0)
            }
        }

        if (!success) {
            assembly ("memory-safe") {
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, returndatasize())
                return(ptr, returndatasize())
            }
        }
    }

    function executeWithProof(
        bytes32 commit,
        bytes32 nullifier,
        address token,
        address to,
        uint256 amount,
        uint256 nonce,
        Proof memory proof
    ) external returns (bool success) {
        if (nullified[nullifier]) {
            revert Nullified();
        }
        nullified[nullifier] = true;

        bytes32 transferHash = getTransferHash(token, to, amount, nonce);
        if (!verifyProof(commit, nullifier, transferHash, proof)) {
            revert InvalidProof();
        }

        success = execute(commit, token, to, amount);
    }

    function domainSeparator() public view returns (bytes32 hash) {
        hash = keccak256(abi.encode(DOMAIN_TYPEHASH, block.chainid, this));
    }

    function getTransferHash(address token, address to, uint256 amount, uint256 nonce)
        public
        view
        returns (bytes32 hash)
    {
        hash = keccak256(
            abi.encodePacked(
                bytes2(0x1901), domainSeparator(), keccak256(abi.encode(TRANSFER_TYPEHASH, token, to, amount, nonce))
            )
        );
    }

    function getShadowling(bytes32 commit) public view returns (address authority) {
        bytes memory signature = SIGNATURE;

        uint8 v;
        bytes32 r;
        bytes32 s;
        assembly ("memory-safe") {
            v := and(add(mload(add(signature, 0x01)), 27), 0xff)
            r := mload(add(signature, 0x21))
            s := mload(add(signature, 0x41))
        }

        bytes32 authMessage =
            keccak256(abi.encodePacked(uint8(0x04), block.chainid, uint256(0), uint256(uint160(address(this))), commit));

        authority = ecrecover(authMessage, v, r, s);
    }

    function verifyProof(bytes32 commit, bytes32 nullifier, bytes32 transferHash, Proof memory proof)
        public
        view
        returns (bool success)
    {
        uint256[] memory input = new uint256[](3);
        input[0] = uint256(commit);
        input[1] = uint256(nullifier);
        input[2] = uint256(transferHash);

        success = verify(input, proof) == 0;
    }
}