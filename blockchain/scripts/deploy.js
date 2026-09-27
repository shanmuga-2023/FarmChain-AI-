// blockchain/scripts/deploy.js
// Deploys AgriSupplyChain to Polygon Amoy (or local Hardhat network)
// and exports ABI + address to frontend and backend configurations.
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  const chainId = hre.network.config.chainId || "unknown";

  console.log("=".repeat(60));
  console.log("🌾 FarmChain AI — AgriSupplyChain Deployment");
  console.log("=".repeat(60));
  console.log(`  Network:  ${network}`);
  console.log(`  Chain ID: ${chainId}`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`  Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`  Balance:  ${hre.ethers.formatEther(balance)} POL / MATIC`);
  console.log("-".repeat(60));

  if (balance === 0n && network === "polygonAmoy") {
    console.warn("\n⚠️ WARNING: Deployer balance is 0 POL!");
    console.warn("Please get testnet POL from the faucet before deploying:");
    console.warn("👉 https://faucet.polygon.technology/");
    console.warn("Deployer Address: " + deployer.address);
    process.exit(1);
  }

  // Deploy AgriSupplyChain
  console.log("\n📦 Deploying AgriSupplyChain...");
  const AgriSupplyChain = await hre.ethers.getContractFactory("AgriSupplyChain");

  let deployOverrides = {};
  if (network === "polygonAmoy") {
    // Polygon Amoy minimum tip is 25 Gwei. We use 25.5 Gwei and 30 Gwei max fee.
    // At 3,000,000 gas limit, total max cost is 0.09 POL (fits safely within 0.1 POL balance).
    const maxPriorityFeePerGas = 25500000000n; // 25.5 Gwei
    const maxFeePerGas = 30000000000n;         // 30.0 Gwei
    const gasLimit = 3000000n;                 // 3,000,000 gas to safely store contract bytecode

    console.log(`  Max Priority Fee (Tip): ${hre.ethers.formatUnits(maxPriorityFeePerGas, "gwei")} Gwei`);
    console.log(`  Max Fee Per Gas:        ${hre.ethers.formatUnits(maxFeePerGas, "gwei")} Gwei`);
    console.log(`  Gas Limit:              ${gasLimit.toString()}`);

    deployOverrides = {
      maxPriorityFeePerGas,
      maxFeePerGas,
      gasLimit
    };
  }

  const contract = await AgriSupplyChain.deploy(deployOverrides);
  console.log("  Waiting for transaction confirmation on Polygon Amoy...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const txHash = deployTx ? deployTx.hash : "N/A";

  console.log("\n" + "=".repeat(60));
  console.log("✅ AgriSupplyChain DEPLOYED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log(`  Contract Address:  ${contractAddress}`);
  console.log(`  Deployment Tx:     ${txHash}`);
  console.log(`  Network:           ${network}`);
  console.log(`  Chain ID:          ${chainId}`);
  console.log(`  Deployer (Admin):  ${deployer.address}`);
  console.log("=".repeat(60));

  if (network === "polygonAmoy") {
    console.log(`\n🔗 PolygonScan (Amoy): https://amoy.polygonscan.com/address/${contractAddress}`);
    console.log(`🔗 Deployment Tx:     https://amoy.polygonscan.com/tx/${txHash}`);
  }

  // Export contract artifact & address to frontend and backend
  exportContractDetails(contractAddress, network, chainId);

  console.log(`\n📋 Add to your .env file:`);
  console.log(`   AGRI_CONTRACT_ADDRESS=${contractAddress}`);
  console.log();
}

function exportContractDetails(address, network, chainId) {
  const artifactPath = path.join(__dirname, "../artifacts/contracts/AgriSupplyChain.sol/AgriSupplyChain.json");
  if (!fs.existsSync(artifactPath)) {
    console.warn("Artifact not found at", artifactPath);
    return;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const deploymentInfo = {
    address: address,
    network: network,
    chainId: chainId,
    abi: artifact.abi
  };

  // 1. Frontend target
  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendDir, "AgriSupplyChain.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`💾 Exported to frontend: frontend/src/contracts/AgriSupplyChain.json`);

  // 2. Backend target
  const backendDir = path.join(__dirname, "../../backend/config");
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backendDir, "contractConfig.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`💾 Exported to backend:  backend/config/contractConfig.json`);
}

module.exports = { exportContractDetails };

if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
  });
}
