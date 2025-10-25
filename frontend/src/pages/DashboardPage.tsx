import { useAccount } from "wagmi";
import { SubscriptionPanel } from "../components/SubscriptionPanel"; 

function DashboardPage() {
  const { isConnected } = useAccount(); 

  return (
    // Sayfa içeriğini sarmalayan main etiketi App.tsx içinde
    // Bu div paneli ortalamak için eklendi
    <div className="panel-container"> 
      <h2>Abonelik Kontrol Paneli</h2>

      {isConnected ? (
        <SubscriptionPanel /> 
      ) : (
        <p style={{ color: 'orange', fontWeight: 'bold', textAlign: 'center' }}>
          Abonelik durumunuzu ve işlemlerinizi yönetmek için lütfen sağ üst köşeden cüzdanınızı bağlayın.
        </p>
      )}
    </div>
  );
}

export default DashboardPage;