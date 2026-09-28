import { ethers } from 'ethers';
import fs from 'fs';

async function test() {
  const rpcUrl = "https://polygon-amoy-bor-rpc.publicnode.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl, 80002);
  const address = "0xEfAE2C6BBE660F2Ebd22C09D6f04394aF0a4738A";
  
  const contractArtifact = JSON.parse(fs.readFileSync('frontend/src/contracts/AgriSupplyChain.json'));
  const contract = new ethers.Contract(address, contractArtifact.abi, provider);
  
  try {
    const filter = contract.filters.BatchCreated();
    const events = await contract.queryFilter(filter, -10000);
    console.log("Events found:", events.length);
    events.slice(-5).forEach(e => {
        console.log("Batch ID:", e.args[0]);
    });
  } catch (e) {
    console.log("Failed. Error message:", e.reason || e.shortMessage || e.message);
  }
}

test();
