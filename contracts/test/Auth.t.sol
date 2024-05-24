// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {AuthCall} from "../src/AuthCall.sol";

contract AuthTest is Test {
    AuthCall internal invoker = new AuthCall();

    function setUp() public {}

    function test_MultiAuthCall() public {
        uint256 accountKey = uint256(keccak256("secret"));
        address account = vm.addr(accountKey);

        bytes32 authDigest = keccak256(
            abi.encodePacked(
                uint8(0x04),
                block.chainid,
                uint256(vm.getNonce(account)),
                uint256(uint160(address(invoker))),
                invoker.COMMIT()
            )
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(accountKey, authDigest);
        bytes memory signature = abi.encodePacked(v - 27, r, s);

        bytes memory transactions = abi.encodePacked(
            abi.encodePacked(
                uint8(0),
                address(0),
                uint256(1 gwei), // value
                uint256(0), // data length
                "" // data
            ),
            abi.encodePacked(
                uint8(0),
                address(0),
                uint256(2 gwei), // value
                uint256(0), // data length
                "" // data
            )
        );

        vm.deal(account, 1 ether);
        assertEq(account.balance, 1 ether);

        invoker.multiAuthCall(account, signature, transactions);

        assertEq(account.balance, 1 ether - 3 gwei);
    }

    function test_MultiSendCompatibility() public {
        uint256 accountKey = uint256(keccak256("secret"));
        address account = vm.addr(accountKey);

        bytes32 authDigest = keccak256(
            abi.encodePacked(
                uint8(0x04),
                block.chainid,
                uint256(vm.getNonce(account)),
                uint256(uint160(address(invoker))),
                invoker.COMMIT()
            )
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(accountKey, authDigest);
        bytes memory signature = abi.encodePacked(v - 27, r, s);

        bytes memory transactions = abi.encodePacked(
            // auth encoded in transactions
            abi.encodePacked(
                uint8(0),
                account,
                uint256(0), // ignored
                signature.length,
                signature
            ),
            abi.encodePacked(
                uint8(0),
                address(0),
                uint256(1 gwei), // value
                uint256(0), // data length
                "" // data
            ),
            abi.encodePacked(
                uint8(0),
                address(0),
                uint256(2 gwei), // value
                uint256(0), // data length
                "" // data
            )
        );

        vm.deal(account, 1 ether);
        assertEq(account.balance, 1 ether);

        invoker.multiSend(transactions);

        assertEq(account.balance, 1 ether - 3 gwei);
    }

    function test_WithAppSignature() public {
        // Signature generated using the `app` interface.
        address account = 0x78a68eB0602C84B3f9AF32c9f24FFcd9D1306116;
        bytes memory signature = hex"005ad83ad58df47f613b45a293d2308f6845b2b0e6b3bb78ad1fed619494c7d5da51a1d273a417c889ea63930f5815cf48eb272b41dcaebefd7c3313d3295adba9";

        address safe = 0xDB24A6c30c016BdbBe17ab0709Af83992564879d;

        vm.setNonce(account, 0);
        vm.chainId(41144114);
        vm.deal(account, 1 ether);

        // Instead of deploying an actual Safe, just use a min proxy to the
        // AuthCall contract; this validates that we can `DELEGATECALL` into the
        // implementation that is actually doing the `AUTH`.
        vm.etch(safe, abi.encodePacked(
            hex"363d3d373d3d3d363d73",
            address(invoker),
            hex"5af43d82803e903d91602b57fd5bf3"
        ));

        bytes memory transactions = abi.encodePacked(
            // auth encoded in transactions
            abi.encodePacked(
                uint8(0),
                account,
                uint256(0), // ignored
                signature.length,
                signature
            ),
            abi.encodePacked(
                uint8(0),
                address(0),
                uint256(1 gwei), // value
                uint256(0), // data length
                "" // data
            ),
            abi.encodePacked(
                uint8(0),
                address(0),
                uint256(2 gwei), // value
                uint256(0), // data length
                "" // data
            )
        );

        assertEq(account.balance, 1 ether);

        AuthCall(safe).multiSend(transactions);

        assertEq(account.balance, 1 ether - 3 gwei);
    }
}
