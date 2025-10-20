// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 1. Hardhat/Foundry'nin test kütüphanesini import et
import "forge-std/Test.sol";
// OpenZeppelin'in custom error'larını tanımak için gerekli arayüzü import et
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

// 2. Test edeceğimiz kontratları import et
import "../contracts/MockPYUSD.sol";
import "../contracts/PYUSDSubscription.sol";

contract SubscriptionTest is Test, IERC20Errors { // <-- IERC20Errors'ı ekle

    // --- Test Değişkenleri ---
    MockPYUSD public mockPYUSD;
    PYUSDSubscription public subscription;

    address public owner = address(0x1); // Kontrat sahibi (biz)
    address public user1 = address(0x2); // Test kullanıcısı

    // 30 gün saniye cinsinden
    uint256 public constant THIRTY_DAYS = 30 * 24 * 60 * 60;

    // 10 PYUSD (6 ondalık basamağa göre)
    uint256 public constant SUBSCRIPTION_FEE = 10 * (10**6);

    // Test için mint edilecek miktar (1000 PYUSD)
    uint256 public constant MINT_AMOUNT = 1000 * (10**6);

    // --- KURULUM (setUp) ---
    function setUp() public {
        vm.startPrank(owner);
        mockPYUSD = new MockPYUSD(owner);
        subscription = new PYUSDSubscription(
            address(mockPYUSD),
            SUBSCRIPTION_FEE,
            THIRTY_DAYS,
            owner
        );
        mockPYUSD.mint(user1, MINT_AMOUNT);
        vm.stopPrank();
    }

    // --- GÖREV 7: BAŞARILI AKIŞ TESTLERİ ---
    function test_Success_ApproveAndSubscribe() public {
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);
        subscription.subscribe();
        vm.stopPrank();

        bool isActive = subscription.isSubscriberActive(user1);
        assertEq(isActive, true, "Subscription should be active");
    }

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

    // --- GÖREV 8: ZAMAN MANİPÜLASYONU TESTLERİ ---
    function test_Fail_ExpiredSubscription() public {
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);
        subscription.subscribe();
        vm.stopPrank();

        vm.warp(block.timestamp + THIRTY_DAYS + 1);

        bool isActive = subscription.isSubscriberActive(user1);
        assertEq(isActive, false, "Should return false when subscription expires");
    }

    function test_Success_RenewExpiredSubscription() public {
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);
        subscription.subscribe();
        vm.stopPrank();

        uint256 expiredTime = block.timestamp + THIRTY_DAYS + 1;
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

    // --- GÖREV 9: HATA YÖNETİMİ TESTLERİ ---
    function test_Revert_InsufficientAllowance() public {
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE - 1); // Eksik onay

        bytes memory expectedError = bytes("PYUSD onayi yetersiz");
        vm.expectRevert(expectedError);
        subscription.subscribe();

        vm.stopPrank();
    }

    /**
     * @dev Yeterli onay varken ancak yetersiz bakiye ile 'subscribe' çağrıldığında
     * işlemin (transferFrom nedeniyle) revert olmasını test eder.
     * DÜZELTME: OpenZeppelin v5+ ERC20InsufficientBalance custom error kullanır.
     */
    function test_Revert_InsufficientBalance() public {
        // user1'in bakiyesini düşür
        uint256 user1Balance = mockPYUSD.balanceOf(user1);
        uint256 amountToKeep = SUBSCRIPTION_FEE - 1;
        uint256 amountToSendBack = user1Balance - amountToKeep;

        vm.startPrank(user1);
        mockPYUSD.transfer(owner, amountToSendBack);
        vm.stopPrank();

        // user1 olarak işlem yap
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE); // Tam onay

        // --- DÜZELTİLMİŞ KISIM ---
        // Beklenen Hata: ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)
        uint256 currentBalance = mockPYUSD.balanceOf(user1); // amountToKeep'e eşit olmalı
        uint256 neededAmount = SUBSCRIPTION_FEE;

        // Custom error'ı ve argümanlarını belirterek expectRevert kullan
        vm.expectRevert(
            abi.encodeWithSelector(
                ERC20InsufficientBalance.selector, // Hata adı (IERC20Errors'dan miras alındı)
                user1, // sender
                currentBalance, // balance
                neededAmount // needed
            )
        );
        // -----------------------

        subscription.subscribe(); // Başarısız olmalı

        vm.stopPrank();
    }

} // <-- Kontratın sonu