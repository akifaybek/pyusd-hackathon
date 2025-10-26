import './App.css';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';
import { SubscriptionPanel } from './components/SubscriptionPanel'; 

function App() {
  const { isConnected } = useAccount();

  return (
    <div className="app-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="logo-container">
            {/* TODO: Replace with your P$ logo */}
            <div className="logo-placeholder">P$</div>
          </div>
          <h1 className="hero-title">PYUSD Pay-as-you-Go Protocol</h1>
          <p className="hero-subtitle">Fair, Transparent, User-Controlled Subscriptions</p>
          <div className="connect-button-wrapper">
            <ConnectKitButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {isConnected ? (
            <SubscriptionPanel /> 
          ) : (
            <div className="welcome-card">
              <h2>🚀 Welcome to the Future of Subscriptions</h2>
              <p>Connect your wallet to get started with token-gated subscriptions on Sepolia testnet.</p>
              <ul className="features-list">
                <li>✅ Pay only for what you use</li>
                <li>✅ Full transparency on blockchain</li>
                <li>✅ User-controlled payments</li>
                <li>✅ No hidden fees</li>
              </ul>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Built with 💙 for ETHGlobal Hackathon</p>
        <p className="footer-tech">Powered by PYUSD • Sepolia Testnet</p>
      </footer>
    </div>
  );
}

export default App;