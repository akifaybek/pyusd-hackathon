function HomePage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>PYUSD "Kullandıkça Öde" Protokolüne Hoş Geldiniz!</h1>
      <p>
        Bu proje, Web3 uygulamaları için esnek ve kullanıcı dostu bir abonelik modeli sunar.
        Sürekli aylık ücretler yerine, hizmeti kullandığınız kadar ödeyin.
      </p>
      <p style={{ marginTop: '30px' }}>
        Başlamak için lütfen sağ üst köşeden cüzdanınızı bağlayın ve ardından 
        <a href="/dashboard" style={{ color: '#61dafb', marginLeft: '5px' }}>Kontrol Paneline</a> gidin.
      </p>
      {/* Buraya projeyi daha detaylı anlatan içerikler, görseller eklenebilir */}
    </div>
  );
}

export default HomePage;