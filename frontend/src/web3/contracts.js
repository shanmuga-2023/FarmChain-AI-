// src/web3/contracts.js
// Enterprise Smart Contract interface for AgriSupplyChain on Polygon Amoy (80002)

import { ethers } from 'ethers';
import { web3Service, POLYGON_AMOY_CONFIG } from './provider.js';
import contractArtifact from '../contracts/AgriSupplyChain.json';

export const AMOY_EXPLORER_BASE = 'https://amoy.polygonscan.com';

export function getExplorerTxUrl(txHash) {
  if (!txHash) return '#';
  return `${AMOY_EXPLORER_BASE}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address) {
  if (!address) return '#';
  return `${AMOY_EXPLORER_BASE}/address/${address}`;
}

/**
 * Get contract instance connected with active signer or fallback provider
 */
export function getAgriSupplyChainContract() {
  const address = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AGRI_CONTRACT_ADDRESS) || contractArtifact.address;
  const isAddressValid = address && address !== '0x0000000000000000000000000000000000000000' && ethers.isAddress(address);

  if (!isAddressValid) {
    return null;
  }

  if (web3Service.signer) {
    return new ethers.Contract(address, contractArtifact.abi, web3Service.signer);
  }

  if (web3Service.provider) {
    return new ethers.Contract(address, contractArtifact.abi, web3Service.provider);
  }

  // Fallback public RPC read-only provider
  const rpcUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POLYGON_AMOY_RPC_URL) || POLYGON_AMOY_CONFIG.rpcUrls[0];
  const publicProvider = new ethers.JsonRpcProvider(rpcUrl, {
    chainId: POLYGON_AMOY_CONFIG.chainIdDecimal,
    name: 'polygonAmoy'
  });
  return new ethers.Contract(address, contractArtifact.abi, publicProvider);
}

/**
 * Mint or register batch directly on Polygon Amoy with MetaMask or through backend API
 */
export async function createBatchOnChain({ batchId, cropName, quantity, price, dataHash }) {
  const contract = getAgriSupplyChainContract();
  const hash = dataHash || ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ batchId, cropName, date: Date.now() })));

  if (contract && web3Service.signer) {
    try {
      const tx = await contract.createBatch(batchId, cropName, quantity, hash);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        isLiveOnChain: true,
        polygonScanUrl: getExplorerTxUrl(receipt.hash)
      };
    } catch (e) {
      console.warn('MetaMask transaction failed or rejected. Delegating to backend API relayer:', e.message);
    }
  }

  // Fallback / Relayer via backend API
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const res = await fetch(`${apiBase}/blockchain/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batchId,
      cropName,
      quantity,
      price,
      dataHash: hash,
      ownerAddress: web3Service.address || '0xFee2B36737BDdBB3AB8C0924B013f898e512715F'
    })
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to mint on-chain batch');
  return json.data;
}

/**
 * Verify batch authenticity via on-chain contract or backend verification endpoint
 */
export async function verifyBatchOnChain(batchId, expectedDataHash) {
  const contract = getAgriSupplyChainContract();

  if (contract) {
    try {
      const verification = await contract.verifyBatch(batchId);
      if (verification && verification.isValid) {
        return {
          isValid: true,
          currentOwner: verification.currentOwner,
          currentStage: Number(verification.currentStage),
          certCount: Number(verification.certCount),
          dataHash: verification.dataHash,
          source: 'Polygon Amoy Smart Contract'
        };
      }
    } catch (e) {
      console.warn('On-chain read failed, querying backend verification endpoint:', e.message);
    }
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const url = `${apiBase}/blockchain/verify/${encodeURIComponent(batchId)}${expectedDataHash ? `?hash=${expectedDataHash}` : ''}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data || { isValid: false };
}

/**
 * Get batch traceability lifecycle & price history
 */
export async function getBatchHistory(batchId) {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  try {
    const res = await fetch(`${apiBase}/blockchain/history/${encodeURIComponent(batchId)}`);
    const json = await res.json();
    return json.data || { stages: [], prices: [], certificates: [] };
  } catch (e) {
    console.error('Failed to fetch batch history:', e);
    return { stages: [], prices: [], certificates: [] };
  }
}
