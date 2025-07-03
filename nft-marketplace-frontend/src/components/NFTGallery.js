import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers'; // Para formatear los precios

// Estilos para los botones
const buttonStyle = {
  backgroundColor: '#4CAF50',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1em',
  transition: 'background 0.2s'
};

const disabledButtonStyle = {
  backgroundColor: '#cccccc',
  color: '#666666',
  cursor: 'not-allowed'
};

// --- NUEVO ESTILO para el botón de filtro ---
const filterButtonStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1em',
  transition: 'background-color 0.2s ease',
  margin: '0 10px', // Añade un poco de espacio
};


const NFTGallery = () => {
  const { miNFTContract, miMarketplaceContract, miTokenERC20Contract, isConnected, signer, account } = useWallet();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyMessage, setBuyMessage] = useState('');
  const [buyingNftId, setBuyingNftId] = useState(null);
  const [showMyNftsOnly, setShowMyNftsOnly] = useState(false); // <--- AÑADIDO: Nuevo estado para el filtro

  const fetchNFTs = useCallback(async () => {
    if (!miNFTContract || !miMarketplaceContract || !miTokenERC20Contract || !isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const totalSupplyBN = await miNFTContract.totalSupply();
      const totalSupply = totalSupplyBN.toNumber();
      console.log('Total Supply de NFTs:', totalSupply);

      const fetchedNfts = [];
      for (let i = 1; i <= totalSupply; i++) {
        try {
          const tokenURI = await miNFTContract.tokenURI(i);
          console.log(`Token URI para NFT #${i}:`, tokenURI);

          let httpUri = tokenURI;
          if (tokenURI.startsWith('ipfs://')) {
            httpUri = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
          }

          const metadataResponse = await fetch(httpUri);
          if (!metadataResponse.ok) {
            throw new Error(`HTTP error! status: ${metadataResponse.status} for ${httpUri}`);
          }
          const metadata = await metadataResponse.json();
          console.log(`Metadata para NFT #${i}:`, metadata);

          const listing = await miMarketplaceContract.listings(i);
          console.log(`Listing para NFT #${i}:`, listing);

          const imageUrl = metadata.image.startsWith('ipfs://') ? `https://gateway.pinata.cloud/ipfs/${metadata.image.substring(7)}` : metadata.image;
          console.log(`URL final de la imagen para NFT #${i}:`, imageUrl);

          const owner = await miNFTContract.ownerOf(i); // <-- Es crucial que esta línea esté aquí para obtener el dueño

          fetchedNfts.push({
            id: i,
            name: metadata.name,
            description: metadata.description,
            image: imageUrl,
            owner: owner, // <-- Asegúrate de incluir el propietario aquí
            price: listing.price > 0 ? ethers.utils.formatUnits(listing.price, 18) : null,
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
      setError('Error al cargar los NFTs. Asegúrate de que la red local esté activa y los contratos desplegados.');
    } finally {
      setLoading(false);
    }
  }, [miNFTContract, miMarketplaceContract, isConnected]); // miTokenERC20Contract no es necesario aquí si solo se usa en buyNFT

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

  if (nfts.length === 0 && !showMyNftsOnly) { // Si no hay NFTs y no estamos filtrando por "Mis NFTs"
    return <p>No hay NFTs disponibles en este momento.</p>;
  }
  if (nfts.length === 0 && showMyNftsOnly) { // Si no hay NFTs y estamos filtrando por "Mis NFTs"
    return <p>No tienes NFTs en esta cuenta.</p>;
  }

  const handleBuyNFT = async (nft) => {
    if (!isConnected || !signer || !miMarketplaceContract || !miTokenERC20Contract || !account) {
      setBuyMessage('Por favor, conecta tu wallet.');
      return;
    }
    if (account.toLowerCase() === nft.seller.toLowerCase()) {
      setBuyMessage('No puedes comprar tu propio NFT.');
      return;
    }

    setBuyingNftId(nft.id);
    setBuyMessage(`Procesando compra para NFT #${nft.id}...`);

    try {
      const priceInWei = ethers.utils.parseUnits(nft.price.toString(), 18);

      setBuyMessage(`Aprobando ${nft.price} MITK para el Marketplace...`);
      const approveTx = await miTokenERC20Contract.connect(signer).approve(miMarketplaceContract.address, priceInWei);
      await approveTx.wait();
      console.log(`Aprobación de ${nft.price} MITK para el Marketplace exitosa.`);
      setBuyMessage(`Aprobación de tokens exitosa. Comprando NFT #${nft.id}...`);

      const buyTx = await miMarketplaceContract.connect(signer).buyNFT(nft.id);
      await buyTx.wait();
      console.log(`NFT #${nft.id} comprado exitosamente.`);
      setBuyMessage(`¡NFT #${nft.id} comprado con éxito!`);

      await fetchNFTs();

    } catch (err) {
      console.error(`Error al comprar NFT #${nft.id}:`, err);
      let errorMessage = 'Error al procesar la compra.';
      if (err.message.includes('insufficient funds')) {
        errorMessage = 'Fondos insuficientes para la compra.';
      } else if (err.message.includes('user rejected transaction')) {
        errorMessage = 'Transacción rechazada por el usuario.';
      } else if (err.message.includes('ERC20InsufficientAllowance')) {
        errorMessage = 'Fallo en la aprobación de tokens. Asegúrate de tener suficientes tokens y haber aprobado la cantidad correcta.';
      } else if (err.message.includes('El NFT no esta listado para la venta')) {
        errorMessage = 'El NFT ya no está listado para la venta.';
      } else if (err.message.includes('No puedes comprar tu propio NFT')) {
        errorMessage = 'No puedes comprar tu propio NFT.';
      }
      setBuyMessage(`Error: ${errorMessage}`);
    } finally {
      setBuyingNftId(null);
    }
  };

  // Estilos de la galería (mantenemos los que tenías)
  const galleryGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    padding: '20px',
  };

  const nftCardStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
  };

  const nftImageStyle = {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '4px',
  };


  return (
    <div>
      <h2>NFTs Disponibles</h2>

      {/* --- BOTÓN PARA FILTRAR MIS NFTS --- */}
      {isConnected && ( // Mostrar el botón solo si la wallet está conectada
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => setShowMyNftsOnly(!showMyNftsOnly)}
            style={{
              ...filterButtonStyle,
              backgroundColor: showMyNftsOnly ? '#007bff' : '#6c757d', // Azul si está activo, gris si no
              color: 'white',
            }}
          >
            {showMyNftsOnly ? 'Mostrar Todos los NFTs' : 'Mostrar Solo Mis NFTs'}
          </button>
        </div>
      )}
      {/* --- FIN BOTÓN PARA FILTRAR MIS NFTS --- */}


      <div style={galleryGridStyle}>
        {nfts
          .filter(nft => { // <--- APLICACIÓN DEL FILTRO AQUÍ
            if (showMyNftsOnly) {
              // Si el filtro está activo, solo mostrar si el dueño del NFT es la cuenta conectada
              return nft.owner && account && nft.owner.toLowerCase() === account.toLowerCase();
            }
            // Si el filtro no está activo, mostrar todos
            return true;
          })
          .map((nft) => (
            <div key={nft.id} style={nftCardStyle}>
              {nft.error ? (
                <>
                  <h3>{nft.name}</h3>
                  <p>{nft.description}</p>
                  <img src={nft.image} alt="Error al cargar" style={nftImageStyle} />
                </>
              ) : (
                <>
                  <h3>{nft.name} #{nft.id}</h3>
                  {nft.image && <img src={nft.image} alt={nft.name} style={nftImageStyle} />}
                  <p>{nft.description}</p>
                  {nft.isListed ? (
                    <>
                      <p>Precio: {nft.price} MITK</p>
                      <button
                        onClick={() => handleBuyNFT(nft)}
                        disabled={
                          (account && nft.seller && account.toLowerCase() === nft.seller.toLowerCase()) ||
                          buyingNftId === nft.id ||
                          !isConnected
                        }
                        style={{
                          ...buttonStyle,
                          ...(
                            (account && nft.seller && account.toLowerCase() === nft.seller.toLowerCase()) ||
                            buyingNftId === nft.id ||
                            !isConnected
                          ) ? disabledButtonStyle : {}
                        }}
                      >
                        {account && nft.seller && account.toLowerCase() === nft.seller.toLowerCase()
                          ? "Es tu NFT"
                          : buyingNftId === nft.id ? "Comprando..." : "Comprar"}
                      </button>
                    </>
                  ) : (
                    <p>No listado para venta.</p>
                  )}
                  {/* Si el NFT no está listado pero es de la cuenta conectada, mostrar que es tuyo */}
                  {!nft.isListed && account && nft.owner && account.toLowerCase() === nft.owner.toLowerCase() && (
                      <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#007bff' }}>¡Este NFT es tuyo!</p>
                  )}
                </>
              )}
              {nft.error && <p style={{ color: 'orange', fontSize: '0.8em' }}>Advertencia: Error al cargar detalles completos.</p>}
            </div>
          ))}
        {/* Si el filtro está activo y no hay NFTs para mostrar */}
        {showMyNftsOnly && nfts.filter(nft => nft.owner && account && nft.owner.toLowerCase() === account.toLowerCase()).length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '20px', color: '#666' }}>
            No tienes NFTs en esta cuenta.
          </p>
        )}
      </div>
      {buyMessage && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: buyMessage.includes('Error') ? 'red' : 'green' }}>
          {buyMessage}
        </p>
      )}
    </div>
  );
};

export default NFTGallery;