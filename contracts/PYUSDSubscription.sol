// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import the standard IERC20 interface from OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Import Ownable for managing contract ownership.
import "@openzeppelin/contracts/access/Ownable.sol";

// Note: Importing IERC20Errors is recommended for clean error handling, 
// but is excluded here as per your request to minimize changes.

/**
 * @title PYUSDSubscription
 * @notice A protocol enabling token-gated subscriptions using PYUSD stablecoin.
 * @dev Implements a pull-payment model using ERC-20 approve/transferFrom.
 * Access control is based on time (expiration timestamp).
 */
contract PYUSDSubscription is Ownable {

    // --- State Variables ---

    IERC20 public immutable pyusdToken;
    uint256 public immutable subscriptionFee;
    uint256 public immutable subscriptionPeriod;
    
    /**
     * @notice Maps subscriber address to their subscription expiration timestamp (Unix time).
     */
    mapping(address => uint256) public subscriberExpiresAt;


    // --- Event ---
    /**
     * @notice Emitted when a subscription is successfully activated or renewed.
     */
    event SubscriptionUpdated(address indexed user, uint256 expiresAt);


    // --- Constructor ---

    /**
     * @notice Initializes the contract with immutable subscription parameters.
     */
    constructor(
        address _pyusdAddress,
        uint256 _fee,
        uint256 _period,
        address _initialOwner
    ) Ownable(_initialOwner) {
        // Input validation
        require(_pyusdAddress != address(0), "PYUSD adresi sifir olamaz");
        require(_fee > 0, "Ucret sifirdan buyuk olmali");
        require(_period > 0, "Sure sifirdan buyuk olmali");
        
        // Assign immutable variables
        pyusdToken = IERC20(_pyusdAddress);
        subscriptionFee = _fee;
        subscriptionPeriod = _period;
    }


    // --- Core Subscription Logic ---

    /**
     * @notice Allows the caller (`msg.sender`) to start or renew their subscription.
     * @dev Requires prior approval (allowance) from the user. Uses `transferFrom` (pull payment).
     * The `public` visibility is necessary for testing with `Subscription.t.sol`.
     */
    function subscribe() public { 
        address user = msg.sender;

        // 1. Check Allowance: Verify if the user has approved enough tokens for the fee.
        uint256 allowance = pyusdToken.allowance(user, address(this));
        require(allowance >= subscriptionFee, "PYUSD onayi yetersiz");

        // 2. Pull Payment: Execute the transfer from the user to this contract.
        bool sent = pyusdToken.transferFrom(user, address(this), subscriptionFee);
        require(sent, "PYUSD transferi basarisiz");

        // 3. Calculate Expiration: Determine the new expiration time, handling renewals.
        uint256 currentExpiration = subscriberExpiresAt[user];
        uint256 newExpiration;

        if (currentExpiration > block.timestamp) {
            // Active subscription: Extend from the current expiration date.
            newExpiration = currentExpiration + subscriptionPeriod;
        } else {
            // New or expired subscription: Start the new period from the current block time.
            newExpiration = block.timestamp + subscriptionPeriod;
        }
        
        subscriberExpiresAt[user] = newExpiration;

        // 4. Emit Event: Notify listeners about the update.
        emit SubscriptionUpdated(user, newExpiration);
    }

    /**
     * @notice Checks if a given address has a subscription that is currently active.
     * @dev A `view` function, essential for gas-less off-chain access control checks.
     */
    function isSubscriberActive(address _subscriber) public view returns (bool) {
        // The subscription is active if the expiration time is in the future.
        return subscriberExpiresAt[_subscriber] > block.timestamp;
    }
    
}