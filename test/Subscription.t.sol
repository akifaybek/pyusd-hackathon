// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 1. Hardhat/Foundry'nin test kütüphanesini import et
import "forge-std/Test.sol";

// 2. Test edeceğimiz kontratları import et
import "../contracts/MockPYUSD.sol";
import "../contracts/PYUSDSubscription.sol";

contract SubscriptionTest is Test {

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
    // Bu fonksiyon her testten önce otomatik olarak çalışır
    function setUp() public {
        // 1. 'owner' olarak işlem yapmaya başla
        vm.startPrank(owner);
        
        // 2. MockPYUSD'yi deploy et (sahibi 'owner' olsun)
        mockPYUSD = new MockPYUSD(owner);
        
        // 3. Subscription kontratını deploy et
        subscription = new PYUSDSubscription(
            address(mockPYUSD), // _pyusdAddress
            SUBSCRIPTION_FEE,   // _fee
            THIRTY_DAYS,        // _period
            owner               // _initialOwner
        );

        // --- DÜZELTME BURADA ---
        // 4. 'user1'e test için 1000 mPYUSD gönder (Hâlâ 'owner' olarak)
        mockPYUSD.mint(user1, MINT_AMOUNT);
        // -----------------------

        // 5. 'owner' olarak işlemi bitir
        vm.stopPrank();
    }

    // --- GÖREV 7: BAŞARILI AKIŞ TESTİ ---
    
    /**
     * @dev Kullanıcının 'approve' ve 'subscribe' ile başarılı olmasını test eder
     */
    function test_Success_ApproveAndSubscribe() public {
        // 1. ADIM: user1 olarak işlem yap
        vm.startPrank(user1);

        // 2. ADIM: Approve (Onay)
        // user1, 'subscription' kontratına 'SUBSCRIPTION_FEE' kadar harcama izni verir
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);

        // 3. ADIM: Subscribe (Abone Ol)
        subscription.subscribe();
        
        // 4. user1 olarak işlemi bitir
        vm.stopPrank();

        // 5. KONTROL:
        // 'user1'in aboneliği aktif mi?
        bool isActive = subscription.isSubscriberActive(user1);
        
        // Sonucu onayla (isActive == true olmalı)
        assertEq(isActive, true, "Abonelik aktif olmaliydi");
    }

    /**
     * @dev Abonelik bitiş tarihinin doğru ayarlanıp ayarlanmadığını test eder
     */
    function test_Success_CheckExpirationTime() public {
        // Şu anki zamanı 1000. saniye olarak ayarla (testi kolaylaştırmak için)
        uint256 startTime = 1000;
        vm.warp(startTime);

        // 'user1' olarak abone ol
        vm.startPrank(user1);
        mockPYUSD.approve(address(subscription), SUBSCRIPTION_FEE);
        subscription.subscribe();
        vm.stopPrank();

        // KONTROL:
        // 'user1'in abonelik bitiş tarihini al
        uint256 expiresAt = subscription.subscriberExpiresAt(user1);
        
        // Beklenen bitiş tarihi = başlangıç zamanı + 30 gün
        uint256 expectedExpiresAt = startTime + THIRTY_DAYS;
        
        // Sonucu onayla
        assertEq(expiresAt, expectedExpiresAt, "Bitis zamani yanlis hesaplandi");
    }
}