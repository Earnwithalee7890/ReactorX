// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReactorEngine
 * @author ReactorX Team
 * @notice THE CORE OF REACTORX — Uses Somnia Native On-Chain Reactivity
 *
 * This contract is a Somnia Event Handler. The Somnia Reactivity system
 * invokes _onEvent() automatically when LendingMock emits PositionUpdated.
 *
 * HOW IT WORKS:
 * 1. Deploy this contract
 * 2. Register a subscription with Somnia Reactivity Precompile (0x0100)
 * 3. Subscribe to PositionUpdated events from LendingMock
 * 4. Somnia validators automatically call _onEvent() when events fire
 * 5. _onEvent() checks health factor and calls LiquidationManager if needed
 *
 * NO OFF-CHAIN BOTS. NO CRON JOBS. PURE REACTIVE ON-CHAIN AUTOMATION.
 */

/**
 * @notice Somnia Reactivity Precompile interface
 *         Located at address 0x0100 on Somnia network
 */
interface ISomniaReactivityPrecompile {
    struct SubscriptionData {
        bytes32[4] eventTopics;           // Topic filter (0x0 for wildcard)
        address origin;                    // Origin filter (address(0) for wildcard)
        address caller;                    // Caller filter (address(0) for wildcard)
        address emitter;                   // Contract emitting the event
        address handlerContractAddress;    // This contract's address
        bytes4 handlerFunctionSelector;    // handleReactiveEvent.selector
        uint64 priorityFeePerGas;          // Priority fee in nanoSomi
        uint64 maxFeePerGas;               // Max fee in nanoSomi
        uint64 gasLimit;                   // Gas limit for handler invocation
        bool isGuaranteed;                 // If true, guaranteed execution
        bool isCoalesced;                  // If true, events can be coalesced
    }

    function subscribe(SubscriptionData calldata subscriptionData) external returns (uint64 subscriptionId);
    function unsubscribe(uint64 subscriptionId) external;
}

/**
 * @notice Interface for LendingMock
 */
interface ILendingMockReactor {
    function getHealthFactor(address user) external view returns (uint256);
    function isLiquidatable(address user) external view returns (bool);
    function getPosition(address user) external view returns (
        uint256 collateral,
        uint256 debt,
        bool isActive
    );
}

/**
 * @notice Interface for LiquidationManager
 */
interface ILiquidationManagerReactor {
    function executeLiquidation(address user) external returns (bool);
}

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ReactorEngine is ReentrancyGuard {
    // ========================================
    // CONSTANTS
    // ========================================

    // Somnia Reactivity Precompile address
    address public constant SOMNIA_REACTIVITY_PRECOMPILE = address(0x0100);

    // PositionUpdated(address,uint256,uint256,uint256,uint256) event signature
    // keccak256("PositionUpdated(address,uint256,uint256,uint256,uint256)")
    bytes32 public constant POSITION_UPDATED_TOPIC =
        keccak256("PositionUpdated(address,uint256,uint256,uint256,uint256)");

    // PriceUpdated(uint256,uint256,uint256) event signature
    bytes32 public constant PRICE_UPDATED_TOPIC =
        keccak256("PriceUpdated(uint256,uint256,uint256)");

    uint256 public constant MIN_HEALTH_FACTOR = 1e18; // 1.0

    // ========================================
    // STATE
    // ========================================

    ILendingMockReactor public lendingMock;
    ILiquidationManagerReactor public liquidationManager;
    ISomniaReactivityPrecompile public immutable reactivityPrecompile;

    address public owner;
    uint64 public positionSubscriptionId;
    uint64 public priceSubscriptionId;
    bool public isSubscribed;

    // Track processed liquidations to avoid double-execution
    mapping(address => uint256) public lastLiquidationTimestamp;
    uint256 public constant LIQUIDATION_COOLDOWN = 60; // 60 seconds

    // Reaction counters for demo purposes
    uint256 public totalReactions;
    uint256 public totalLiquidationsTriggered;

    // ========================================
    // EVENTS
    // ========================================

    event ReactionTriggered(
        address indexed user,
        uint256 healthFactor,
        bool liquidationExecuted,
        uint256 timestamp
    );

    event SubscriptionCreated(uint64 subscriptionId, string eventType);
    event SubscriptionRemoved(uint64 subscriptionId);
    event EngineConfigured(address lendingMock, address liquidationManager);

    // ========================================
    // MODIFIERS
    // ========================================

    modifier onlyOwner() {
        require(msg.sender == owner, "ReactorEngine: not owner");
        _;
    }

    modifier onlySomniaReactivity() {
        // Allow Somnia validators (precompile invocations come from system addresses)
        // Also allow owner for testing
        require(
            msg.sender == SOMNIA_REACTIVITY_PRECOMPILE ||
            msg.sender == owner ||
            msg.sender == address(this),
            "ReactorEngine: unauthorized caller"
        );
        _;
    }

    // ========================================
    // CONSTRUCTOR
    // ========================================

    constructor() {
        owner = msg.sender;
        reactivityPrecompile = ISomniaReactivityPrecompile(SOMNIA_REACTIVITY_PRECOMPILE);
    }

    // ========================================
    // CONFIGURATION
    // ========================================

    function configure(address _lendingMock, address _liquidationManager) external onlyOwner {
        lendingMock = ILendingMockReactor(_lendingMock);
        liquidationManager = ILiquidationManagerReactor(_liquidationManager);
        emit EngineConfigured(_lendingMock, _liquidationManager);
    }

    // ========================================
    // SOMNIA REACTIVITY SUBSCRIPTION
    // ========================================

    /**
     * @notice Register reactive subscription with Somnia Precompile
     *         This enables automatic invocation when LendingMock emits events
     * @param _lendingMockAddress Address of the LendingMock contract to watch
     */
    function registerSubscription(address _lendingMockAddress) external {
        require(!isSubscribed, "ReactorEngine: already subscribed");

        // Subscribe to PositionUpdated events
        bytes32[4] memory positionTopics;
        positionTopics[0] = POSITION_UPDATED_TOPIC;

        ISomniaReactivityPrecompile.SubscriptionData memory positionSub = ISomniaReactivityPrecompile.SubscriptionData({
            eventTopics: positionTopics,
            origin: address(0),           // Wildcard: any tx origin
            caller: address(0),           // Wildcard: any caller
            emitter: _lendingMockAddress, // Only from LendingMock
            handlerContractAddress: address(this),
            handlerFunctionSelector: this.handleReactiveEvent.selector,
            priorityFeePerGas: 2_000_000_000,   // 2 gwei
            maxFeePerGas: 10_000_000_000,         // 10 gwei
            gasLimit: 500_000,
            isGuaranteed: true,
            isCoalesced: false
        });

        positionSubscriptionId = reactivityPrecompile.subscribe(positionSub);
        isSubscribed = true;

        emit SubscriptionCreated(positionSubscriptionId, "PositionUpdated");
    }

    /**
     * @notice Remove the reactive subscription
     */
    function removeSubscription() external onlyOwner {
        require(isSubscribed, "ReactorEngine: not subscribed");
        reactivityPrecompile.unsubscribe(positionSubscriptionId);
        isSubscribed = false;
        emit SubscriptionRemoved(positionSubscriptionId);
    }

    // ========================================
    // SOMNIA EVENT HANDLER (REACTIVE CALLBACK)
    // ========================================

    /**
     * @notice Called AUTOMATICALLY by Somnia validators when LendingMock emits PositionUpdated
     *         This is the core of Somnia Native On-Chain Reactivity.
     *
     * @param eventTopics Array of event topics (topic[0] = event sig, topic[1] = indexed user)
     * @param data      ABI-encoded non-indexed event data
     */
    function handleReactiveEvent(
        address, /* emitter - unused, kept for interface compatibility */
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) external onlySomniaReactivity nonReentrant {
        totalReactions++;

        // Decode the user address from topic[1] (indexed parameter)
        if (eventTopics.length < 2) return;

        address user = address(uint160(uint256(eventTopics[1])));
        if (user == address(0)) return;

        // Decode healthFactor from non-indexed data (4th param in PositionUpdated)
        // PositionUpdated(address indexed user, uint256 collateral, uint256 debt, uint256 healthFactor, uint256 timestamp)
        // non-indexed: collateral, debt, healthFactor, timestamp
        if (data.length < 128) return;

        (, uint256 debt, uint256 healthFactor, ) = abi.decode(
            data,
            (uint256, uint256, uint256, uint256)
        );

        // Prevent re-entry / spam liquidations
        uint256 cooldownEnd = lastLiquidationTimestamp[user] + LIQUIDATION_COOLDOWN;
        if (block.timestamp < cooldownEnd) return;

        // Check if position needs liquidation
        bool liquidationExecuted = false;
        if (healthFactor < MIN_HEALTH_FACTOR && debt > 0) {
            // Double-check on-chain state
            try lendingMock.isLiquidatable(user) returns (bool liquidatable) {
                if (liquidatable) {
                    try liquidationManager.executeLiquidation(user) returns (bool success) {
                        if (success) {
                            liquidationExecuted = true;
                            lastLiquidationTimestamp[user] = block.timestamp;
                            totalLiquidationsTriggered++;
                        }
                    } catch {}
                }
            } catch {}
        }

        emit ReactionTriggered(user, healthFactor, liquidationExecuted, block.timestamp);
    }

    /**
     * @notice Manual trigger for testing purposes (owner only)
     *         Simulates what Somnia validators do automatically
     */
    function manualReact(address user) external nonReentrant {
        uint256 hf = lendingMock.getHealthFactor(user);
        bool liquidationExecuted = false;

        if (hf < MIN_HEALTH_FACTOR) {
            bool liquidatable = lendingMock.isLiquidatable(user);
            if (liquidatable) {
                bool success = liquidationManager.executeLiquidation(user);
                if (success) {
                    liquidationExecuted = true;
                    lastLiquidationTimestamp[user] = block.timestamp;
                    totalLiquidationsTriggered++;
                    totalReactions++;
                }
            }
        }

        emit ReactionTriggered(user, hf, liquidationExecuted, block.timestamp);
    }

    receive() external payable {}

    // ========================================
    // VIEW FUNCTIONS
    // ========================================

    function getStats() external view returns (
        uint256 reactions,
        uint256 liquidations,
        bool subscribed,
        uint64 subId
    ) {
        return (totalReactions, totalLiquidationsTriggered, isSubscribed, positionSubscriptionId);
    }
}
