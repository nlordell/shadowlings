// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";

import {ShadowToken} from "../src/ShadowToken.sol";
import {Shadowlings} from "../src/Shadowlings.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        bytes32 salt = bytes32(uint256(0x5afe));
        address entryPoint = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

        Shadowlings shadowlings = new Shadowlings{salt: salt}(entryPoint);
        console.log(address(shadowlings));

        ShadowToken token = new ShadowToken{salt: salt}();
        console.log(address(token));

        vm.stopBroadcast();
    }
}
