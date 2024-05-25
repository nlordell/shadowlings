// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.13;

import {PackedUserOperation, UserOperationLib} from "account-abstraction/core/UserOperationLib.sol";
import {Test, console} from "forge-std/Test.sol";

import {Shadowlings} from "../src/Shadowlings.sol";
import {Pairing} from "../src/Verifier.sol";

contract ShadowlingsTest is Test {
    address entryPoint = vm.addr(uint256(keccak256("secret")));
    Shadowlings shadowlings = new Shadowlings(entryPoint);

    function setUp() public {}

    function test_Execute() public {
        uint256 commit = uint256(uint248(uint256(keccak256("commit"))));
        address token = address(0);
        address to = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045;
        uint256 amount = 1 ether;

        address shadowling = shadowlings.getShadowling(commit);
        vm.deal(shadowling, amount);

        assertEq(to.balance, 0);
        assertEq(shadowling.balance, 1 ether);

        vm.prank(entryPoint);
        shadowlings.execute(commit, token, to, amount);

        assertEq(to.balance, 1 ether);
        assertEq(shadowling.balance, 0);
    }

    function test_UserOperation() public {
        uint256 commit = uint256(uint248(uint256(keccak256("commit"))));
        address token = address(0);
        address to = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045;
        uint256 amount = 1 ether;

        bytes memory callData = abi.encodeCall(shadowlings.execute, (commit, token, to, amount));

        // intentionally invalid.
        Shadowlings.Proof memory proof;
        bytes32 nullifier = bytes32(0);

        bytes memory signature = abi.encode(nullifier, proof);

        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(shadowlings),
            nonce: 0,
            initCode: "",
            callData: callData,
            accountGasLimits: 0,
            preVerificationGas: 0,
            gasFees: 0,
            paymasterAndData: "",
            signature: signature
        });
        bytes32 userOpHash = this.hashUserOp(userOp);

        address shadowling = shadowlings.getShadowling(commit);
        vm.deal(shadowling, amount);

        assertEq(to.balance, 0);
        assertEq(shadowling.balance, 1 ether);

        vm.startPrank(entryPoint);
        // proof is known to be invalid!
        require(shadowlings.validateUserOp(userOp, userOpHash, 0) == 1);
        shadowlings.execute(commit, token, to, amount);

        assertEq(to.balance, 1 ether);
        assertEq(shadowling.balance, 0);
    }

    function test_VerifyProof() public {
        uint256 commit = 0x153c333c4856f04f11c983484a8fbcd2705b4460498f55b4771cd09af3c306ab;
        uint256 nullifier = 0x05476bcdcaba1d11916a4f3618d499f9b6c53506cb825926f25ea37e0627cc0d;
        bytes32 executionHash = 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;

        Shadowlings.Proof memory proof;
        proof.a = Pairing.G1Point(
            0x157d71d26866fa47011e546ba75662a5c1b970c4d04955257e79a75afcfffb8c,
            0x02fad2fa9c9497cddbe199f036a41bb190b4ec18730937b649403b363ced57c1
        );
        proof.b = Pairing.G2Point(
            [
                0x071ffd7bff7d6398b7b3a85fd6373f7eaf17a708e658093fc01debe33ed6c52a,
                0x0215bcb8cbdb03ce14087779f4ab6b88e68069840d9af39c7f3e3fe44d101475
            ],
            [
                0x0bd9d6e2ff65aa7c370aa0fed1be3a4e401e7d48c54cfaea71611904ff941c7f,
                0x18f5bfe53c42838adff267abdbe56dbb9e60f7a08a0dffe6d2506544dd04d4bc
            ]
        );
        proof.c = Pairing.G1Point(
            0x09bc3e2213f740bcdf4a3a4d9daca2acb4ebac5d610e056e233d94bff4c87f7e,
            0x1f6f09d484887497cbea24c0bb5ae662905596690c31fbcf0a3793cf2f601f04
        );

        bool success = shadowlings.verifyProof(commit, nullifier, executionHash, proof);

        assertTrue(success);
    }

    function hashUserOp(PackedUserOperation calldata userOp) external pure returns (bytes32 hash) {
        hash = UserOperationLib.hash(userOp);
    }
}
