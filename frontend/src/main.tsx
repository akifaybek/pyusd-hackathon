import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// --- GEREKLİ KÜTÜPHANELERİ İÇERİ AKTARMA ---

// 1. Wagmi (Viem üzerine kurulu)
import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains' // Akif'in testnet'i (büyük ihtimalle Sepolia)

// 2. ConnectKit (Güzel "Cüzdan Bağla" butonu)
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

// 3. React-Query (Wagmi'nin "beyni", dünkü hatayı önler)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- KURULUM BAŞLANGIÇ ---

// 1. React-Query için bir "client" (istemci) oluştur
const queryClient = new QueryClient();

// 2. Wagmi/ConnectKit konfigürasyonunu (ayarını) oluştur
const config = createConfig(
  getDefaultConfig({
    // Jüriye göstereceğimiz projemizin adı
    appName: "PYUSD Stream Protocol (Hackathon)", 

    // Akif'in deploy ettiği ağı buraya ekliyoruz (Sepolia olduğunu varsaydık)
    chains: [sepolia], 

    // MetaMask dışındaki cüzdanlar (Trust Wallet vb.) için gereklidir.
    // https://walletconnect.com/ adresinden ücretsiz bir "Project ID" alıp
    // tırnak işaretlerinin arasına yapıştırmamız GEREKECEK.
    // Şimdilik test için "demo" bir ID kullanabiliriz.
    walletConnectProjectId: "a8024e8262cb4e710294470773f83d33", 

    // Ağlarla nasıl konuşacağımızı belirtir (Viem'i kullanır)
    transports: {
      [sepolia.id]: http()
    },
  }),
);

// --- UYGULAMAYI SARMALAMA (ÇOK ÖNEMLİ) ---
// Projemizin her yerinden bu kütüphanelere erişebilmek için
// <App /> bileşenimizi doğru sırayla "sarmalıyoruz".
ReactDOM.createRoot(document.getElementById('root')!).render(
  // 1. Adım (En Dış): React Query (Beyin)
  <QueryClientProvider client={queryClient}>
    {/* 2. Adım (Orta): Wagmi (Mantık) */}
    <WagmiProvider config={config}>
      {/* 3. Adım (İç): ConnectKit (Butonlar/Arayüz) */}
      <ConnectKitProvider>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </ConnectKitProvider>
    </WagmiProvider>
  </QueryClientProvider>,
)