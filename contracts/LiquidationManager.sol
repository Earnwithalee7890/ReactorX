// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LiquidationManager
 * @author ReactorX Team
 * @notice Handles the execution of liquidations triggered by ReactorEngine.
 *         Manages liquidator rewards, collateral seizure, and protocol state updates.
 *         This contract receives calls from ReactorEngine when health factor drops below 1.0
 */
interface ILendingMock {
    function getHealthFactor(address user) external view returns (uint256);
    function getPosition(address user) external view returns (
        uint256 collateral,
        uint256 debt,
        bool isActive
    );
    function liquidatePosition(address user) external returns (uint256 collateralSeized, uint256 debtCleared);
    function isLiquidatable(address user) external view returns (bool);
}

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LiquidationManager is ReentrancyGuard {
    // ========================================
    // STRUCTS
    // ========================================

    struct LiquidationRecord {
        address user;
        uint256 collateralSeized;
        uint256 debtCleared;
        uint256 reward;
        uint256 timestamp;
        address executor;
    }

    // ========================================
    // STATE
    // ========================================

    ILendingMock public lendingMock;
    address public reactorEngine;
    address public owner;

    uint256 public constant LIQUIDATION_REWARD_BPS = 1000; // 10% liquidator reward
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MIN_HEALTH = 1e18;

    LiquidationRecord[] public liquidationHistory;
    mapping(address => uint256) public rewardsEarned; // liquidator => total reward
    mapping(address => bool) public liquidated;       // user => ever liquidated

    uint256 public totalLiquidations;
    uint256 public totalCollateralSeized;

    // ========================================
    // EVENTS
    // ========================================

    event Liquidated(
        address indexed user,
        uint256 collateralSeized,
        uint256 debtCleared,
        uint256 reward,
        address indexed executor,
        uint256 timestamp
    );

    event ReactorEngineSet(address indexed engine);

    // ========================================
    // MODIFIERS
    // ========================================

    modifier onlyOwner() {
        require(msg.sender == owner, "LiquidationManager: not owner");
        _;
    }

    modifier onlyReactorOrOwner() {
        require(
            msg.sender == reactorEngine || msg.sender == owner,
            "LiquidationManager: unauthorized"
        );
        _;
    }

    // ========================================
    // CONSTRUCTOR
    // ========================================

    constructor(address _lendingMock) {
        owner = msg.sender;
        lendingMock = ILendingMock(_lendingMock);
    }

    // ========================================
    // CONFIGURATION
    // ========================================

    function setReactorEngine(address _engine) external onlyOwner {
        reactorEngine = _engine;
        emit ReactorEngineSet(_engine);
    }

    // ========================================
    // CORE LIQUIDATION
    // ========================================

    /**
     * @notice Execute liquidation for an undercollateralized position.
     *         Called by ReactorEngine automatically when health factor < 1.0
     * @param user Address of the user to liquidate
     * @return success Whether liquidation was executed
     */
    function executeLiquidation(address user) external onlyReactorOrOwner nonReentrant returns (bool success) {
        require(!liquidated[user] || lendingMock.isLiquidatable(user), "LiquidationManager: not liquidatable");

        uint256 hf = lendingMock.getHealthFactor(user);
        require(hf < MIN_HEALTH, "LiquidationManager: position healthy");

        // Execute the liquidation on lending contract
        (uint256 collateralSeized, uint256 debtCleared) = lendingMock.liquidatePosition(user);

        // Calculate liquidator reward (10% of seized collateral)
        uint256 reward = (collateralSeized * LIQUIDATION_REWARD_BPS) / BPS_DENOMINATOR;

        // Record who executed (the reactor engine acts as liquidator in this model)
        address executor = msg.sender;

        // Save record
        liquidationHistory.push(LiquidationRecord({
            user: user,
            collateralSeized: collateralSeized,
            debtCleared: debtCleared,
            reward: reward,
            timestamp: block.timestamp,
            executor: executor
        }));

        rewardsEarned[executor] += reward;
        liquidated[user] = true;
        totalLiquidations++;
        totalCollateralSeized += collateralSeized;

        emit Liquidated(user, collateralSeized, debtCleared, reward, executor, block.timestamp);
        return true;
    }

    // ========================================
    // VIEW FUNCTIONS
    // ========================================

    function getLiquidationHistory() external view returns (LiquidationRecord[] memory) {
        return liquidationHistory;
    }

    function getLiquidationCount() external view returns (uint256) {
        return liquidationHistory.length;
    }

    function getLatestLiquidation() external view returns (LiquidationRecord memory) {
        require(liquidationHistory.length > 0, "No liquidations yet");
        return liquidationHistory[liquidationHistory.length - 1];
    }

    function isPositionLiquidatable(address user) external view returns (bool) {
        return lendingMock.isLiquidatable(user);
    }
}
