// src/web3/provider.js
// MetaMask & Web3 Ethers.js integration for Ethereum Sepolia & Polygon Amoy

import { ethers } from 'ethers';

class Web3ProviderService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.listeners = [];
    this._init();
  }

  _init() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);

      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.address = accounts[0];
          this._notify();
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        this.chainId = chainId;
        this._notify();
        window.location.reload();
      });
    }
  }

  async connect() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask from https://metamask.io/");
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.send("eth_requestAccounts", []);
      this.signer = await this.provider.getSigner();
      this.address = accounts[0];
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId.toString();
      this.isConnected = true;

      this._notify();
      return { address: this.address, chainId: this.chainId, signer: this.signer };
    } catch (error) {
      console.error("MetaMask connect error:", error);
      throw error;
    }
  }

  async switchToSepolia() {
    if (!window.ethereum) return;
    const sepoliaChainId = '0xaa36a7'; // 11155111

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sepoliaChainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: sepoliaChainId,
            chainName: 'Sepolia Test Network',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      }
    }
  }

  async getBalance() {
    if (!this.provider || !this.address) return '0.00';
    try {
      const balanceWei = await this.provider.getBalance(this.address);
      return parseFloat(ethers.formatEther(balanceWei)).toFixed(4);
    } catch (e) {
      return '0.00';
    }
  }

  disconnect() {
    this.address = null;
    this.signer = null;
    this.isConnected = false;
    this._notify();
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  _notify() {
    this.listeners.forEach(cb => cb({
      isConnected: this.isConnected,
      address: this.address,
      chainId: this.chainId,
    }));
  }
}

export const web3Service = new Web3ProviderService();
