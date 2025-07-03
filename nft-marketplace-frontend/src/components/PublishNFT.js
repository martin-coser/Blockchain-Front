import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

const PublishNFT = () => {
    const { miNFTContract, miMarketplaceContract, signer, account, isConnected } = useWallet();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [price, setPrice] = useState('');

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState('');
    const [uploadedMetadataUrl, setUploadedMetadataUrl] = useState('');


    const handleImageChange = (event) => {
        if (event.target.files.length > 0) {
            setImageFile(event.target.files[0]);
        } else {
            setImageFile(null);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!isConnected || !signer || !miNFTContract || !miMarketplaceContract) {
            setMessage('Por favor, conecta tu wallet y asegúrate de que los contratos estén cargados.');
            return;
        }

        if (!name || !description || !imageFile) {
            setMessage('Por favor, completa el nombre, la descripción y selecciona una imagen.');
            return;
        }

        if (price && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
            setMessage('Por favor, ingresa un precio válido.');
            return;
        }

        setLoading(true);
        setMessage('Iniciando publicación del NFT...');
        setUploadedImageUrl('');
        setUploadedMetadataUrl('');

        try {
            // --- 1. Subir la imagen a IPFS (usando Pinata) ---
            setMessage('Subiendo imagen a IPFS...');
            const formData = new FormData();
            formData.append('file', imageFile);

            const pinataOptions = JSON.stringify({
                cidVersion: 0,
            });
            formData.append('pinataOptions', pinataOptions);

            const pinataMetadata = JSON.stringify({
                name: imageFile.name,
            });
            formData.append('pinataMetadata', pinataMetadata);

            const imageUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3OGQzMzZkYi00NzJjLTQ3MTktYmFjOS0zMTBhOGVkNTc4OWQiLCJlbWFpbCI6ImNvc2VybWFydGluQGhvdG1haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImJkYjM2MGY0ODE3ODU4NmE1NGUwIiwic2NvcGVkS2V5U2VjcmV0IjoiYTc1YjUxNmVlMDUxY2I4ZjU1MDM5MTkxOWFhNWNkM2Q4YjgxMzQxYzNkNDI0NmFjMDYwNjIwMjg1NzA1M2IxMyIsImV4cCI6MTc4MzA5OTY4M30.sggbxCJcZd-Jh39tDrjZSZ4S1vo6y1FRZwp_8kQP3jM`
                },
                body: formData
            });

            if (!imageUploadResponse.ok) {
                const errorData = await imageUploadResponse.json();
                throw new Error(`Error al subir imagen a Pinata: ${imageUploadResponse.status} - ${errorData.error || imageUploadResponse.statusText}`);
            }

            const imageData = await imageUploadResponse.json();
            const imageIpfsHash = imageData.IpfsHash;
            const imageUrl = `ipfs://${imageIpfsHash}`;
            setUploadedImageUrl(`https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`);
            console.log('Imagen subida a IPFS:', imageUrl);

            // --- 2. Generar la metadata JSON ---
            setMessage('Generando y subiendo metadata a IPFS...');
            const nftMetadata = {
                name: name,
                description: description,
                image: imageUrl, // URL IPFS de la imagen subida
                attributes: [
                    { "trait_type": "Publicado por", "value": account },
                    { "trait_type": "Fecha de publicación", "value": new Date().toLocaleDateString() }
                ]
            };

            // --- 3. Subir la metadata JSON a IPFS (usando Pinata) ---
            const jsonUploadResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3OGQzMzZkYi00NzJjLTQ3MTktYmFjOS0zMTBhOGVkNTc4OWQiLCJlbWFpbCI6ImNvc2VybWFydGluQGhvdG1haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImJkYjM2MGY0ODE3ODU4NmE1NGUwIiwic2NvcGVkS2V5U2VjcmV0IjoiYTc1YjUxNmVlMDUxY2I4ZjU1MDM5MTkxOWFhNWNkM2Q4YjgxMzQxYzNkNDI0NmFjMDYwNjIwMjg1NzA1M2IxMyIsImV4cCI6MTc4MzA5OTY4M30.sggbxCJcZd-Jh39tDrjZSZ4S1vo6y1FRZwp_8kQP3jM`
                },
                body: JSON.stringify(nftMetadata)
            });

            if (!jsonUploadResponse.ok) {
                const errorData = await jsonUploadResponse.json();
                throw new Error(`Error al subir metadata a Pinata: ${jsonUploadResponse.status} - ${errorData.error || jsonUploadResponse.statusText}`);
            }

            const metadataData = await jsonUploadResponse.json();
            const metadataIpfsHash = metadataData.IpfsHash;
            const metadataUri = `ipfs://${metadataIpfsHash}`;
            setUploadedMetadataUrl(`https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`);
            console.log('Metadata JSON subida a IPFS:', metadataUri);

            // --- 4. Mintear el NFT ---
            setMessage('Minteando NFT...');
            const mintTx = await miNFTContract.connect(signer).mint(account, metadataUri);
            await mintTx.wait();
            console.log('NFT minteado exitosamente. Hash de transacción:', mintTx.hash);

            let tokenId;
            try {
                const newTotalSupplyBN = await miNFTContract.totalSupply();
                tokenId = newTotalSupplyBN.toNumber();
                console.log('Posible Token ID minteado:', tokenId);

            } catch (error) {
                console.warn("No se pudo determinar el Token ID exacto desde la transacción. Si el NFT se minteó, el ID será el siguiente a totalSupply.");
                const currentTotalSupplyBN = await miNFTContract.totalSupply();
                tokenId = currentTotalSupplyBN.toNumber();
            }

            // --- 5. (Opcional) Listar para venta en el Marketplace ---
            if (price && parseFloat(price) > 0) {
                setMessage('Listando NFT en el Marketplace...');
                const parsedPrice = ethers.utils.parseUnits(price, 18);
                
                const approveTx = await miNFTContract.connect(signer).approve(miMarketplaceContract.address, tokenId);
                await approveTx.wait();
                console.log(`Aprobación del NFT #${tokenId} para el Marketplace concedida.`);

                const listTx = await miMarketplaceContract.connect(signer).listNFT(tokenId, parsedPrice);
                await listTx.wait();
                console.log(`NFT #${tokenId} listado en el Marketplace por ${price} MITK.`);
                setMessage(`¡NFT minteado y listado exitosamente! Token ID: ${tokenId}`);

            } else {
                setMessage(`¡NFT minteado exitosamente! Token ID: ${tokenId} (No listado para venta).`);
            }

            // Restablecer el formulario
            setName('');
            setDescription('');
            setImageFile(null);
            setPrice('');
            event.target.reset(); // Limpia el input de tipo file
            
        } catch (error) {
            console.error('Error al publicar NFT:', error);
            setMessage(`Error al publicar NFT: ${error.message || error.toString()}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '2px 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>Publicar Nuevo NFT</h2>
            {!isConnected && <p style={{ color: 'red', textAlign: 'center' }}>Por favor, conecta tu wallet para publicar NFTs.</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label htmlFor="nftName" style={{ display: 'block', marginBottom: '5px'}}>Nombre del NFT:</label>
                    <input
                        type="text"
                        id="nftName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={(loading || !isConnected)} 
                        style={{ width: '98%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <div>
                    <label htmlFor="nftDescription" style={{ display: 'block', marginBottom: '5px' }}>Descripción:</label>
                    <textarea
                        id="nftDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={(loading || !isConnected)} 
                        rows="4"
                        style={{ width: '97%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="nftImage" style={{ display: 'block', marginBottom: '5px' }}>Imagen del NFT:</label>
                    <input
                        type="file"
                        id="nftImage"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={(loading || !isConnected)} 
                        style={{ width: '97%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <div>
                    <label htmlFor="nftPrice" style={{ display: 'block', marginBottom: '5px' }}>Precio (en MITK, opcional):</label>
                    <input
                        type="number"
                        id="nftPrice"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={(loading || !isConnected)} 
                        step="0.01"
                        min="0"
                        style={{ width: '97%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                </div>
                <button type="submit" disabled={(loading || !isConnected)} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}> 
                    {loading ? 'Publicando...' : 'Publicar NFT'}
                </button>
            </form>
            {message && <p style={{ marginTop: '15px', textAlign: 'center', color: loading ? 'blue' : (message.includes('Error') ? 'red' : 'green') }}>{message}</p>}
            {uploadedImageUrl && <p style={{ textAlign: 'center', fontSize: '0.9em' }}>URL de la Imagen: <a href={uploadedImageUrl} target="_blank" rel="noopener noreferrer">{uploadedImageUrl}</a></p>}
            {uploadedMetadataUrl && <p style={{ textAlign: 'center', fontSize: '0.9em' }}>URL de la Metadata: <a href={uploadedMetadataUrl} target="_blank" rel="noopener noreferrer">{uploadedMetadataUrl}</a></p>}
        </div>
    );
};

export default PublishNFT;