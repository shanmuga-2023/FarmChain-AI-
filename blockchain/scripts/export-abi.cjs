// blockchain/scripts/export-abi.cjs
const fs = require("fs");
const path = require("path");

const artifactPath = path.join(__dirname, "../artifacts/contracts/AgriSupplyChain.sol/AgriSupplyChain.json");
if (!fs.existsSync(artifactPath)) {
  console.error("Artifact not found! Run compile first.");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const deploymentInfo = {
  address: process.env.AGRI_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
  network: "polygonAmoy",
  chainId: 80002,
  abi: artifact.abi
};

// Frontend
const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
fs.mkdirSync(frontendDir, { recursive: true });
fs.writeFileSync(path.join(frontendDir, "AgriSupplyChain.json"), JSON.stringify(deploymentInfo, null, 2));
console.log("✅ Exported to frontend/src/contracts/AgriSupplyChain.json");

// Backend
const backendDir = path.join(__dirname, "../../backend/config");
fs.mkdirSync(backendDir, { recursive: true });
fs.writeFileSync(path.join(backendDir, "contractConfig.json"), JSON.stringify(deploymentInfo, null, 2));
console.log("✅ Exported to backend/config/contractConfig.json");
