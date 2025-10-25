import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// --- GEREKLİ KÜTÜPHANELERİ İÇERİ AKTARMA ---

// 1. Wagmi (Viem üzerine kurulu)
import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains' // Akif'in testnet'i (Sepolia)

// 2. ConnectKit (Güzel "Cüzdan Bağla" butonu)
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

// 3. React-Query (Wagmi'nin "beyni", dünkü hatayı önler)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 4. React Router (Sayfa Yönlendirme) --- YENİ EKLENDİ ---
import { BrowserRouter } from "react-router-dom";

// --- KURULUM BAŞLANGIÇ ---

// 1. React-Query için bir "client" (istemci) oluştur
const queryClient = new QueryClient();

// 2. Wagmi/ConnectKit konfigürasyonunu (ayarını) oluştur
const config = createConfig(
  getDefaultConfig({
    appName: "PYUSD Stream Protocol (Hackathon)", 
    chains: [sepolia], 
    walletConnectProjectId: "a8024e8262cb4e710294470773f83d33", // Demo ID
    transports: {
      [sepolia.id]: http()
    },
  }),
);

// --- UYGULAMAYI SARMALAMA (ÇOK ÖNEMLİ) ---
// Projemizin her yerinden bu kütüphanelere erişebilmek için
// <App /> bileşenimizi doğru sırayla "sarmalıyoruz".
ReactDOM.createRoot(document.getElementById('root')!).render(
  // Adım 1 (En Dış): Sayfa Yönlendirici --- YENİ EKLENDİ ---
  <BrowserRouter> 
    {/* Adım 2: React Query (Beyin) */}
    <QueryClientProvider client={queryClient}>
      {/* Adım 3: Wagmi (Mantık) */}
      <WagmiProvider config={config}>
        {/* Adım 4: ConnectKit (Butonlar/Arayüz) */}
        <ConnectKitProvider>
          <React.StrictMode>
            <App /> {/* App bileşeni artık sayfa yönlendirmesini yönetecek */}
          </React.StrictMode>
        </ConnectKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </BrowserRouter>, // --- KAPATMA ETİKETİ EKLENDİ ---
)