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

contract LendingMock is ReentrancyGuard {
    // ========================================
    // STRUCTS
    // ========================================

    struct Position {
        uint256 collateral;    // Amount of collateral deposited (in tokens, 18 decimals)
        uint256 debt;          // Amount borrowed (in tokens, 18 decimals)
        bool isActive;         // Whether position exists
    }

    // ========================================
    // STATE VARIABLES
    // ========================================

    mapping(address => Position) public positions;
    address[] public positionHolders;
    mapping(address => bool) private isHolder;

    uint256 public collateralPrice;        // Price of collateral in USD (18 decimals)
    uint256 public liquidationThreshold;   // % threshold e.g. 80 = 80%
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_HEALTH = 1e18; // Health factor = 1.0

    address public owner;
    address public reactorEngine;          // ReactorEngine contract address (set after deploy)

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

    event PriceUpdated(
        uint256 oldPrice,
        uint256 newPrice,
        uint256 timestamp
    );

    event PositionLiquidated(
        address indexed user,
        uint256 collateralSeized,
        uint256 debtCleared,
        uint256 timestamp
    );

    event CollateralDeposited(address indexed user, uint256 amount, uint256 timestamp);
    event AssetBorrowed(address indexed user, uint256 amount, uint256 timestamp);

    // ========================================
    // MODIFIERS
    // ========================================

    modifier onlyOwner() {
        require(msg.sender == owner, "LendingMock: not owner");
        _;
    }

    modifier onlyReactor() {
        require(
            msg.sender == reactorEngine || msg.sender == owner,
            "LendingMock: not reactor or owner"
        );
        _;
    }

    // ========================================
    // CONSTRUCTOR
    // ========================================

    constructor(uint256 _initialPrice, uint256 _liquidationThreshold) {
        owner = msg.sender;
        collateralPrice = _initialPrice;          // e.g. 2000 * 1e18 = $2000
        liquidationThreshold = _liquidationThreshold; // e.g. 80
    }

    // ========================================
    // CONFIGURATION
    // ========================================

    function setReactorEngine(address _engine) external onlyOwner {
        reactorEngine = _engine;
    }

    // ========================================
    // CORE PROTOCOL FUNCTIONS
    // ========================================

    /**
     * @notice Deposit collateral into the protocol (mock token, no transfer needed)
     * @param amount Amount of collateral to deposit (18 decimals)
     */
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingMock: zero amount");

        positions[msg.sender].collateral += amount;
        positions[msg.sender].isActive = true;

        if (!isHolder[msg.sender]) {
            positionHolders.push(msg.sender);
            isHolder[msg.sender] = true;
        }

        uint256 hf = getHealthFactor(msg.sender);

        emit CollateralDeposited(msg.sender, amount, block.timestamp);
        emit PositionUpdated(
            msg.sender,
            positions[msg.sender].collateral,
            positions[msg.sender].debt,
            hf,
            block.timestamp
        );
    }

    /**
     * @notice Borrow assets against deposited collateral (mock, no actual transfer)
     * @param amount Amount to borrow (18 decimals)
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingMock: zero amount");
        require(positions[msg.sender].collateral > 0, "LendingMock: no collateral");

        // Check borrow would not immediately liquidate
        uint256 newDebt = positions[msg.sender].debt + amount;
        uint256 collateralValue = (positions[msg.sender].collateral * collateralPrice) / PRECISION;
        uint256 maxBorrow = (collateralValue * liquidationThreshold) / 100;
        require(newDebt <= maxBorrow, "LendingMock: exceeds borrow limit");

        positions[msg.sender].debt = newDebt;

        uint256 hf = getHealthFactor(msg.sender);

        emit AssetBorrowed(msg.sender, amount, block.timestamp);
        emit PositionUpdated(
            msg.sender,
            positions[msg.sender].collateral,
            positions[msg.sender].debt,
            hf,
            block.timestamp
        );
    }

    /**
     * @notice Admin/demo function to simulate oracle price drop
     * @param newPrice New price of collateral (18 decimals)
     */
    function updatePrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "LendingMock: zero price");
        uint256 old = collateralPrice;
        collateralPrice = newPrice;

        emit PriceUpdated(old, newPrice, block.timestamp);

        // Also emit PositionUpdated for ALL active positions so ReactorEngine can react
        for (uint256 i = 0; i < positionHolders.length; i++) {
            address user = positionHolders[i];
            if (positions[user].isActive && positions[user].debt > 0) {
                uint256 hf = getHealthFactor(user);
                emit PositionUpdated(
                    user,
                    positions[user].collateral,
                    positions[user].debt,
                    hf,
                    block.timestamp
                );
            }
        }
    }

    /**
     * @notice Called by ReactorEngine or LiquidationManager to clear a position
     * @param user Address of user to liquidate
     */
    function liquidatePosition(address user) external onlyReactor nonReentrant returns (uint256 collateralSeized, uint256 debtCleared) {
        require(positions[user].isActive, "LendingMock: no active position");
        require(positions[user].debt > 0, "LendingMock: no debt");
        require(getHealthFactor(user) < MIN_HEALTH, "LendingMock: position healthy");

        collateralSeized = positions[user].collateral;
        debtCleared = positions[user].debt;

        delete positions[user];

        emit PositionLiquidated(user, collateralSeized, debtCleared, block.timestamp);
        emit PositionUpdated(user, 0, 0, 0, block.timestamp);
    }

    // ========================================
    // VIEW FUNCTIONS
    // ========================================

    /**
     * @notice Calculate the health factor for a user
     * @param user Address to check
     * @return Health factor (18 decimals). < 1e18 = liquidatable
     */
    function getHealthFactor(address user) public view returns (uint256) {
        Position memory pos = positions[user];
        if (pos.debt == 0) return type(uint256).max; // No debt = max health
        if (pos.collateral == 0) return 0;

        // Health Factor = (collateral * price * threshold%) / debt
        uint256 collateralValue = (pos.collateral * collateralPrice) / PRECISION;
        uint256 adjustedCollateral = (collateralValue * liquidationThreshold) / 100;
        return (adjustedCollateral * PRECISION) / pos.debt;
    }

    function getPosition(address user) external view returns (Position memory) {
        return positions[user];
    }

    function getAllPositionHolders() external view returns (address[] memory) {
        return positionHolders;
    }

    function isLiquidatable(address user) external view returns (bool) {
        return getHealthFactor(user) < MIN_HEALTH;
    }
}
