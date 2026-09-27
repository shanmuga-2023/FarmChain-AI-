// src/web3/provider.js
// MetaMask & Web3 Ethers.js integration for Polygon Amoy Testnet (Chain ID: 80002)

import { ethers } from 'ethers';

export const POLYGON_AMOY_CONFIG = {
  chainIdHex: '0x13882', // 80002 in hex
  chainIdDecimal: 80002,
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: [
    'https://polygon-amoy-bor-rpc.publicnode.com',
    'https://polygon-amoy.drpc.org',
    'https://80002.rpc.thirdweb.com'
  ],
  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
};

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
        if (!accounts || accounts.length === 0) {
          this.disconnect();
        } else {
          this.address = accounts[0];
          this._notify();
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        this.chainId = parseInt(chainId, 16);
        this._notify();
      });
    }
  }

  async connect() {
    if (!window.ethereum) {
      throw new Error("MetaMask is not detected. Please install the MetaMask extension from https://metamask.io/ or use a Web3-compatible browser.");
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.send("eth_requestAccounts", []);
      this.signer = await this.provider.getSigner();
      this.address = accounts[0];

      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);
      this.isConnected = true;

      // Auto check and suggest switching to Polygon Amoy if on another network
      if (this.chainId !== POLYGON_AMOY_CONFIG.chainIdDecimal) {
        await this.switchToPolygonAmoy();
      }

      this._notify();
      return { address: this.address, chainId: this.chainId, signer: this.signer };
    } catch (error) {
      console.error("MetaMask connect error:", error);
      throw error;
    }
  }

  async switchToPolygonAmoy() {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY_CONFIG.chainIdHex }],
      });
      this.chainId = POLYGON_AMOY_CONFIG.chainIdDecimal;
      this._notify();
      return true;
    } catch (switchError) {
      // 4902 code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: POLYGON_AMOY_CONFIG.chainIdHex,
              chainName: POLYGON_AMOY_CONFIG.chainName,
              nativeCurrency: POLYGON_AMOY_CONFIG.nativeCurrency,
              rpcUrls: POLYGON_AMOY_CONFIG.rpcUrls,
              blockExplorerUrls: POLYGON_AMOY_CONFIG.blockExplorerUrls,
            }],
          });
          this.chainId = POLYGON_AMOY_CONFIG.chainIdDecimal;
          this._notify();
          return true;
        } catch (addError) {
          console.error('Failed to add Polygon Amoy to MetaMask:', addError);
          return false;
        }
      }
      console.error('Failed to switch to Polygon Amoy:', switchError);
      return false;
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
    this.listeners.forEach(cb => {
      try {
        cb({
          isConnected: this.isConnected,
          address: this.address,
          chainId: this.chainId,
          isAmoy: this.chainId === POLYGON_AMOY_CONFIG.chainIdDecimal
        });
      } catch (e) {
        console.error('Listener callback error:', e);
      }
    });
  }
}

export const web3Service = new Web3ProviderService();
