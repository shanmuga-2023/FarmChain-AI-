// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("🌾 Deploying FarmChain AI Smart Contracts to EVM...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy ProductRegistry
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy();
  await productRegistry.waitForDeployment();
  console.log("✅ ProductRegistry deployed to:", await productRegistry.getAddress());

  // 2. Deploy MarketplaceEscrow
  const MarketplaceEscrow = await hre.ethers.getContractFactory("MarketplaceEscrow");
  const marketplaceEscrow = await MarketplaceEscrow.deploy();
  await marketplaceEscrow.waitForDeployment();
  console.log("✅ MarketplaceEscrow deployed to:", await marketplaceEscrow.getAddress());

  // 3. Deploy SupplyChainTracker
  const SupplyChainTracker = await hre.ethers.getContractFactory("SupplyChainTracker");
  const supplyChainTracker = await SupplyChainTracker.deploy();
  await supplyChainTracker.waitForDeployment();
  console.log("✅ SupplyChainTracker deployed to:", await supplyChainTracker.getAddress());

  // 4. Deploy QualityCertifier
  const QualityCertifier = await hre.ethers.getContractFactory("QualityCertifier");
  const qualityCertifier = await QualityCertifier.deploy();
  await qualityCertifier.waitForDeployment();
  console.log("✅ QualityCertifier deployed to:", await qualityCertifier.getAddress());

  console.log("\n🚀 All smart contracts successfully deployed and ready for Web3 integration!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
