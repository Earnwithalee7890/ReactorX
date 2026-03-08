// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LendingMock
 * @author ReactorX Team
 * @notice Simulates a lending protocol with collateral, borrow, and health factor logic.
 *         This contract is the source of truth for position state on Somnia Testnet.
 *         ReactorEngine subscribes to events emitted here to trigger automatic liquidations.
 */
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LendingMock is ReentrancyGuard {
    // ========================================
    // STRUCTS
    // ========================================

    struct Position {
        uint256 collateral;    // Amount of STT deposited (18 decimals)
        uint256 debt;          // Amount borrowed in USD terms (18 decimals)
        bool isActive;         // Whether position exists
    }

    // ========================================
    // STATE VARIABLES
    // ========================================

    mapping(address => Position) public positions;
    address[] public positionHolders;
    mapping(address => bool) private isHolder;

    uint256 public collateralPrice;        // Price of STT in USD (18 decimals)
    uint256 public liquidationThreshold;   // % threshold e.g. 80 = 80%
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_HEALTH = 1e18; // Health factor = 1.0

    address public owner;
    address public reactorEngine;          

    // Supported Borrow Assets
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public tokenPrice; // Price of token in USD (18 decimals)

    // ========================================
    // EVENTS
    // ========================================

    event PositionUpdated(
        address indexed user,
        uint256 collateral,
        uint256 debt,
        uint256 healthFactor,
        uint256 timestamp
    );

    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event PositionLiquidated(address indexed user, uint256 collateralSeized, uint256 debtCleared, uint256 timestamp);
    event CollateralDeposited(address indexed user, uint256 amount, uint256 timestamp);
    event AssetBorrowed(address indexed user, address token, uint256 amount, uint256 timestamp);
    event AssetRepaid(address indexed user, address token, uint256 amount, uint256 timestamp);

    // ========================================
    // MODIFIERS
    // ========================================

    modifier onlyOwner() {
        require(msg.sender == owner, "LendingMock: not owner");
        _;
    }

    modifier onlyReactor() {
        require(msg.sender == reactorEngine || msg.sender == owner, "LendingMock: not reactor");
        _;
    }

    // ========================================
    // CONSTRUCTOR
    // ========================================

    constructor(uint256 _initialPrice, uint256 _liquidationThreshold) {
        owner = msg.sender;
        collateralPrice = _initialPrice;          
        liquidationThreshold = _liquidationThreshold; 
    }

    // ========================================
    // CONFIGURATION
    // ========================================

    function setReactorEngine(address _engine) external onlyOwner {
        reactorEngine = _engine;
    }

    function setSupportedToken(address token, bool status, uint256 price) external onlyOwner {
        supportedTokens[token] = status;
        tokenPrice[token] = price;
    }

    // ========================================
    // CORE PROTOCOL FUNCTIONS
    // ========================================

    /**
     * @notice Deposit native STT as collateral
     */
    function depositCollateral() external payable nonReentrant {
        require(msg.value > 0, "LendingMock: zero amount");

        positions[msg.sender].collateral += msg.value;
        positions[msg.sender].isActive = true;

        if (!isHolder[msg.sender]) {
            positionHolders.push(msg.sender);
            isHolder[msg.sender] = true;
        }

        uint256 hf = getHealthFactor(msg.sender);
        emit CollateralDeposited(msg.sender, msg.value, block.timestamp);
        emit PositionUpdated(msg.sender, positions[msg.sender].collateral, positions[msg.sender].debt, hf, block.timestamp);
    }

    /**
     * @notice Borrow ERC20 assets against STT collateral
     */
    function borrow(address token, uint256 amount) external nonReentrant {
        require(supportedTokens[token], "LendingMock: token not supported");
        require(amount > 0, "LendingMock: zero amount");
        
        // Debt value in USD
        uint256 debtValueUsd = (amount * tokenPrice[token]) / (10 ** (IERC20(token) != IERC20(address(0)) ? 18 : 18)); // Simplified decimals for now
        
        uint256 newDebt = positions[msg.sender].debt + debtValueUsd;
        uint256 collateralValue = (positions[msg.sender].collateral * collateralPrice) / PRECISION;
        uint256 maxBorrow = (collateralValue * liquidationThreshold) / 100;
        require(newDebt <= maxBorrow, "LendingMock: exceeds borrow limit");

        positions[msg.sender].debt = newDebt;

        // Mint/Transfer token to user (Protocol must hold liquidity)
        require(IERC20(token).balanceOf(address(this)) >= amount, "LendingMock: Not enough liquidity");
        IERC20(token).transfer(msg.sender, amount);

        uint256 hf = getHealthFactor(msg.sender);
        emit AssetBorrowed(msg.sender, token, amount, block.timestamp);
        emit PositionUpdated(msg.sender, positions[msg.sender].collateral, positions[msg.sender].debt, hf, block.timestamp);
    }

    /**
     * @notice Repay ERC20 assets to clear debt
     */
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

        uint256 hf = getHealthFactor(msg.sender);
        emit AssetRepaid(msg.sender, token, amount, block.timestamp);
        emit PositionUpdated(msg.sender, positions[msg.sender].collateral, positions[msg.sender].debt, hf, block.timestamp);
    }

    /**
     * @notice Admin/demo function to simulate oracle price drop
     */
    function updatePrice(uint256 newPrice) external {
        require(newPrice > 0, "LendingMock: zero price");
        uint256 old = collateralPrice;
        collateralPrice = newPrice;

        emit PriceUpdated(old, newPrice, block.timestamp);

        for (uint256 i = 0; i < positionHolders.length; i++) {
            address user = positionHolders[i];
            if (positions[user].isActive && positions[user].debt > 0) {
                uint256 hf = getHealthFactor(user);
                emit PositionUpdated(user, positions[user].collateral, positions[user].debt, hf, block.timestamp);
            }
        }
    }

    function liquidatePosition(address user) external onlyReactor nonReentrant returns (uint256 collateralSeized, uint256 debtCleared) {
        require(positions[user].isActive, "LendingMock: no active position");
        require(positions[user].debt > 0, "LendingMock: no debt");
        require(getHealthFactor(user) < MIN_HEALTH, "LendingMock: position healthy");

        collateralSeized = positions[user].collateral;
        debtCleared = positions[user].debt;

        // Seize collateral (STT) - normally would send to liquidator
        payable(msg.sender).transfer(collateralSeized);

        delete positions[user];

        emit PositionLiquidated(user, collateralSeized, debtCleared, block.timestamp);
        emit PositionUpdated(user, 0, 0, 0, block.timestamp);
    }

    receive() external payable {}

    // ========================================
    // VIEW FUNCTIONS
    // ========================================

    function getHealthFactor(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return type(uint256).max; 
        if (pos.collateral == 0) return 0;

        uint256 collateralValue = (pos.collateral * collateralPrice) / PRECISION;
        uint256 adjustedCollateral = (collateralValue * liquidationThreshold) / 100;
        return (adjustedCollateral * PRECISION) / pos.debt;
    }

    function getPosition(address user) external view returns (uint256 collateral, uint256 debt, bool isActive) {
        Position storage pos = positions[user];
        return (pos.collateral, pos.debt, pos.isActive);
    }

    function getAllPositionHolders() external view returns (address[] memory) {
        return positionHolders;
    }

    function isLiquidatable(address user) external view returns (bool) {
        return getHealthFactor(user) < MIN_HEALTH;
    }
}
