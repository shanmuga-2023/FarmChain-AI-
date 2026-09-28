import { ethers } from 'ethers';
import fs from 'fs';

async function mintAndTest() {
  const rpcUrl = "https://polygon-amoy-bor-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl, { chainId: 80002, name: 'polygonAmoy' });
  const privateKey = "4907d42997ee6d323632f395668d2f77822bfcf73a649675e07b8a39584be805"; // From .env
  const wallet = new ethers.Wallet(privateKey, provider);
  const address = "0xEfAE2C6BBE660F2Ebd22C09D6f04394aF0a4738A";
  
  const contractArtifact = JSON.parse(fs.readFileSync('frontend/src/contracts/AgriSupplyChain.json'));
  const contract = new ethers.Contract(address, contractArtifact.abi, wallet);
  
  const batchId = "FC-2026-TEST-" + Date.now();
  console.log("Minting batch:", batchId);
  try {
    const tx = await contract.createBatch(
      batchId,
      "Organic Apples",
      100,
      ethers.keccak256(ethers.toUtf8Bytes("hello world"))
    );
    console.log("Tx sent:", tx.hash);
    await tx.wait();
    console.log("Tx mined!");
    
    // Now test retrieval
    const details = await contract.getBatchDetails(batchId);
    console.log("Success! Returned details:", {
        batchId_: details.batchId_,
        cropName: details.cropName,
        quantity: Number(details.quantity)
    });
  } catch (e) {
    console.log("Failed. Error message:", e.reason || e.shortMessage || e.message);
  }
}

mintAndTest();
