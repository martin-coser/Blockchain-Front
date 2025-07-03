import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const ConnectWalletButton = () => {
  const { account, isConnected, connectWallet, disconnectWallet, chainId } = useWallet();

  return (
    <div>
      {isConnected ? (
        <p>
          Conectado: {account.slice(0, 6)}...{account.slice(-4)} (Chain ID: {chainId})
          <button onClick={disconnectWallet} style={{ marginLeft: '10px' }}>
            Desconectar Wallet
          </button>
        </p>
      ) : (
        <button onClick={connectWallet}>Conectar Wallet</button>
      )}
    </div>
  );
};

export default ConnectWalletButton;