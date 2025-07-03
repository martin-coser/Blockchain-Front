import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

// Importa los ABIs de tus contratos
import MiNFTABI from '../contracts/MiNFT.json'; 
import MiMarketplaceABI from '../contracts/MiMarketplace.json';
import MiTokenERC20ABI from '../contracts/MiTokenERC20.json';

// --- ¡IMPORTANTE! Reemplaza con las direcciones de tus contratos desplegados ---
const MiNFTAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const MiTokenERC20Address = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const MiMarketplaceAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
// -------------------------------------------------------------------------

export const WalletContext = createContext();

const providerOptions = {}; 
let web3Modal;
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'hardhat', // !!! IMPORTANTE: Cambia esto a la red en la que está desplegado tu contrato
    cacheProvider: true, 
    providerOptions,
  });
}

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [miNFTContract, setMiNFTContract] = useState(null);
  const [miMarketplaceContract, setMiMarketplaceContract] = useState(null);
  const [miTokenERC20Contract, setMiTokenERC20Contract] = useState(null);

  // Declarar disconnectWallet primero para asegurar que esté disponible
  const disconnectWallet = useCallback(async () => {
    try {
      if (web3Modal.cachedProvider) {
        await web3Modal.clearCachedProvider();
      }
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setChainId(null);
      setIsConnected(false);
      setMiNFTContract(null); 
      setMiMarketplaceContract(null);
      setMiTokenERC20Contract(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, []); // Dependencias vacías, esta función no depende de nada del scope que cambie

  const connectWallet = useCallback(async () => {
    try {
      const web3Provider = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(web3Provider);
      const signer = provider.getSigner();
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(provider);
        setSigner(signer);
        setChainId(network.chainId);
        setIsConnected(true);

        setMiNFTContract(new ethers.Contract(MiNFTAddress, MiNFTABI.abi, signer || provider));
        setMiMarketplaceContract(new ethers.Contract(MiMarketplaceAddress, MiMarketplaceABI.abi, signer || provider));
        setMiTokenERC20Contract(new ethers.Contract(MiTokenERC20Address, MiTokenERC20ABI.abi, signer || provider));
      }

      if (window.ethereum) {
        // Es importante pasar una referencia estable de disconnectWallet
        // Para que el listener no se remueva y re-agregue innecesariamente
        window.ethereum.on('accountsChanged', (newAccounts) => {
          setAccount(newAccounts[0] || null);
          setIsConnected(!!newAccounts.length);
        });

        window.ethereum.on('chainChanged', (newChainId) => {
          setChainId(parseInt(newChainId, 16));
        });

        window.ethereum.on('disconnect', disconnectWallet); // Usamos la referencia a la función useCallback
      }
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }, [disconnectWallet]); // Ahora sí, connectWallet puede depender de disconnectWallet, porque disconnectWallet es estable.

  useEffect(() => {
    if (web3Modal?.cachedProvider) {
      connectWallet();
    }
  }, [connectWallet]); 

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnected,
    connectWallet,
    disconnectWallet,
    miNFTContract, 
    miMarketplaceContract,
    miTokenERC20Contract,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => React.useContext(WalletContext);