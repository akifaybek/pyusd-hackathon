import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Wagmi'den gerekli her şeyi tek bir yerden alıyoruz
import { WagmiProvider, createConfig, http } from 'wagmi' 
import { sepolia } from 'wagmi/chains' 
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from 'react-hot-toast'; // YENİ: Toast için gerekli

// --- KRİTİK: RPC VE AYARLAR ---

// Sepolia RPC URL'i - Birden fazla RPC deniyoruz
const SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com"; 

// 1. React-Query client
const queryClient = new QueryClient();

// 2. Wagmi/ConnectKit konfigürasyonunu (ayarını) oluştur
const config = createConfig(
  getDefaultConfig({
    appName: "PYUSD Stream Protocol (Hackathon)", 
    chains: [sepolia], 
    walletConnectProjectId: "57ed83f47f1c5a69967080cad44a6279", 
    
    // Wagmi v2'de transports yapısı
    transports: {
      [sepolia.id]: http(SEPOLIA_RPC_URL)
    },
  }),
);

// --- UYGULAMAYI SARMALAMA ---
ReactDOM.createRoot(document.getElementById('root')!).render(
  // BrowserRouter'ı ekliyoruz
  <BrowserRouter> 
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <ConnectKitProvider>
          {/* React.StrictMode'u dışa taşıyarak Toast'ı da sarmalayabiliriz */}
          <React.StrictMode>
            <App /> 
          </React.StrictMode>
        </ConnectKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
    <Toaster /> {/* UYGULAMA DIŞINA EKLENEN TOASTER */}
  </BrowserRouter>,
)
