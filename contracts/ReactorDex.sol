// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ReactorDex is ReentrancyGuard {
    // Basic Fixed-Price Router for Hackathon Demo Purposes
    // STT Native is base currency
    
    // prices in USD standard (18 decimals)
    mapping(address => uint256) public tokenPrices;
    uint256 public sttPrice = 2000 * 1e18; // Default STT price $2000
    
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "ReactorDex: not owner");
        _;
    }

    // Set oracle price for supported ERC20s (USDC, USDT, ETH)
    function setTokenPrice(address token, uint256 price) external onlyOwner {
        tokenPrices[token] = price;
    }
    
    // Set network active STT price
    function setSttPrice(uint256 price) external {
        // Let public simulate price drops to test
        sttPrice = price;
    }

    // Sell native STT, buy ERC20
    function swapSttForToken(address tokenOut) external payable nonReentrant {
        require(msg.value > 0, "No STT sent");
        require(tokenPrices[tokenOut] > 0, "Token not supported");
        
        uint256 sttValueInUsd = (msg.value * sttPrice) / 1e18;
        uint256 tokenOutAmount = (sttValueInUsd * 1e18) / tokenPrices[tokenOut];
        
        require(IERC20(tokenOut).balanceOf(address(this)) >= tokenOutAmount, "Dex: Not enough liquidity");
        IERC20(tokenOut).transfer(msg.sender, tokenOutAmount);
    }

    // Sell ERC20, buy native STT
    function swapTokenForStt(address tokenIn, uint256 amountIn) external nonReentrant {
        require(amountIn > 0, "Zero amount");
        require(tokenPrices[tokenIn] > 0, "Token not supported");
        
        uint256 tokenValueInUsd = (amountIn * tokenPrices[tokenIn]) / 1e18;
        uint256 sttOutAmount = (tokenValueInUsd * 1e18) / sttPrice;
        
        require(address(this).balance >= sttOutAmount, "Dex: Not enough STT liquidity");
        
        // Transfer user's ERC20 to Dex
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Send user STT
        payable(msg.sender).transfer(sttOutAmount);
    }

    // Sell ERC20, buy different ERC20
    function swapTokenForToken(address tokenIn, address tokenOut, uint256 amountIn) external nonReentrant {
        require(amountIn > 0, "Zero amount");
        require(tokenPrices[tokenIn] > 0 && tokenPrices[tokenOut] > 0, "Unsupported pair");
        
        uint256 tokenInValueUsd = (amountIn * tokenPrices[tokenIn]) / 1e18;
        uint256 tokenOutAmount = (tokenInValueUsd * 1e18) / tokenPrices[tokenOut];
        
        require(IERC20(tokenOut).balanceOf(address(this)) >= tokenOutAmount, "Dex: Not enough liquidity for TokenOut");
        
        // Move funds
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, tokenOutAmount);
    }
    
    // Allow Dex to receive STT for liquidity
    receive() external payable {}
    
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }
    function withdrawStt(uint256 amount) external onlyOwner {
        payable(owner).transfer(amount);
    }
}
