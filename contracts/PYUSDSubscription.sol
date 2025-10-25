// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import the standard IERC20 interface from OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Import Ownable for managing contract ownership.
import "@openzeppelin/contracts/access/Ownable.sol";

// Note: Inheriting ERC20 error interfaces is often good practice for explicit custom errors.

/**
 * @title PYUSDSubscription
 * @notice A protocol enabling token-gated subscriptions using PYUSD stablecoin.
 * @dev Implements a pull-payment model using ERC-20 approve/transferFrom.
 * Access control is based on time (expiration timestamp). This structure allows
 * the user's funds to remain in their wallet until the moment of payment.
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
        // Validate inputs before setting state
        require(_pyusdAddress != address(0), "PYUSD address cannot be zero");
        require(_fee > 0, "Fee must be greater than zero");
        require(_period > 0, "Period must be greater than zero");
        
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

        // 1. Check Allowance: Verify the user has approved enough tokens for the fee.
        uint256 allowance = pyusdToken.allowance(user, address(this));
        // CRITICAL FIX: Translate revert message
        require(allowance >= subscriptionFee, "Allowance insufficient"); 

        // 2. Pull Payment: Execute the transfer using the granted allowance.
        bool sent = pyusdToken.transferFrom(user, address(this), subscriptionFee);
        // CRITICAL FIX: Translate revert message
        require(sent, "PYUSD transfer failed"); 

        // 3. Calculate Expiration: Determine the new expiration time, handling renewals.
        uint256 currentExpiration = subscriberExpiresAt[user];
        uint256 newExpiration;

        if (currentExpiration > block.timestamp) {
            // Renewal case: Extend from the current expiration date.
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
     * @dev This is a gas-less `view` function, essential for off-chain access control checks.
     * @return bool True if the expiration time is in the future, false otherwise.
     */
    function isSubscriberActive(address _subscriber) public view returns (bool) {
        // The subscription is active if the expiration time is in the future.
        return subscriberExpiresAt[_subscriber] > block.timestamp;
    }
    
}