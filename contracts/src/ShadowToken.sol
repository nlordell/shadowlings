// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ShadowToken is ERC20 {
    constructor() ERC20("Shadow Token", "SHDW") {}

    function mint(address to, uint256 amount) external returns (bool success) {
        require(amount < 100 ether);
        _mint(to, amount);
    }
}
