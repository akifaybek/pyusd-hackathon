import { Routes, Route, Link } from "react-router-dom"; // <-- Yönlendirme için gerekli importlar
import { ConnectKitButton } from "connectkit";
import './App.css';

// 1. Oluşturduğumuz sayfaları import et
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <>
      {/* GENEL LAYOUT: Header (Her sayfada görünecek) */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#222' }}>
        {/* Sayfalar arası geçiş linkleri */}
        <nav>
          <Link to="/" style={{ color: '#61dafb', marginRight: '15px', textDecoration: 'none' }}>Ana Sayfa</Link>
          <Link to="/dashboard" style={{ color: '#61dafb', textDecoration: 'none' }}>Kontrol Paneli</Link>
        </nav>
        {/* Cüzdan Bağlama Butonu */}
        <ConnectKitButton />
      </header>

      {/* SAYFA İÇERİĞİ: URL'ye göre değişecek */}
      <main>
        {/* Routes bileşeni, URL'ye göre hangi Route'un aktif olacağını belirler */}
        <Routes>
          {/* Eğer URL '/' ise HomePage bileşenini göster */}
          <Route path="/" element={<HomePage />} />

          {/* Eğer URL '/dashboard' ise DashboardPage bileşenini göster */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* İsteğe Bağlı: Eşleşmeyen URL'ler için 404 sayfası eklenebilir */}
          {/* <Route path="*" element={<div>Sayfa Bulunamadı (404)</div>} /> */}
        </Routes>
      </main>

      {/* İsteğe Bağlı: Footer (Her sayfada görünecek) */}
      {/* <footer style={{ textAlign: 'center', marginTop: '50px', padding: '20px', color: '#888' }}>
        © 2025 PYUSD Hackathon Projesi
      </footer> */}
    </>
  )
}

export default App