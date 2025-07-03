import React from 'react';
import ConnectWalletButton from './components/ConnectWalletButton';
import NFTGallery from './components/NFTGallery'; // Importa el nuevo componente
import PublishNFT from './components/PublishNFT';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Mi Marketplace de NFTs</h1>
      <ConnectWalletButton />
      <hr style={{ margin: '20px 0' }}/>
      
      <h2>Bienvenido al Frontend de tu Marketplace</h2>
      <p>Aquí construiremos las funcionalidades para mostrar, publicar y comprar NFTs.</p>

      {/* Aquí mostramos la galería de NFTs */}
      <NFTGallery />

       <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #eee' }} /> 

      <PublishNFT /> {/* <--- Añade esta línea para el formulario de publicación */}

      <p style={{ marginTop: '50px', fontSize: '0.8em', color: '#666' }}>
        Asegúrate de que Metamask esté instalado y configurado en la red correcta.
      </p>
    </div>
  );
}

export default App;