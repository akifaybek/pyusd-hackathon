// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin'in standart ERC20 arayüzünü (interface) import ediyoruz.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Kontrat sahibini (owner) yönetecek yardımcı import.
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PYUSDSubscription
 * @dev Kullanıcıların PYUSD kullanarak "token-gated" bir hizmete 
 * abone olmasını sağlayan kontrat.
 */
contract PYUSDSubscription is Ownable {

    // --- State Değişkenleri ---

    IERC20 public immutable pyusdToken;
    uint256 public immutable subscriptionFee;
    uint256 public immutable subscriptionPeriod;
    mapping(address => uint256) public subscriberExpiresAt;


    // --- Event (Olay) ---
    /**
     * @dev Bir abonelik (yeni veya yenileme) başarılı olduğunda
     * tetiklenir.
     */
    event SubscriptionUpdated(address indexed user, uint256 expiresAt);


    // --- Constructor ---

    constructor(
        address _pyusdAddress,
        uint256 _fee,
        uint256 _period,
        address _initialOwner
    ) Ownable(_initialOwner) {
        require(_pyusdAddress != address(0), "PYUSD adresi sifir olamaz");
        require(_fee > 0, "Ucret sifirdan buyuk olmali");
        require(_period > 0, "Sure sifirdan buyuk olmali");
        
        pyusdToken = IERC20(_pyusdAddress);
        subscriptionFee = _fee;
        subscriptionPeriod = _period;
    }


    // --- DÜZELTİLMİŞ VE EKLENMİŞ KISIM ---

    /**
     * @dev Kullanıcının (msg.sender) aboneliğini başlatır veya yeniler.
     * DİKKAT: Solidity testinden (Subscription.t.sol)
     * çağrılabilmesi için 'external' yerine 'public' olmalıdır.
     */
    // '@title' etiketi fonksiyonlar için geçerli olmadığından kaldırıldı.
    function subscribe() public { // <-- 'external' yerine 'public' olarak düzeltildi
        address user = msg.sender;

        // 1. Onay Kontrolü: Kullanıcı bu kontrata yeterli harcama izni verdi mi?
        uint256 allowance = pyusdToken.allowance(user, address(this));
        require(allowance >= subscriptionFee, "PYUSD onayi yetersiz");

        // 2. Token Transferi ("Pull" Mantığı):
        bool sent = pyusdToken.transferFrom(user, address(this), subscriptionFee);
        require(sent, "PYUSD transferi basarisiz");

        // 3. Abonelik Süresini Ayarla (Yenileme Mantığı Dahil):
        uint256 currentExpiration = subscriberExpiresAt[user];
        uint256 newExpiration;

        if (currentExpiration > block.timestamp) {
            // Aktif abonelik (Yenileme)
            newExpiration = currentExpiration + subscriptionPeriod;
        } else {
            // Yeni veya süresi dolmuş abonelik
            newExpiration = block.timestamp + subscriptionPeriod;
        }
        
        subscriberExpiresAt[user] = newExpiration;

        // 4. Olayı Yayınla:
        emit SubscriptionUpdated(user, newExpiration);
    }

    /**
     * @dev Belirtilen adresin aboneliğinin aktif olup olmadığını kontrol eder.
     * Test kontratının (Subscription.t.sol) buna erişebilmesi gerekir.
     */
    // '@title' etiketi fonksiyonlar için geçerli olmadığından kaldırıldı.
    function isSubscriberActive(address _subscriber) public view returns (bool) {
        // Kullanıcının abonelik bitiş tarihi, şu anki blok zamanından
        // büyükse, aboneliği aktiftir.
        return subscriberExpiresAt[_subscriber] > block.timestamp;
    }
    
}