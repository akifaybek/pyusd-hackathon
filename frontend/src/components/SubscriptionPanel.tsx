import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits } from "viem";

// GERÇEK ABI ve (Kısmen Gerçek/Logdan Alınan) Adreslerimizi import et
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
  const { data: isActive, isLoading: isLoadingStatus, error: errorStatus, refetch: refetchIsActive } = useReadContract({
    address: SUBSCRIPTION_CONTRACT_ADDRESS,
    abi: SUBSCRIPTION_ABI,
    functionName: "isSubscriberActive",
    args: [userAddress!], 
    query: { enabled: isConnected }
  });

  const { data: pyusdBalance, isLoading: isLoadingBalance, error: errorBalance } = useReadContract({
    address: PYUSD_TOKEN_ADDRESS, 
    abi: PYUSD_ABI,
    functionName: "balanceOf",
    args: [userAddress!],
    query: { enabled: isConnected }
  });

  const { data: fee, isLoading: isLoadingFee, error: errorFee } = useReadContract({
    address: SUBSCRIPTION_CONTRACT_ADDRESS,
    abi: SUBSCRIPTION_ABI,
    functionName: "subscriptionFee",
    query: { enabled: isConnected }
  });

  const { data: allowance, isLoading: isLoadingAllowance, error: errorAllowance, refetch: refetchAllowance } = useReadContract({
    address: PYUSD_TOKEN_ADDRESS,
    abi: PYUSD_ABI,
    functionName: "allowance",
    args: [userAddress!, SUBSCRIPTION_CONTRACT_ADDRESS],
    query: { enabled: isConnected && fee !== undefined } 
  });

  // --- 3. KONTRATLARA YAZMA (WRITE HOOKS) ---
  const { data: approveHash, isPending: isApprovePending, writeContract: approve } = useWriteContract();
  const { data: subscribeHash, isPending: isSubscribePending, writeContract: subscribe } = useWriteContract();

  // --- 4. İŞLEM ONAYI İZLEME (RECEIPT HOOKS) ---
  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({ 
    hash: approveHash, 
    onSuccess: (data) => { 
        console.log("Approve işlemi onaylandı:", data);
        refetchAllowance(); 
    }
  });
  
  const { isLoading: isSubscribeConfirming } = useWaitForTransactionReceipt({ 
    hash: subscribeHash, 
    onSuccess: (data) => { 
        console.log("Subscribe işlemi onaylandı:", data);
        refetchIsActive(); 
    }
  });

  // --- 5. BUTON TIKLAMA FONKSİYONLARI ---
  const handleApprove = () => {
    if (!fee) return;
    approve({
      address: PYUSD_TOKEN_ADDRESS,
      abi: PYUSD_ABI,
      functionName: "approve",
      args: [SUBSCRIPTION_CONTRACT_ADDRESS, fee] 
    });
  };

  const handleSubscribe = () => {
    subscribe({
      address: SUBSCRIPTION_CONTRACT_ADDRESS,
      abi: SUBSCRIPTION_ABI,
      functionName: "subscribe",
      args: [] 
    });
  };

  // --- 6. ARAYÜZ (JSX) ---
  if (!isConnected) { return null; }
  if (isLoadingStatus || isLoadingBalance || isLoadingFee || isLoadingAllowance) {
    return <p>Kullanıcı verileri Sepolia ağından yükleniyor...</p>;
  }

  const hasReadError = errorStatus || errorBalance || errorFee || errorAllowance || fee === undefined || allowance === undefined;
  if (hasReadError) { 
    console.error("Kontrat okuma hatası:", errorStatus, errorBalance, errorFee, errorAllowance);
    // Hata div'ine className ekle:
    return (
        <div className="error-panel"> 
            <h4>Hata!</h4>
            <p>Kontrat verileri okunamadı. Adresler yanlış olabilir veya Sepolia ağında bir sorun olabilir.</p>
            <p>Lütfen cüzdanınızın Sepolia ağında olduğundan emin olun.</p>
        </div>
    );
  }
  
  // --- BURADAN SONRASI VERİLER BAŞARIYLA OKUNDU DEMEK ---
  const hasApprovedEnough = allowance >= fee;

  // Görev B4: Eğer kullanıcı zaten aktifse, stilleri güncellenmiş mesajı göster
  if (isActive) {
    // Aktif durum div'ine className ve style ekle:
    return (
      <div className="subscription-panel" style={{ borderColor: 'green', backgroundColor: '#1a4d1a'}}>
        <h3 style={{color: '#90ee90'}}>TEBRİKLER! ABONELİĞİNİZ AKTİF.</h3>
        <p style={{color: '#c0f0c0'}}>Token-Gated (Abonelik Korumalı) İçerik Açıldı!</p>
      </div>
    );
  }

  // Aktif değilse, onay ve abonelik adımlarını gösteren paneli className ile göster
  return (
    <div className="subscription-panel"> 
      <h4>Panel</h4>
      
      <p>Abonelik Durumu: <strong style={{ color: 'red' }}>AKTİF DEĞİL</strong></p>
      
      <p>
        Cüzdandaki (Mock)PYUSD Bakiyesi: 
        <strong>
          {pyusdBalance !== undefined ? ` ${formatUnits(pyusdBalance, 6)} PYUSD` : "0 PYUSD"}
        </strong>
      </p>

      <hr /> 

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
        style={{ marginLeft: '10px' }} // Butonlar arası boşluk için stil
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