// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LendingMock is ReentrancyGuard {
    struct Position {
        uint256 debt;          // Amount borrowed in USD terms (18 decimals)
        bool isActive;         // Whether position exists
    }

    mapping(address => Position) public positions;
    address[] public positionHolders;
    mapping(address => bool) private isHolder;

    // collateralBalances[user][token] -> amount (token decimals)
    mapping(address => mapping(address => uint256)) public collateralBalances;
    address[] public collateralTokens;
    mapping(address => bool) private isCollateralToken;

    uint256 public collateralPrice;        // Price of native STT in USD (18 decimals)
    uint256 public liquidationThreshold;   // % threshold e.g. 80 = 80%
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_HEALTH = 1e18; 

    address public owner;
    address public reactorEngine;          

    mapping(address => bool) public supportedTokens; // Assets that can be borrowed or used as collateral
    mapping(address => uint256) public tokenPrice; 

    event PositionUpdated(address indexed user, uint256 totalCollateralUsd, uint256 debt, uint256 healthFactor, uint256 timestamp);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event PositionLiquidated(address indexed user, uint256 collateralSeizedUsd, uint256 debtCleared, uint256 timestamp);
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event AssetBorrowed(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event AssetRepaid(address indexed user, address indexed token, uint256 amount, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "LendingMock: not owner");
        _;
    }

    modifier onlyReactor() {
        require(msg.sender == reactorEngine || msg.sender == owner, "LendingMock: not reactor");
        _;
    }

    constructor(uint256 _initialPrice, uint256 _liquidationThreshold) {
        owner = msg.sender;
        collateralPrice = _initialPrice;          
        liquidationThreshold = _liquidationThreshold; 
        // Add native token (represented as addr 0) as a collateral token
        collateralTokens.push(address(0));
        isCollateralToken[address(0)] = true;
    }

    function setReactorEngine(address _engine) external onlyOwner {
        reactorEngine = _engine;
    }

    function setSupportedToken(address token, bool status, uint256 price) external onlyOwner {
        supportedTokens[token] = status;
        tokenPrice[token] = price;
        if (status && !isCollateralToken[token]) {
            collateralTokens.push(token);
            isCollateralToken[token] = true;
        }
    }

    function depositCollateral(address token, uint256 amount) external payable nonReentrant {
        if (token == address(0)) {
            require(msg.value > 0, "LendingMock: zero STT");
            collateralBalances[msg.sender][address(0)] += msg.value;
        } else {
            require(supportedTokens[token], "LendingMock: token not supported");
            require(amount > 0, "LendingMock: zero amount");
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            collateralBalances[msg.sender][token] += amount;
        }

        positions[msg.sender].isActive = true;
        if (!isHolder[msg.sender]) {
            positionHolders.push(msg.sender);
            isHolder[msg.sender] = true;
        }

        emit CollateralDeposited(msg.sender, token, token == address(0) ? msg.value : amount, block.timestamp);
        _emitPositionUpdate(msg.sender);
    }

    function borrow(address token, uint256 amount) external nonReentrant {
        require(supportedTokens[token], "LendingMock: token not supported");
        require(amount > 0, "LendingMock: zero amount");
        
        uint256 decimals = 18;
        try IERC20(token).balanceOf(address(this)) {
            // It's a real token, try to get decimals would be better but let's assume 18 for mock
        } catch {}

        uint256 debtValueUsd = (amount * tokenPrice[token]) / PRECISION;
        uint256 newDebt = positions[msg.sender].debt + debtValueUsd;
        
        uint256 totalCollateralValue = getTotalCollateralValue(msg.sender);
        uint256 maxBorrow = (totalCollateralValue * liquidationThreshold) / 100;
        require(newDebt <= maxBorrow, "LendingMock: exceeds borrow limit");

        positions[msg.sender].debt = newDebt;
        require(IERC20(token).balanceOf(address(this)) >= amount, "LendingMock: Not enough liquidity");
        IERC20(token).transfer(msg.sender, amount);

        emit AssetBorrowed(msg.sender, token, amount, block.timestamp);
        _emitPositionUpdate(msg.sender);
    }

    function repay(address token, uint256 amount) external nonReentrant {
        require(supportedTokens[token], "LendingMock: token not supported");
        require(amount > 0, "LendingMock: zero amount");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        uint256 repayValueUsd = (amount * tokenPrice[token]) / PRECISION;
        if (repayValueUsd > positions[msg.sender].debt) {
            positions[msg.sender].debt = 0;
        } else {
            positions[msg.sender].debt -= repayValueUsd;
        }

        emit AssetRepaid(msg.sender, token, amount, block.timestamp);
        _emitPositionUpdate(msg.sender);
    }

    function updatePrice(uint256 newPrice) external {
        require(newPrice > 0, "LendingMock: zero price");
        uint256 old = collateralPrice;
        collateralPrice = newPrice;
        emit PriceUpdated(old, newPrice, block.timestamp);

        for (uint256 i = 0; i < positionHolders.length; i++) {
            address user = positionHolders[i];
            if (positions[user].isActive && positions[user].debt > 0) {
                _emitPositionUpdate(user);
            }
        }
    }

    function liquidatePosition(address user) external onlyReactor nonReentrant returns (uint256 totalValueSeized, uint256 debtCleared) {
        require(positions[user].isActive, "LendingMock: no active position");
        require(getHealthFactor(user) < MIN_HEALTH, "LendingMock: position healthy");

        totalValueSeized = getTotalCollateralValue(user);
        debtCleared = positions[user].debt;

        // Seize all collateral assets
        for (uint256 i = 0; i < collateralTokens.length; i++) {
            address t = collateralTokens[i];
            uint256 bal = collateralBalances[user][t];
            if (bal > 0) {
                collateralBalances[user][t] = 0;
                if (t == address(0)) {
                    payable(msg.sender).transfer(bal);
                } else {
                    IERC20(t).transfer(msg.sender, bal);
                }
            }
        }

        delete positions[user];
        emit PositionLiquidated(user, totalValueSeized, debtCleared, block.timestamp);
        emit PositionUpdated(user, 0, 0, 0, block.timestamp);
    }

    function getHealthFactor(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return type(uint256).max; 
        
        uint256 totalCollateralValue = getTotalCollateralValue(user);
        if (totalCollateralValue == 0) return 0;

        uint256 adjustedCollateral = (totalCollateralValue * liquidationThreshold) / 100;
        return (adjustedCollateral * PRECISION) / pos.debt;
    }

    function getTotalCollateralValue(address user) public view returns (uint256 totalValueUsd) {
        for (uint256 i = 0; i < collateralTokens.length; i++) {
            address t = collateralTokens[i];
            uint256 bal = collateralBalances[user][t];
            if (bal > 0) {
                if (t == address(0)) {
                    totalValueUsd += (bal * collateralPrice) / PRECISION;
                } else {
                    totalValueUsd += (bal * tokenPrice[t]) / PRECISION;
                }
            }
        }
    }

    function getPosition(address user) external view returns (uint256 totalCollateralUsd, uint256 debt, bool isActive) {
        return (getTotalCollateralValue(user), positions[user].debt, positions[user].isActive);
    }

    function _emitPositionUpdate(address user) internal {
        uint256 hf = getHealthFactor(user);
        emit PositionUpdated(user, getTotalCollateralValue(user), positions[user].debt, hf, block.timestamp);
    }

    function getAllPositionHolders() external view returns (address[] memory) {
        return positionHolders;
    }

    function isLiquidatable(address user) external view returns (bool) {
        return getHealthFactor(user) < MIN_HEALTH;
    }

    function getCollateralBalance(address user, address token) external view returns (uint256) {
        return collateralBalances[user][token];
    }

    receive() external payable {}
}
