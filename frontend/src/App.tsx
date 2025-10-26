import './App.css';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi'; // useAccount hook'unu alalım
import { SubscriptionPanel } from './components/SubscriptionPanel'; 

function App() {
  const { isConnected } = useAccount(); // Cüzdan bağlı mı kontrolü

  return (
    <div className="container">
      <header>
        <h1>PYUSD Pay-as-you-Go Protocol</h1>
        <ConnectKitButton />
      </header>

      <main>
        {/* KRİTİK KISIM: Bağlıysa Paneli Göster */}
        {isConnected ? (
          <SubscriptionPanel /> 
        ) : (
          <p className="info-message">Please connect your wallet (Sepolia Network).</p>
        )}
      </main>
    </div>
  );
}

export default App;