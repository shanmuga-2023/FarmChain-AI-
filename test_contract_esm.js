import { ethers } from 'ethers';
import fs from 'fs';

async function test() {
  const rpcUrl = "https://polygon-amoy-bor-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl, { chainId: 80002, name: 'polygonAmoy' });
  const address = "0xEfAE2C6BBE660F2Ebd22C09D6f04394aF0a4738A";
  
  const contractArtifact = JSON.parse(fs.readFileSync('frontend/src/contracts/AgriSupplyChain.json'));
  const contract = new ethers.Contract(address, contractArtifact.abi, provider);
  
  const batchIds = [
    'BATCH-TEST-POLYGON-001',
    'BATCH-TEST-POLYGON-002',
    'PROD-AUDIT-TEST-001',
    'PROD-1790583748893-ilsaty'
  ];
  
  for (const batchId of batchIds) {
    console.log("\\nTesting batch:", batchId);
    try {
      const details = await contract.getBatchDetails(batchId);
      console.log("Success! Returned details:");
      console.log({
        batchId_: details.batchId_,
        cropName: details.cropName,
        quantity: Number(details.quantity),
      });
    } catch (e) {
      console.log("Failed. Error message:", e.reason || e.shortMessage || e.message);
    }
  }
}

test();
