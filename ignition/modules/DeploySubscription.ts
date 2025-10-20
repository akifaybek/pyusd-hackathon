import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// --- DEPLOY AYARLARI ---
// Bu değerleri buradan kolayca değiştirebiliriz.

// 30 gün saniye cinsinden: 30 gün * 24 saat * 60 dk * 60 sn
const THIRTY_DAYS_IN_SECS = 30 * 24 * 60 * 60;

// Abonelik ücreti: 10 PYUSD
// DİKKAT: PYUSD 6 ondalık basamaklı.
// 10 * (10 ** 6) = 10,000,000
// 'n' harfi bu sayının BigInt olduğunu belirtir, bu yeni standarttır.
const SUBSCRIPTION_FEE = 10_000_000n; 

// --- DEPLOY MODÜLÜ ---

export default buildModule("DeploySubscriptionModule", (m) => {
  // 1. Deployer (kontratı dağıtan) cüzdanın adresini al
  const deployer = m.getAccount(0);

  // 2. Önce MockPYUSD kontratını deploy et
  // Constructor'ına 'deployer' adresini 'initialOwner' olarak veriyoruz.
  const mockPYUSD = m.contract("MockPYUSD", [deployer]);

  // 3. Sonra PYUSDSubscription kontratını deploy et
  // Constructor'ına (kurucu fonksiyonuna) gereken 4 argümanı sırayla veriyoruz:
  const subscription = m.contract("PYUSDSubscription", [
    mockPYUSD, // 1. _pyusdAddress (Ignition, mockPYUSD deploy olunca adresi buraya kendi koyar)
    SUBSCRIPTION_FEE, // 2. _fee
    BigInt(THIRTY_DAYS_IN_SECS), // 3. _period
    deployer, // 4. _initialOwner
  ]);

  // 4. Test ve frontend'de kullanmak üzere bu kontratların bilgilerini döndür
  return { mockPYUSD, subscription };
});