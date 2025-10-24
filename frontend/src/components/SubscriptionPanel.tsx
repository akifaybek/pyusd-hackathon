import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"; // <-- Gerekli tüm wagmi hook'ları
import { formatUnits, parseUnits } from "viem"; // <-- parseUnits eklendi (kullanmasak da import edelim)

// 1. GERÇEK ABI ve (Kısmen Gerçek/Logdan Alınan) Adreslerimizi import et
import { 
  SUBSCRIPTION_ABI, 
  SUBSCRIPTION_CONTRACT_ADDRESS, 
  PYUSD_ABI, 
  PYUSD_TOKEN_ADDRESS 
} from "../constants"; 

export function SubscriptionPanel() {
  // --- 1. KULLANICI BİLGİSİ ---
  const { address: userAddress, isConnected } = useAccount();

  // --- 2. KONTRATLARDAN OKUMA (READ HOOKS) ---

  // A. Kullanıcı aktif abone mi?
  const { data: isActive, isLoading: isLoadingStatus, error: errorStatus, refetch: refetchIsActive } = useReadContract({
    address: SUBSCRIPTION_CONTRACT_ADDRESS,
    abi: SUBSCRIPTION_ABI,
    functionName: "isSubscriberActive",
    args: [userAddress!], 
    query: { enabled: isConnected }
  });

  // B. Kullanıcının PYUSD Bakiyesi
  const { data: pyusdBalance, isLoading: isLoadingBalance, error: errorBalance } = useReadContract({
    address: PYUSD_TOKEN_ADDRESS, 
    abi: PYUSD_ABI,
    functionName: "balanceOf",
    args: [userAddress!],
    query: { enabled: isConnected }
  });

  // C. Abonelik ücreti ne kadar? (YENİ EKLENDİ)
  const { data: fee, isLoading: isLoadingFee, error: errorFee } = useReadContract({
    address: SUBSCRIPTION_CONTRACT_ADDRESS,
    abi: SUBSCRIPTION_ABI,
    functionName: "subscriptionFee",
    query: { enabled: isConnected }
  });

  // D. Kullanıcı ne kadar onay (allowance) vermiş? (YENİ EKLENDİ)
  const { data: allowance, isLoading: isLoadingAllowance, error: errorAllowance, refetch: refetchAllowance } = useReadContract({
    address: PYUSD_TOKEN_ADDRESS,
    abi: PYUSD_ABI,
    functionName: "allowance",
    args: [userAddress!, SUBSCRIPTION_CONTRACT_ADDRESS],
    query: { enabled: isConnected && fee !== undefined } // Sadece cüzdan bağlıysa ve ücreti biliyorsak çalıştır
  });

  // --- 3. KONTRATLARA YAZMA (WRITE HOOKS) --- (YENİ EKLENDİ)

  // Approve işlemi için hazırlık
  const { data: approveHash, isPending: isApprovePending, writeContract: approve } = useWriteContract();

  // Subscribe işlemi için hazırlık
  const { data: subscribeHash, isPending: isSubscribePending, writeContract: subscribe } = useWriteContract();

  // --- 4. İŞLEM ONAYI İZLEME (RECEIPT HOOKS) --- (YENİ EKLENDİ)

  // Approve işleminin onaylanmasını izle
  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({ 
    hash: approveHash, 
    onSuccess: (data) => { 
        console.log("Approve işlemi onaylandı:", data);
        refetchAllowance(); // Onay miktarını hemen güncelle
    }
  });

  // Subscribe işleminin onaylanmasını izle
  const { isLoading: isSubscribeConfirming } = useWaitForTransactionReceipt({ 
    hash: subscribeHash, 
    onSuccess: (data) => { 
        console.log("Subscribe işlemi onaylandı:", data);
        refetchIsActive(); // Abonelik durumunu hemen güncelle
    }
  });

  // --- 5. BUTON TIKLAMA FONKSİYONLARI --- (YENİ EKLENDİ)

  const handleApprove = () => {
    if (!fee) return; // Ücret belli değilse yapma
    approve({ // wagmi'nin approve fonksiyonunu çağır
      address: PYUSD_TOKEN_ADDRESS,
      abi: PYUSD_ABI,
      functionName: "approve",
      args: [SUBSCRIPTION_CONTRACT_ADDRESS, fee] // Kime, Ne kadar
    });
  };

  const handleSubscribe = () => {
    subscribe({ // wagmi'nin subscribe fonksiyonunu çağır
      address: SUBSCRIPTION_CONTRACT_ADDRESS,
      abi: SUBSCRIPTION_ABI,
      functionName: "subscribe",
      args: [] // Argümanı yok
    });
  };


  // --- 6. ARAYÜZ (JSX) ---

  // Cüzdan bağlı değilse bir şey gösterme
  if (!isConnected) {
    return null; 
  }

  // Herhangi bir veri yükleniyorsa...
  if (isLoadingStatus || isLoadingBalance || isLoadingFee || isLoadingAllowance) {
    return <p>Kullanıcı verileri Sepolia ağından yükleniyor...</p>;
  }

  // Herhangi bir okuma hatası olduysa (adres yanlışsa vs.)
  // Not: fee ve allowance undefined ise de hata kabul ediyoruz
  const hasReadError = errorStatus || errorBalance || errorFee || errorAllowance || fee === undefined || allowance === undefined;
  if (hasReadError) { 
    console.error("Kontrat okuma hatası:", errorStatus, errorBalance, errorFee, errorAllowance);
    return (
        <div style={{ border: '1px solid red', padding: '10px', borderRadius: '8px', color: 'red' }}>
            <h4>Hata!</h4>
            <p>Kontrat verileri okunamadı. Adresler yanlış olabilir veya Sepolia ağında bir sorun olabilir.</p>
            <p>Lütfen cüzdanınızın Sepolia ağında olduğundan emin olun.</p>
        </div>
    );
  }

  // --- BURADAN SONRASI VERİLER BAŞARIYLA OKUNDU DEMEK ---

  // Onay yeterli mi? (fee ve allowance artık undefined olamaz)
  const hasApprovedEnough = allowance >= fee;

  // Görev B4: Eğer kullanıcı zaten aktifse, sadece tebrik mesajı göster
  if (isActive) {
    return (
      <div style={{ border: '1px solid green', padding: '20px', borderRadius: '8px', color: 'green' }}>
        <h3>TEBRİKLER! ABONELİĞİNİZ AKTİF.</h3>
        <p>Token-Gated (Abonelik Korumalı) İçerik Açıldı!</p>
      </div>
    );
  }

  // Aktif değilse, onay ve abonelik adımlarını göster
  return (
    <div style={{ border: '1px solid #333', padding: '20px', borderRadius: '8px' }}>
      <h4>Panel</h4>

      <p>Abonelik Durumu: <strong style={{ color: 'red' }}>AKTİF DEĞİL</strong></p>

      <p>
        Cüzdandaki (Mock)PYUSD Bakiyesi: 
        <strong>
          {pyusdBalance !== undefined ? ` ${formatUnits(pyusdBalance, 6)} PYUSD` : "0 PYUSD"}
        </strong>
      </p>

      <hr style={{ margin: '20px 0' }} /> 

      <h3>Abonelik Adımları</h3>

      <p>Abonelik Ücreti: <strong>{formatUnits(fee, 6)} PYUSD</strong></p>

      <p>Verilen Onay: <strong>{formatUnits(allowance, 6)} PYUSD</strong></p>

      {/* Adım 1: Approve Butonu */}
      <button 
        onClick={handleApprove}
        disabled={hasApprovedEnough || isApprovePending || isApproveConfirming}
      >
        {isApprovePending ? "Cüzdanda İmza Bekleniyor..." : 
         isApproveConfirming ? "İşlem Onaylanıyor..." : 
         "1. Adım: PYUSD Harcama Onayı Ver"}
      </button>

      {/* Adım 2: Subscribe Butonu */}
      <button 
        onClick={handleSubscribe}
        disabled={!hasApprovedEnough || isSubscribePending || isSubscribeConfirming}
        style={{ marginLeft: '10px' }}
      >
        {isSubscribePending ? "Cüzdanda İmza Bekleniyor..." :
         isSubscribeConfirming ? "İşlem Onaylanıyor..." :
         "2. Adım: Abone Ol"}
      </button>

      {/* İşlem Sürerken Kullanıcıya Bilgi Verme (UX) */}
      {(isApprovePending || isApproveConfirming || isSubscribePending || isSubscribeConfirming) &&
        <p style={{marginTop: "10px", color: "orange", fontWeight: "bold"}}>
            Lütfen cüzdanınızdaki işlemi onaylayın ve işlemin Sepolia ağında onaylanmasını bekleyin...
        </p>
      }
    </div>
  );
}