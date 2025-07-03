import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers'; // Para formatear los precios

const NFTGallery = () => {
  const { miNFTContract, miMarketplaceContract, isConnected, account } = useWallet();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNFTs = useCallback(async () => {
    if (!miNFTContract || !miMarketplaceContract || !isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Obtener el total de NFTs minteados
      const totalSupplyBN = await miNFTContract.totalSupply();
      const totalSupply = totalSupplyBN.toNumber();
      console.log('Total Supply de NFTs:', totalSupply);

      const fetchedNfts = [];
      for (let i = 1; i <= totalSupply; i++) {
        try {
          // 2. Obtener el tokenURI para cada NFT
          const tokenURI = await miNFTContract.tokenURI(i);
          console.log(`Token URI para NFT #${i}:`, tokenURI);

          // Asegurarse de que el tokenURI sea una URL de IPFS válida
          let httpUri = tokenURI;
          if (tokenURI.startsWith('ipfs://')) {
            // Reemplaza con tu gateway de IPFS preferido
            httpUri = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`; //
          }
          
          // 3. Leer la metadata desde la URL del tokenURI
          const metadataResponse = await fetch(httpUri);
          if (!metadataResponse.ok) {
            throw new Error(`HTTP error! status: ${metadataResponse.status} for ${httpUri}`);
          }
          const metadata = await metadataResponse.json();
          console.log(`Metadata para NFT #${i}:`, metadata);

          // 4. Obtener información de venta desde el Marketplace
          const listing = await miMarketplaceContract.listings(i);
          console.log(`Listing para NFT #${i}:`, listing);

          // Construye la URL final de la imagen
          const imageUrl = metadata.image.startsWith('ipfs://') ? `https://gateway.pinata.cloud/ipfs/${metadata.image.substring(7)}` : metadata.image;
          console.log(`URL final de la imagen para NFT #${i}:`, imageUrl); // <-- ESTE ES EL NUEVO CONSOLE.LOG

          fetchedNfts.push({
            id: i,
            name: metadata.name,
            description: metadata.description,
            image: imageUrl, // Usa la URL construida
            price: listing.price > 0 ? ethers.utils.formatUnits(listing.price, 18) : null, // Asumiendo 18 decimales para tu MiTokenERC20
            isListed: listing.isListed,
            seller: listing.seller,
          });

        } catch (innerError) {
          console.error(`Error fetching data for NFT #${i}:`, innerError);
          fetchedNfts.push({ 
            id: i, 
            name: `NFT #${i} (Error)`, 
            description: `No se pudo cargar la metadata o el listado.`,
            image: 'https://via.placeholder.com/150?text=Error', 
            price: null,
            isListed: false,
            seller: ethers.constants.AddressZero,
            error: true
          });
        }
      }
      setNfts(fetchedNfts);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
      setError('Error al cargar los NFTs. Asegúrate de que la red local esté activa y los contratos desplegados.'); //
    } finally {
      setLoading(false);
    }
  }, [miNFTContract, miMarketplaceContract, isConnected]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  if (loading) {
    return <p>Cargando NFTs...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!isConnected) {
    return <p>Por favor, conecta tu wallet para ver los NFTs.</p>;
  }

  if (nfts.length === 0) {
    return <p>No hay NFTs disponibles en este momento.</p>;
  }

  return (
    <div>
      <h2>NFTs Disponibles</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: '20px', 
        padding: '20px' 
      }}>
        {nfts.map((nft) => (
          <div key={nft.id} style={{ 
            border: '1px solid #ccc', 
            borderRadius: '8px', 
            padding: '15px', 
            textAlign: 'center', 
            boxShadow: '2px 2px 8px rgba(0,0,0,0.1)' 
          }}>
            <h3>{nft.name} #{nft.id}</h3>
            {nft.image && <img src={nft.image} alt={nft.name} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />}
            <p>{nft.description}</p>
            {nft.isListed ? (
              <>
                <p>Precio: {nft.price} MITK</p>
                {/* Botón de comprar (lo implementaremos después) */}
                <button 
                  onClick={() => alert(`Comprar NFT #${nft.id} por ${nft.price} MITK`)}
                  disabled={account && nft.seller && account.toLowerCase() === nft.seller.toLowerCase()}
                >
                  {account && nft.seller && account.toLowerCase() === nft.seller.toLowerCase() ? "Es tu NFT" : "Comprar"}
                </button>
              </>
            ) : (
              <p>No listado para venta.</p>
            )}
            {nft.error && <p style={{color: 'orange', fontSize: '0.8em'}}>Advertencia: Error al cargar detalles completos.</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NFTGallery;