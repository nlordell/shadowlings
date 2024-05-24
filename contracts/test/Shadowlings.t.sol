// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";

import {Shadowlings} from "../src/Shadowlings.sol";

contract ShadowlingsTest is Test {
    address entryPoint = vm.addr(uint256(keccak256("secret")));
    Shadowlings shadowlings = new Shadowlings(entryPoint);

    function setUp() public {}

    function test_Execute() public {
        bytes32 commit = keccak256("commit");
        address token = address(0);
        address to = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045;
        uint256 amount = 1 ether;

        address shadowling = shadowlings.getShadowling(commit);
        vm.deal(shadowling, amount);

        assertEq(to.balance, 0);
        assertEq(shadowling, 0xec31Bf31FaA8688FD52a85bbc2f7f4c69A876001);
        assertEq(shadowling.balance, 1 ether);

        vm.prank(entryPoint);
        shadowlings.execute(commit, token, to, amount);

        assertEq(to.balance, 1 ether);
        assertEq(shadowling, 0xec31Bf31FaA8688FD52a85bbc2f7f4c69A876001);
        assertEq(shadowling.balance, 0);
    }
}
