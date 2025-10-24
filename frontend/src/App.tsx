import { ConnectKitButton } from "connectkit";
import './App.css';
import { useAccount } from "wagmi"; // 1. Cüzdan durumunu kontrol etmek için import et
import { SubscriptionPanel } from "./components/SubscriptionPanel"; // 2. Yeni panelimizi import et

function App() {
  // 3. Cüzdan bağlı mı diye canlı olarak kontrol et
  const { isConnected } = useAccount();

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px' }}>
        <ConnectKitButton />
      </header>

      <main style={{ padding: '20px', textAlign: 'center' }}>
        <h1>PYUSD "Kullandıkça Öde" Protokolü</h1>

        <div style={{ marginTop: '50px' }}>
          <h2>Abonelik Kontrol Paneli</h2>

          {/* 4. SİHİRLİ KISIM:
            Eğer cüzdan bağlıysa (isConnected == true) paneli göster,
            değilse "Lütfen cüzdanınızı bağlayın" mesajını göster.
          */}
          {isConnected ? (
            <SubscriptionPanel /> 
          ) : (
            <p>Abonelik durumunuzu ve PYUSD bakiyenizi görmek için lütfen cüzdanınızı bağlayın.</p>
          )}

        </div>
      </main>
    </>
  )
}

export default App