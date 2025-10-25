// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import Foundry Standard Library for testing utilities (cheatcodes like vm.prank, vm.warp, vm.expectRevert)
import "forge-std/Test.sol";
// Import the necessary OpenZeppelin interface for checking custom ERC20 errors
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

// Import the contracts to be tested
import "../contracts/MockPYUSD.sol";
import "../contracts/PYUSDSubscription.sol";

/**
 * @title SubscriptionTest
 * @author Akif Aybek & Hakan Akar (ETHGlobal Project)
 * @notice Test suite for the PYUSDSubscription contract.
 * @dev Uses Foundry's cheatcodes via Hardhat's Solidity test runner.
 * Inherits from `Test` for cheatcodes and `IERC20Errors` for error selectors.
 */
contract SubscriptionTest is Test, IERC20Errors {

    // --- Test State Variables ---
    MockPYUSD public mockPYUSD;             // Instance of the mock PYUSD token contract
    PYUSDSubscription public subscription;    // Instance of the subscription contract under test

    // --- Test Actors ---
    address public owner = vm.addr(1);    // Simulate the contract deployer/owner
    address public user1 = vm.addr(2);    // Simulate a regular user

    // --- Constants for Readability and Configuration ---
    uint256 public constant THIRTY_DAYS = 30 days; // Foundry time unit suffix for clarity
    uint256 public constant SUBSCRIPTION_FEE = 10 * (10**6); // Fee: 10 PYUSD (assuming 6 decimals)
    uint256 public constant MINT_AMOUNT = 1000 * (10**6);   // Amount of mock PYUSD to mint for user1

    // --- Setup Function ---
    /**
     * @notice Runs before each test function (`test_...`).
     * @dev Deploys fresh contract instances and sets initial state (mints tokens).
     */
    function setUp() public {
        vm.startPrank(owner);
        mockPYUSD = new MockPYUSD(owner);
        subscription = new PYUSDSubscription(
            address(mockPYUSD), // Address of the mock token
            SUBSCRIPTION_FEE,   // Subscription fee
            THIRTY_DAYS,        // Subscription period
            owner               // Initial owner of the subscription contract
        );

        // Mint MINT_AMOUNT of mock tokens to user1 (still acting as owner)
        mockPYUSD.mint(user1, MINT_AMOUNT);

        vm.stopPrank();
    }

    // --- Test Cases ---

    // --- Task 7: Happy Path Tests ---

    /**
     * @notice Test: User successfully approves and subscribes.
     */
    function test_Success_ApproveAndSubscribe() public {
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);
        subscription.subscribe();
        vm.stopPrank();

        bool isActive = subscription.isSubscriberActive(user1);
        assertEq(isActive, true, "Subscription should be active after subscribing");
    }

    /**
     * @notice Test: Expiration timestamp is set correctly upon initial subscription.
     */
    function test_Success_CheckExpirationTime() public {
        uint256 startTime = 1000;
        vm.warp(startTime);

        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);
        subscription.subscribe();
        vm.stopPrank();

        uint256 expiresAt = subscription.subscriberExpiresAt(user1);
        uint256 expectedExpiresAt = startTime + THIRTY_DAYS;
        assertEq(expiresAt, expectedExpiresAt, "Expiration time calculated incorrectly");
    }

    // --- Task 8: Time Manipulation Tests ---

    /**
     * @notice Test: `isSubscriberActive` returns false after the subscription period ends.
     */
    function test_Fail_ExpiredSubscription() public {
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);
        subscription.subscribe();
        vm.stopPrank();

        vm.warp(block.timestamp + THIRTY_DAYS + 1 seconds);

        bool isActive = subscription.isSubscriberActive(user1);
        assertEq(isActive, false, "Should return false when subscription expires");
    }

    /**
     * @notice Test: A user can successfully renew their subscription after it has expired.
     */
    function test_Success_RenewExpiredSubscription() public {
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);
        subscription.subscribe();
        vm.stopPrank();

        uint256 expiredTime = block.timestamp + THIRTY_DAYS + 1 seconds;
        vm.warp(expiredTime);

        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);
        subscription.subscribe();
        vm.stopPrank();

        bool isActive = subscription.isSubscriberActive(user1);
        assertEq(isActive, true, "Subscription should be active after renewal");

        uint256 expiresAt = subscription.subscriberExpiresAt(user1);
        uint256 expectedExpiresAt = expiredTime + THIRTY_DAYS;
        assertEq(expiresAt, expectedExpiresAt, "Renewed subscription expiration time is wrong");
    }

    // --- Task 9: Error Handling Tests ---

    /**
     * @notice Test: `subscribe` reverts with specific message if allowance is insufficient.
     */
    function test_Revert_InsufficientAllowance() public {
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE - 1); // Insufficient allowance

        // --- DÜZELTME BURADA: Kontrattaki Türkçe mesaja geri çevrildi ---
        vm.expectRevert(bytes("PYUSD onayi yetersiz")); 
        // ------------------------------------------------------------------
        
        subscription.subscribe(); // Should fail
        vm.stopPrank();
    }

    /**
     * @notice Test: `subscribe` reverts with ERC20InsufficientBalance if allowance is sufficient but balance is not.
     * @dev Checks for the OpenZeppelin v5+ custom error.
     */
    function test_Revert_InsufficientBalance() public {
        // Reduce user1's balance to just below the subscription fee
        uint256 user1Balance = mockPYUSD.balanceOf(user1);
        uint256 amountToKeep = SUBSCRIPTION_FEE - 1;
        uint256 amountToSendBack = user1Balance - amountToKeep;

        vm.prank(user1); // Use vm.prank for single call from user1's perspective
        mockPYUSD.transfer(owner, amountToSendBack); // User sends excess tokens to owner

        // user1 approves the full amount
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);

        // Expect the standard OpenZeppelin ERC20 custom error
        uint256 currentBalance = mockPYUSD.balanceOf(user1);
        uint256 neededAmount = SUBSCRIPTION_FEE;
        vm.expectRevert(
            abi.encodeWithSelector(
                ERC20InsufficientBalance.selector,
                user1,
                currentBalance,
                neededAmount
            )
        );
        subscription.subscribe(); // Should fail during transferFrom
        vm.stopPrank();
    }

}