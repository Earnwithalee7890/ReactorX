// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    uint8 private _decimals;
    uint256 public constant DAILY_CLAIM = 100 * 10**18; // 100 tokens
    mapping(address => uint256) public lastClaim;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, 10000000 * 10**decimals_); // Mint 10M to deployer
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    // Faucet function for users to claim test tokens
    function faucet() external {
        require(block.timestamp >= lastClaim[msg.sender] + 1 days, "MockToken: wait 24h between claims");
        lastClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, DAILY_CLAIM);
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
