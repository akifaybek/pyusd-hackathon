// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPYUSD
 * @dev Bu kontrat, ETHGlobal Hackathon'da test amacıyla PYUSD'yi taklit eder.
 * ÖNEMLİ: Gerçek PYUSD 6 ondalık basamağa (decimals) sahiptir.
 * Bu mock token da bu özelliğe uymalıdır.
 */
contract MockPYUSD is ERC20, Ownable {
    
    /**
     * @dev Kontratı deploy eden kişiyi "owner" yapar ve token'a
     * "Mock PayPal USD" adını, "mPYUSD" sembolünü verir.
     */
    constructor(address initialOwner) ERC20("Mock PayPal USD", "mPYUSD") Ownable(initialOwner) {
        // Test kolaylığı için kontratı deploy eden kişiye
        // 1,000,000 mPYUSD mint'leyelim (6 ondalık basamakla).
        // 1_000_000 * (10 ** 6) = 1_000_000_000_000
        _mint(msg.sender, 1_000_000 * (10 ** decimals()));
    }

    /**
     * @dev Gerçek PYUSD'nin 6 ondalık basamağı vardır.
     * OpenZeppelin'in varsayılanı 18'dir, bu yüzden bunu eziyoruz (override).
     * Bu, ücret hesaplamalarında kritik öneme sahip.
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev Testler sırasında kolayca token mint'leyebilmek için
     * (Sadece owner tarafından çağrılabilir).
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}