import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, type Address, type Abi } from "viem";
import toast from 'react-hot-toast'; 

// Import ABIs and Addresses
import { 
  SUBSCRIPTION_ABI, 
  SUBSCRIPTION_CONTRACT_ADDRESS, 
  PYUSD_ABI, 
  PYUSD_TOKEN_ADDRESS,
  PYUSD_DECIMALS 
} from "../constants"; 

// --- BÖLÜM 1: ANA BİLEŞEN (BAĞLANTI VE ADRES KONTROLÜ) ---
// Bu, 'args: [userAddress]' kırmızı çizgi hatasını çözer.

export function SubscriptionPanel() {
  const { address: userAddress, isConnected } = useAccount();

  // --- MERKEZİ ADRES KONTROLÜ ---
  const isSubscriptionContractReady = !!SUBSCRIPTION_CONTRACT_ADDRESS && SUBSCRIPTION_CONTRACT_ADDRESS.startsWith('0x');
  const isPYUSDTokenReady = !!PYUSD_TOKEN_ADDRESS && PYUSD_TOKEN_ADDRESS.startsWith('0x');

  // 1. Cüzdan bağlı değilse
  if (!isConnected) {
    return (
      <div className="subscription-panel">
        <p>Lütfen cüzdanınızı Sepolia ağına bağlayın.</p>
      </div>
    );
  }

  // 2. constants.ts dosyasındaki adresler eksik veya hatalıysa
  if (!isSubscriptionContractReady || !isPYUSDTokenReady) {
    console.error("Configuration Error: Contract addresses in constants.ts are invalid or missing.");
    return (
        <div className="error-panel"> 
            <h4>Yapılandırma Hatası!</h4>
            <p>Kontrat adresleri okunamadı. Lütfen `constants.ts` dosyasını kontrol edin.</p>
        </div>
    );
  }

  // 3. Cüzdan adresi henüz yüklenmediyse ("boş ekran" veya "abone ol çıkmıyor" hatası)
  if (!userAddress) {
    return <p>Kullanıcı verileri yükleniyor...</p>; 
  }

  // --- KONTROLLER BAŞARILI ---
  // Artık TÜM 3 adresin de (user, token, subscription) geçerli 'Address' tipinde
  // olduğunu biliyoruz. Bunları iç bileşene güvenle gönderebiliriz.
  
  return (
    <SubscriptionPanelInternal 
      userAddress={userAddress}
      subContractAddress={SUBSCRIPTION_CONTRACT_ADDRESS as Address}
      tokenAddress={PYUSD_TOKEN_ADDRESS as Address}
    />
  );
}


// --- BÖLÜM 2: İÇ BİLEŞEN (TÜM İŞ MANTIĞI) ---
// Bu bileşen, SADECE 3 adres de geçerliyse çağrılır.

interface SubscriptionPanelInternalProps {
  userAddress: Address;
  subContractAddress: Address;
  tokenAddress: Address;
}

function SubscriptionPanelInternal({ 
  userAddress, 
  subContractAddress, 
  tokenAddress 
}: SubscriptionPanelInternalProps) {

  // --- 2. Read Data from Contracts (Read Hooks) ---
  
  // HATA ÇÖZÜLDÜ: 'Wagmi v2'de 'query: {}' YOKTUR.
  // 'Boş Ekran' hatasının nedeni buydu.
  // 'ABI'yi de güncellediğin için bu hook'lar artık çalışacak.
  
  const { data: isActive, isLoading: isLoadingStatus, error: errorStatus, refetch: refetchIsActive } = useReadContract({
    address: subContractAddress, 
    abi: SUBSCRIPTION_ABI as Abi,
    functionName: "isSubscriberActive",
    args: [userAddress], // 'Split component' sayesinde artık GÜVENLİ
  });

  const { data: pyusdBalance, isLoading: isLoadingBalance, error: errorBalance } = useReadContract({
    address: tokenAddress, 
    abi: PYUSD_ABI as Abi,
    functionName: "balanceOf",
    args: [userAddress], // GÜVENLİ
  });

  const { data: contractFee, isLoading: isLoadingFee, error: errorFee } = useReadContract({
    address: subContractAddress, 
    abi: SUBSCRIPTION_ABI as Abi,
    functionName: "subscriptionFee", // ABI'yi düzelttiğin için bu artık çalışacak
    args: [],
  });

  const { data: allowance, isLoading: isLoadingAllowance, error: errorAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress, 
    abi: PYUSD_ABI as Abi,
    functionName: "allowance",
    args: [userAddress, subContractAddress], // GÜVENLİ
  });

  // --- 3. Write Transactions to Contracts (Write Hooks) ---
  const { data: approveHash, isPending: isApprovePending, writeContract: approve } = useWriteContract();
  const { data: subscribeHash, isPending: isPendingSubscribe, writeContract: subscribe } = useWriteContract();

  // --- 4. Monitor Transaction Confirmation (Receipt Hooks) ---
  
  // HATA ÇÖZÜLDÜ: 'wagmi v2' SÖZ DİZİMİ BUDUR.
  // 'enabled', 'onSuccess' ve 'onError' düz (flat) yazılır.
  // O "9+ hata" buradaydı.
  
  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({ 
    hash: approveHash, 
    enabled: !!approveHash, // Sadece hash varsa çalış
    onSuccess: (_data) => { 
        toast.success('Onay (Approve) işlemi başarılı! Artık abone olabilirsiniz.');
        refetchAllowance(); 
    },
    onError: (error: Error) => { 
        toast.error(`Onay işlemi hatası: ${error.message.substring(0, 50)}...`);
    }
  });
  
  const { isLoading: isSubscribeConfirming } = useWaitForTransactionReceipt({ 
    hash: subscribeHash, 
    enabled: !!subscribeHash,
    onSuccess: (_data) => { 
        toast.success('Tebrikler! Aboneliğiniz başarıyla aktifleşti!');
        refetchIsActive(); 
    },
    onError: (error: Error) => { 
        toast.error(`Abonelik işlemi hatası: ${error.message.substring(0, 50)}...`);
    }
  });

  // --- 5. Button Click Handlers ---
  const handleApprove = () => {
    if (typeof contractFee !== 'bigint') return; 
    approve({
      address: tokenAddress,
      abi: PYUSD_ABI as Abi,
      functionName: "approve",
      args: [subContractAddress, contractFee] 
    });
  };

  const handleSubscribe = async () => {
    try {
      subscribe({
        address: subContractAddress,
        abi: SUBSCRIPTION_ABI as Abi,
        functionName: "subscribe",
        args: [],
      });
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Abonelik işlemi başarısız oldu!");
    }
  };

  // --- 6. Render UI (JSX) ---
  
  const isLoading = isLoadingStatus || isLoadingBalance || isLoadingFee || isLoadingAllowance;
  if (isLoading) {
    return <p>Sepolia ağından kullanıcı verileri yükleniyor...</p>;
  }

  // "Kontrat okunamadı" hatasını aldığın yer burasıydı.
  // ABI'yi düzelttiğin VE 'wagmi v2' söz dizimini DOĞRU kullandığımız için,
  // bu hata artık GİTMELİ.
  const hasReadError = errorStatus || errorBalance || errorFee || errorAllowance;
  if (hasReadError || typeof contractFee !== 'bigint' || typeof allowance !== 'bigint') { 
    console.error("HATA! Kontrat verileri okunamadı (v2 Düzeltmesi):");
    console.error("Status Error:", errorStatus);
    console.error("Balance Error:", errorBalance);
    console.error("Fee Error:", errorFee);
    console.error("Allowance Error:", errorAllowance);
    console.error("User Address:", userAddress);
    console.error("Subscription Contract:", subContractAddress);
    console.error("Token Contract:", tokenAddress);
    console.error("Contract Fee type:", typeof contractFee, contractFee);
    console.error("Allowance type:", typeof allowance, allowance);
    
    return (
        <div className="error-panel"> 
            <h4>Hata!</h4>
            <p>Kontrat verileri okunamadı. Lütfen konsolu (F12) kontrol edin.</p>
            <details style={{ marginTop: '10px', fontSize: '0.85em' }}>
              <summary>Hata Detayları</summary>
              <pre style={{ textAlign: 'left', overflow: 'auto', padding: '10px', background: '#f5f5f5' }}>
                {JSON.stringify({
                  hasStatusError: !!errorStatus,
                  hasBalanceError: !!errorBalance,
                  hasFeeError: !!errorFee,
                  hasAllowanceError: !!errorAllowance,
                  contractFeeType: typeof contractFee,
                  allowanceType: typeof allowance,
                  subContract: subContractAddress,
                  tokenContract: tokenAddress
                }, null, 2)}
              </pre>
            </details>
        </div>
    );
  }
  
  // --- VERİ BAŞARIYLA YÜKLENDİ - "abone ol" KISMI ARTIK GÖRÜNMELİ ---
  const hasApprovedEnough = allowance >= contractFee;
  const hasSufficientBalance = (typeof pyusdBalance === 'bigint') && (pyusdBalance >= contractFee);

  // Aktif Abonelik Durumu
  if (isActive) {
    return (
      <div className="subscription-panel success-panel">
        <h3>Tebrikler! Aboneliğiniz Aktif.</h3>
        <p>Token'la Korunan İçeriğe Erişiminiz Var!</p>
        <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
          Aboneliğiniz otomatik olarak süre bitiminde sona erecektir.
        </p>
      </div>
    );
  }

  // Aktif Olmayan Abonelik Durumu
  return (
    <div className="subscription-panel"> 
      <h4>Kontrol Paneli</h4>
      
      <p>Abonelik Durumu: <strong style={{ color: 'red' }}>AKTİF DEĞİL</strong></p>
      
      {typeof pyusdBalance === 'bigint' && !hasSufficientBalance && (
             <div className="warning-box" style={{ padding: '10px', backgroundColor: '#fee7a0', border: '1px solid #ffcc00', borderRadius: '4px', marginBottom: '15px' }}>
                 ❗ Yetersiz Bakiye: Abonelik için **{formatUnits(contractFee, PYUSD_DECIMALS)} PYUSD** gereklidir.
             </div>
        )}

      <p>
        Cüzdan PYUSD Bakiyesi: 
        <strong>
          {typeof pyusdBalance === 'bigint' ? ` ${formatUnits(pyusdBalance, PYUSD_DECIMALS)} PYUSD` : "N/A"}
        </strong>
      </p>

      <hr /> 

      <h3>Abonelik Adımları</h3>

      <p>Abonelik Ücreti: <strong>{formatUnits(contractFee, PYUSD_DECIMALS)} PYUSD</strong></p>
      <p>Tanınan İzin (Allowance): <strong>{formatUnits(allowance, PYUSD_DECIMALS)} PYUSD</strong></p>

      {/* Step 1: Approve Button */}
      <button 
        onClick={handleApprove}
        disabled={
           hasApprovedEnough || 
           isApprovePending || 
           isApproveConfirming || 
           !hasSufficientBalance 
        }
        className="button button-approve" 
      >
        {isApprovePending ? "1. İmza bekleniyor..." : 
         isApproveConfirming ? "1. Onaylanıyor..." : 
         "1. PYUSD Harcama İzni Ver"}
      </button>

      {/* Step 2: Subscribe Button */}
      <button 
        onClick={handleSubscribe}
        disabled={
            !hasApprovedEnough || 
            isPendingSubscribe || 
            isSubscribeConfirming || 
            !hasSufficientBalance
        }
        className="button button-subscribe" 
        style={{ marginLeft: '10px' }} 
      >
        {isPendingSubscribe ? "2. İmza bekleniyor..." :
         isSubscribeConfirming ? "2. Abonelik onaylanıyor..." :
         "2. Şimdi Abone Ol"}
      </button>

      {(isApprovePending || isApproveConfirming || isPendingSubscribe || isSubscribeConfirming) &&
        <p className="status-message pending"> 
            Lütfen işlemi cüzdanınızda onaylayın ve Sepolia ağında onaylanmasını bekleyin.
        </p>
      }
    </div>
  );
}