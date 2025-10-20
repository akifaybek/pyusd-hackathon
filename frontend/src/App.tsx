// 1. ConnectKit'ten hazır butonu import et
import { ConnectKitButton } from "connectkit";

// 2. CSS dosyasını import et (daha sonra güzelleştirmek için)
import './App.css'; 

function App() {
  return (
    <>
      {/* GÖREV B2: Cüzdan Bağlama Arayüzü */}
      <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px' }}>
        <ConnectKitButton />
      </header>

      {/* Ana İçerik Alanı */}
      <main style={{ padding: '20px', textAlign: 'center' }}>
        <h1>PYUSD "Kullandıkça Öde" Protokolü</h1>
        <p>
          Hoş geldiniz! Lütfen abonelik akışını başlatmak için sağ üst köşeden cüzdanınızı bağlayın.
        </p>

        {/* Buraya daha sonra B2'nin devamı (Bakiye, Abonelik Durumu)
          ve B3 görevindeki (Approve/Subscribe) butonlar gelecek.
        */}
        <div style={{ marginTop: '50px' }}>
          <h2>Abonelik Kontrol Paneli</h2>

          {/* GÖREV B2 (Devamı): Bakiye ve Abonelik Durumu buraya gelecek */}

          {/* GÖREV B3: "Approve" ve "Subscribe" butonları buraya gelecek */}

          {/* GÖREV B4: "Token-Gated İçerik" buraya gelecek */}
        </div>
      </main>
    </>
  )
}

export default App