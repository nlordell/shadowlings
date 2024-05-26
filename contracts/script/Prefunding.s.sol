// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.13;

import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {Script, console} from "forge-std/Script.sol";

import {Shadowlings} from "../src/Shadowlings.sol";

contract Prefunding is Script {
    function run() external {
        vm.sleep(15000);

        vm.startBroadcast();

        address entryPoint = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
        address shadowlings = 0x7bD5Fe83Aa81AD5d8992f25bb935c43507929fb2;

        (bool success,) = entryPoint.call{value: 1 ether}(abi.encodeWithSignature("depositTo(address)", shadowlings));
        success;

        vm.stopBroadcast();
    }
}
