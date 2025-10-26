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

  // 1. Wallet not connected
  if (!isConnected) {
    return (
      <div className="subscription-panel">
        <p>Please connect your wallet to Sepolia network.</p>
      </div>
    );
  }

  // 2. Contract addresses missing or invalid in constants.ts
  if (!isSubscriptionContractReady || !isPYUSDTokenReady) {
    console.error("Configuration Error: Contract addresses in constants.ts are invalid or missing.");
    return (
        <div className="error-panel"> 
            <h4>Configuration Error!</h4>
            <p>Contract addresses could not be read. Please check `constants.ts` file.</p>
        </div>
    );
  }

  // 3. Wallet address not loaded yet
  if (!userAddress) {
    return <p>Loading user data...</p>; 
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
        toast.success('Approval successful! You can now subscribe.');
        refetchAllowance(); 
    },
    onError: (error: Error) => { 
        toast.error(`Approval error: ${error.message.substring(0, 50)}...`);
    }
  });
  
  const { isLoading: isSubscribeConfirming } = useWaitForTransactionReceipt({ 
    hash: subscribeHash, 
    enabled: !!subscribeHash,
    onSuccess: (_data) => { 
        toast.success('Congratulations! Your subscription is now active!');
        refetchIsActive(); 
    },
    onError: (error: Error) => { 
        toast.error(`Subscription error: ${error.message.substring(0, 50)}...`);
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
      toast.error("Subscription failed!");
    }
  };

  // --- 6. Render UI (JSX) ---
  
  const isLoading = isLoadingStatus || isLoadingBalance || isLoadingFee || isLoadingAllowance;
  if (isLoading) {
    return <p>Loading user data from Sepolia network...</p>;
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
            <h4>Error!</h4>
            <p>Contract data could not be read. Please check console (F12).</p>
            <details style={{ marginTop: '10px', fontSize: '0.85em' }}>
              <summary>Error Details</summary>
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

  // Active Subscription Status
  if (isActive) {
    return (
      <div className="subscription-panel success-panel">
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#6ee7b7' }}>
            Subscription Active!
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
            You now have full access to token-gated premium content
          </p>
          
          <div style={{ 
            display: 'inline-block',
            padding: '1rem 2rem',
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            border: '2px solid #10b981',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>Balance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6ee7b7' }}>
              {typeof pyusdBalance === 'bigint' ? formatUnits(pyusdBalance, PYUSD_DECIMALS) : "0"} PYUSD
            </div>
          </div>

          <p style={{ fontSize: '0.95rem', opacity: 0.7 }}>
            ℹ️ Your subscription will automatically expire at the end of the period
          </p>
        </div>
      </div>
    );
  }

  // Inactive Subscription Status
  return (
    <div className="subscription-panel"> 
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0 }}>💎 Subscription Dashboard</h3>
        <span style={{ 
          padding: '0.5rem 1rem', 
          background: 'rgba(239, 68, 68, 0.2)', 
          border: '2px solid #ef4444',
          borderRadius: '20px',
          color: '#fca5a5',
          fontWeight: '600',
          fontSize: '0.85rem'
        }}>
          ● NOT ACTIVE
        </span>
      </div>
      
      {typeof pyusdBalance === 'bigint' && !hasSufficientBalance && (
        <div className="warning-box">
          ⚠️ <strong>Insufficient Balance:</strong> You need {formatUnits(contractFee, PYUSD_DECIMALS)} PYUSD to subscribe.
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>Your Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#60a5fa' }}>
            {typeof pyusdBalance === 'bigint' ? formatUnits(pyusdBalance, PYUSD_DECIMALS) : "0"} PYUSD
          </div>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(99, 102, 241, 0.1)', 
          borderRadius: '16px',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>Subscription Fee</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#a5b4fc' }}>
            {formatUnits(contractFee, PYUSD_DECIMALS)} PYUSD
          </div>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          background: 'rgba(16, 185, 129, 0.1)', 
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>Approved Amount</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6ee7b7' }}>
            {formatUnits(allowance, PYUSD_DECIMALS)} PYUSD
          </div>
        </div>
      </div>

      <hr /> 

      <h4 style={{ marginBottom: '1.5rem' }}>🚀 Get Started in 2 Steps:</h4>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
          style={{ flex: 1, minWidth: '200px' }}
        >
          {isApprovePending ? "⏳ Waiting for signature..." : 
           isApproveConfirming ? "⏳ Confirming..." : 
           hasApprovedEnough ? "✅ Approved" :
           "1️⃣ Approve PYUSD"}
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
          style={{ flex: 1, minWidth: '200px' }}
        >
          {isPendingSubscribe ? "⏳ Waiting for signature..." :
           isSubscribeConfirming ? "⏳ Confirming..." :
           "2️⃣ Subscribe Now"}
        </button>
      </div>

      {(isApprovePending || isApproveConfirming || isPendingSubscribe || isSubscribeConfirming) &&
        <div className="status-message pending"> 
          ⏳ Please confirm the transaction in your wallet and wait for confirmation on Sepolia network.
        </div>
      }
    </div>
  );
}