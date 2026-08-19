// src/web3/contracts.js
// Solidity Smart Contract interaction helpers via ethers.js

import { ethers } from 'ethers';
import { web3Service } from './provider.js';

// Minimal ABIs for compiled Solidity contracts
export const PRODUCT_REGISTRY_ABI = [
  "function registerProduct(string _productId, string _name, string _category, string _farmerName, string _originLocation, uint256 _quantity, string _unit, uint256 _pricePerUnitWei, string _harvestDate, bool _isOrganic, string _ipfsMetadataHash) external returns (bool)",
  "function getProduct(string _productId) external view returns (tuple(string productId, string name, string category, address farmerAddress, string farmerName, string originLocation, uint256 quantity, string unit, uint256 pricePerUnitWei, string harvestDate, bool isOrganic, string ipfsMetadataHash, uint8 status, uint256 registeredAt))",
  "function getAllProductIds() external view returns (string[])",
  "event ProductRegistered(string indexed productId, string name, address indexed farmerAddress, uint256 quantity, uint256 pricePerUnitWei, bool isOrganic, uint256 registeredAt)"
];

export const MARKETPLACE_ESCROW_ABI = [
  "function createOrder(string _orderId, string _productId, address payable _farmer, address payable _intermediary, address payable _retailer, uint256 _quantity) external payable returns (bool)",
  "function confirmShipment(string _orderId) external",
  "function confirmDeliveryAndRelease(string _orderId) external",
  "function getOrder(string _orderId) external view returns (tuple(string orderId, string productId, address buyer, address payable farmer, address payable intermediary, address payable retailer, uint256 totalAmountWei, uint256 quantity, uint8 status, uint256 createdAt, uint256 completedAt))",
  "event FundsReleased(string indexed orderId, uint256 farmerShare, uint256 intermediaryShare, uint256 retailerShare, uint256 platformShare)"
];

export const CONTRACT_ADDRESSES = {
  sepolia: {
    ProductRegistry: "0x71C25e1aF1b30D6bFE4F6D3f8A7831d1E852D402",
    MarketplaceEscrow: "0x89A36a18d19F9F8d5B39d997232230D6222b4033",
    explorerBase: "https://sepolia.etherscan.io",
  },
  baseSepolia: {
    ProductRegistry: "0x4b78A229F628e937d2f9C198a287a957b489816B",
    MarketplaceEscrow: "0x2C46e7b1652f416Ffe82672B10471d5b306B626C",
    explorerBase: "https://sepolia.basescan.org",
  }
};

export function getExplorerTxUrl(txHash, network = 'sepolia') {
  const base = CONTRACT_ADDRESSES[network]?.explorerBase || 'https://sepolia.etherscan.io';
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address, network = 'sepolia') {
  const base = CONTRACT_ADDRESSES[network]?.explorerBase || 'https://sepolia.etherscan.io';
  return `${base}/address/${address}`;
}

export function getProductRegistryContract() {
  if (!web3Service.signer) return null;
  const address = CONTRACT_ADDRESSES.sepolia.ProductRegistry;
  return new ethers.Contract(address, PRODUCT_REGISTRY_ABI, web3Service.signer);
}

export function getMarketplaceEscrowContract() {
  if (!web3Service.signer) return null;
  const address = CONTRACT_ADDRESSES.sepolia.MarketplaceEscrow;
  return new ethers.Contract(address, MARKETPLACE_ESCROW_ABI, web3Service.signer);
}
