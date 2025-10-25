import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// --- SEPOLIA AYARLARI ---
const SEPOLIA_PYUSD_ADDRESS = "0x1c7d4B196CB0c7b01d743fBc6116a902379c7a08"; // Teyit ettiğimiz Sepolia PYUSD adresi

// --- KONTAT AYARLARI ---
// Bu değerler lokal ile aynı kalabilir
const THIRTY_DAYS_IN_SECS = 30 * 24 * 60 * 60;
const SUBSCRIPTION_FEE = 10_000_000n; // 10 PYUSD (6 decimals)

// --- DEPLOY MODÜLÜ (SEPOLIA İÇİN) ---
// Modül ID'sini Sepolia için daha açıklayıcı yapalım
export default buildModule("SepoliaDeploySubscription", (m) => {
  // 1. Deployer cüzdan adresini al (config'den gelen)
  const deployer = m.getAccount(0);

  // 2. MockPYUSD DEPLOY ETME! Bu satırı kaldırıyoruz.
  // const mockPYUSD = m.contract("MockPYUSD", [deployer]); // <-- BU SATIR SİLİNDİ

  // 3. Sadece PYUSDSubscription kontratını deploy et
  // Constructor'ına ilk argüman olarak Gerçek Sepolia PYUSD adresini veriyoruz:
  const subscription = m.contract("PYUSDSubscription", [
    SEPOLIA_PYUSD_ADDRESS,      // 1. _pyusdAddress (Mock yerine gerçek adres)
    SUBSCRIPTION_FEE,           // 2. _fee
    BigInt(THIRTY_DAYS_IN_SECS),// 3. _period
    deployer,                   // 4. _initialOwner
  ]);

  // 4. Sadece deploy edilen subscription kontratının bilgisini döndür
  return { subscription }; // mockPYUSD'yi kaldırdık
});