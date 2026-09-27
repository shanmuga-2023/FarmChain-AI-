// blockchain/test/AgriSupplyChain.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgriSupplyChain", function () {
  let contract;
  let admin, farmer, inspector, buyer, outsider;

  const FARMER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("FARMER_ROLE"));
  const QUALITY_INSPECTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("QUALITY_INSPECTOR_ROLE"));

  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("batch-data-hash-sample"));
  const certHash = ethers.keccak256(ethers.toUtf8Bytes("certificate-doc-hash"));

  beforeEach(async function () {
    [admin, farmer, inspector, buyer, outsider] = await ethers.getSigners();

    const AgriSupplyChain = await ethers.getContractFactory("AgriSupplyChain");
    contract = await AgriSupplyChain.deploy();
    await contract.waitForDeployment();

    // Grant roles
    await contract.connect(admin).addFarmer(farmer.address);
    await contract.connect(admin).addInspector(inspector.address);
  });

  // ==========================================
  // 1. Batch Creation
  // ==========================================
  describe("Batch Creation", function () {
    it("should create a batch successfully", async function () {
      await expect(
        contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash)
      ).to.emit(contract, "BatchCreated")
        .withArgs("BATCH-001", "Rice", 500, sampleHash, farmer.address, await getBlockTimestamp());

      const batch = await contract.getBatch("BATCH-001");
      expect(batch.batchId_).to.equal("BATCH-001");
      expect(batch.cropName).to.equal("Rice");
      expect(batch.quantity).to.equal(500);
      expect(batch.dataHash).to.equal(sampleHash);
      expect(batch.currentOwner).to.equal(farmer.address);
    });

    it("should increment totalBatches counter", async function () {
      expect(await contract.totalBatches()).to.equal(0);
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
      expect(await contract.totalBatches()).to.equal(1);
      await contract.connect(farmer).createBatch("BATCH-002", "Wheat", 300, sampleHash);
      expect(await contract.totalBatches()).to.equal(2);
    });

    it("should record initial ownership in history", async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
      const history = await contract.getOwnershipHistory("BATCH-001");
      expect(history.length).to.equal(1);
      expect(history[0].from).to.equal(ethers.ZeroAddress);
      expect(history[0].to).to.equal(farmer.address);
    });
  });

  // ==========================================
  // 2. Duplicate Prevention
  // ==========================================
  describe("Duplicate Prevention", function () {
    it("should reject duplicate batchId", async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
      await expect(
        contract.connect(farmer).createBatch("BATCH-001", "Wheat", 300, sampleHash)
      ).to.be.revertedWith("AgriSupplyChain: batch already exists");
    });
  });

  // ==========================================
  // 3. Ownership Transfer
  // ==========================================
  describe("Ownership Transfer", function () {
    beforeEach(async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
    });

    it("should transfer ownership successfully", async function () {
      await expect(
        contract.connect(farmer).transferOwnership("BATCH-001", buyer.address)
      ).to.emit(contract, "OwnershipTransferred")
        .withArgs("BATCH-001", farmer.address, buyer.address, await getBlockTimestamp());

      const batch = await contract.getBatch("BATCH-001");
      expect(batch.currentOwner).to.equal(buyer.address);
    });

    it("should record transfer in ownership history", async function () {
      await contract.connect(farmer).transferOwnership("BATCH-001", buyer.address);
      const history = await contract.getOwnershipHistory("BATCH-001");
      expect(history.length).to.equal(2);
      expect(history[1].from).to.equal(farmer.address);
      expect(history[1].to).to.equal(buyer.address);
    });

    it("should allow chained transfers", async function () {
      await contract.connect(farmer).transferOwnership("BATCH-001", buyer.address);
      await contract.connect(buyer).transferOwnership("BATCH-001", outsider.address);
      const batch = await contract.getBatch("BATCH-001");
      expect(batch.currentOwner).to.equal(outsider.address);

      const history = await contract.getOwnershipHistory("BATCH-001");
      expect(history.length).to.equal(3);
    });
  });

  // ==========================================
  // 4. Unauthorized Transfer Rejection
  // ==========================================
  describe("Unauthorized Transfer Rejection", function () {
    beforeEach(async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
    });

    it("should reject transfer by non-owner", async function () {
      await expect(
        contract.connect(outsider).transferOwnership("BATCH-001", buyer.address)
      ).to.be.revertedWith("AgriSupplyChain: caller is not the current owner");
    });

    it("should reject transfer to self", async function () {
      await expect(
        contract.connect(farmer).transferOwnership("BATCH-001", farmer.address)
      ).to.be.revertedWith("AgriSupplyChain: cannot transfer to self");
    });
  });

  // ==========================================
  // 5. Zero Address Rejection
  // ==========================================
  describe("Zero Address Rejection", function () {
    beforeEach(async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
    });

    it("should reject transfer to zero address", async function () {
      await expect(
        contract.connect(farmer).transferOwnership("BATCH-001", ethers.ZeroAddress)
      ).to.be.revertedWith("AgriSupplyChain: cannot transfer to zero address");
    });
  });

  // ==========================================
  // 6. Price Update + History
  // ==========================================
  describe("Price Update + History", function () {
    beforeEach(async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
    });

    it("should update price and emit event", async function () {
      await expect(
        contract.connect(farmer).updatePrice("BATCH-001", 8500)
      ).to.emit(contract, "PriceUpdated")
        .withArgs("BATCH-001", 8500, farmer.address, await getBlockTimestamp());

      const batch = await contract.getBatch("BATCH-001");
      expect(batch.pricePerUnit).to.equal(8500);
    });

    it("should maintain full price history", async function () {
      await contract.connect(farmer).updatePrice("BATCH-001", 8500);
      await contract.connect(farmer).updatePrice("BATCH-001", 9200);
      await contract.connect(farmer).updatePrice("BATCH-001", 8800);

      const history = await contract.getPriceHistory("BATCH-001");
      expect(history.length).to.equal(3);
      expect(history[0].pricePerUnit).to.equal(8500);
      expect(history[1].pricePerUnit).to.equal(9200);
      expect(history[2].pricePerUnit).to.equal(8800);
    });

    it("should reject price update from non-owner", async function () {
      await expect(
        contract.connect(outsider).updatePrice("BATCH-001", 8500)
      ).to.be.revertedWith("AgriSupplyChain: caller is not the current owner");
    });

    it("should reject zero price", async function () {
      await expect(
        contract.connect(farmer).updatePrice("BATCH-001", 0)
      ).to.be.revertedWith("AgriSupplyChain: price must be > 0");
    });
  });

  // ==========================================
  // 7. Quality Certificates
  // ==========================================
  describe("Quality Certificates", function () {
    beforeEach(async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
    });

    it("should add quality certificate and emit event", async function () {
      await expect(
        contract.connect(inspector).addQualityCertificate("BATCH-001", "CERT-001", "A+", certHash)
      ).to.emit(contract, "QualityCertificateAdded");

      const history = await contract.getQualityHistory("BATCH-001");
      expect(history.length).to.equal(1);
      expect(history[0].certificateId).to.equal("CERT-001");
      expect(history[0].grade).to.equal("A+");
      expect(history[0].certificateHash).to.equal(certHash);
      expect(history[0].inspector).to.equal(inspector.address);
    });

    it("should allow multiple certificates", async function () {
      await contract.connect(inspector).addQualityCertificate("BATCH-001", "CERT-001", "A+", certHash);
      await contract.connect(inspector).addQualityCertificate("BATCH-001", "CERT-002", "A", certHash);

      const history = await contract.getQualityHistory("BATCH-001");
      expect(history.length).to.equal(2);
    });
  });

  // ==========================================
  // 8. Unauthorized Certificate Rejection
  // ==========================================
  describe("Unauthorized Certificate Rejection", function () {
    beforeEach(async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
    });

    it("should reject certificate from non-inspector", async function () {
      await expect(
        contract.connect(outsider).addQualityCertificate("BATCH-001", "CERT-001", "A+", certHash)
      ).to.be.reverted;
    });

    it("should reject certificate from farmer (no inspector role)", async function () {
      await expect(
        contract.connect(buyer).addQualityCertificate("BATCH-001", "CERT-001", "A+", certHash)
      ).to.be.reverted;
    });
  });

  // ==========================================
  // 9. Hash Verification
  // ==========================================
  describe("Hash Verification", function () {
    beforeEach(async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
    });

    it("should return true for matching hash", async function () {
      const result = await contract.verifyBatchHash("BATCH-001", sampleHash);
      expect(result).to.be.true;
    });

    it("should return false for non-matching hash", async function () {
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong-data"));
      const result = await contract.verifyBatchHash("BATCH-001", wrongHash);
      expect(result).to.be.false;
    });
  });

  // ==========================================
  // 10. Invalid Batch Handling
  // ==========================================
  describe("Invalid Batch Handling", function () {
    it("should revert getBatch for non-existent batch", async function () {
      await expect(
        contract.getBatch("NON-EXISTENT")
      ).to.be.revertedWith("AgriSupplyChain: batch does not exist");
    });

    it("should revert transferOwnership for non-existent batch", async function () {
      await expect(
        contract.connect(farmer).transferOwnership("NON-EXISTENT", buyer.address)
      ).to.be.revertedWith("AgriSupplyChain: batch does not exist");
    });

    it("should revert updatePrice for non-existent batch", async function () {
      await expect(
        contract.connect(farmer).updatePrice("NON-EXISTENT", 100)
      ).to.be.revertedWith("AgriSupplyChain: batch does not exist");
    });

    it("should revert addQualityCertificate for non-existent batch", async function () {
      await expect(
        contract.connect(inspector).addQualityCertificate("NON-EXISTENT", "CERT-001", "A", certHash)
      ).to.be.revertedWith("AgriSupplyChain: batch does not exist");
    });

    it("should revert verifyBatchHash for non-existent batch", async function () {
      await expect(
        contract.verifyBatchHash("NON-EXISTENT", sampleHash)
      ).to.be.revertedWith("AgriSupplyChain: batch does not exist");
    });

    it("should return false for verifyBatch when batch does not exist", async function () {
      const result = await contract.verifyBatch("NON-EXISTENT");
      expect(result.isValid).to.be.false;
    });
  });

  // ==========================================
  // 10b. Stages & Traceability Lifecycle
  // ==========================================
  describe("Stages & Traceability Lifecycle", function () {
    beforeEach(async function () {
      await contract.connect(farmer).createBatch("BATCH-001", "Rice", 500, sampleHash);
    });

    it("should start at Harvested stage", async function () {
      const details = await contract.getBatchDetails("BATCH-001");
      expect(details.currentStage).to.equal(0); // Harvested
    });

    it("should transition through stages: InTransit -> QualityChecked -> AtRetailer -> Sold", async function () {
      // InTransit
      await contract.connect(farmer).updateStage("BATCH-001", 1, "Highway Transit Zone A", 3000);
      let details = await contract.getBatchDetails("BATCH-001");
      expect(details.currentStage).to.equal(1);
      expect(details.pricePerUnit).to.equal(3000);

      // QualityChecked
      await contract.connect(farmer).updateStage("BATCH-001", 2, "Agri Central Lab", 3500);
      details = await contract.getBatchDetails("BATCH-001");
      expect(details.currentStage).to.equal(2);

      // Transfer to retailer
      await contract.connect(farmer).transferOwnership("BATCH-001", buyer.address);

      // AtRetailer
      await contract.connect(buyer).updateStage("BATCH-001", 3, "Metro Supermarket", 4500);
      details = await contract.getBatchDetails("BATCH-001");
      expect(details.currentStage).to.equal(3);
      expect(details.pricePerUnit).to.equal(4500);

      // Sold
      await contract.connect(buyer).updateStage("BATCH-001", 4, "Store Counter", 4500);
      details = await contract.getBatchDetails("BATCH-001");
      expect(details.currentStage).to.equal(4);

      // Verify stage history
      const history = await contract.getStageHistory("BATCH-001");
      expect(history.length).to.equal(5); // 0 (init) + 4 updates
    });

    it("consumer verifyBatch should return validity, owner, and stage", async function () {
      const verification = await contract.verifyBatch("BATCH-001");
      expect(verification.isValid).to.be.true;
      expect(verification.currentOwner).to.equal(farmer.address);
      expect(verification.currentStage).to.equal(0);
      expect(verification.certCount).to.equal(0);
    });
  });

  // ==========================================
  // 11. Event Emission
  // ==========================================
  describe("Event Emission", function () {
    it("should emit BatchCreated with correct args", async function () {
      const tx = await contract.connect(farmer).createBatch("BATCH-EVT", "Mango", 200, sampleHash);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        l => l.fragment && l.fragment.name === "BatchCreated"
      );
      expect(event).to.not.be.undefined;
    });

    it("should emit PriceUpdated with correct args", async function () {
      await contract.connect(farmer).createBatch("BATCH-EVT", "Mango", 200, sampleHash);
      const tx = await contract.connect(farmer).updatePrice("BATCH-EVT", 4500);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        l => l.fragment && l.fragment.name === "PriceUpdated"
      );
      expect(event).to.not.be.undefined;
    });
  });

  // ==========================================
  // 12. Role-based Access
  // ==========================================
  describe("Role-based Access", function () {
    it("should reject batch creation from non-farmer", async function () {
      await expect(
        contract.connect(outsider).createBatch("BATCH-X", "Rice", 100, sampleHash)
      ).to.be.reverted;
    });

    it("admin should be able to add farmers and inspectors", async function () {
      await contract.connect(admin).addFarmer(outsider.address);
      // Now outsider should be able to create batch
      await expect(
        contract.connect(outsider).createBatch("BATCH-X", "Rice", 100, sampleHash)
      ).to.not.be.reverted;
    });

    it("should reject empty batchId", async function () {
      await expect(
        contract.connect(farmer).createBatch("", "Rice", 100, sampleHash)
      ).to.be.revertedWith("AgriSupplyChain: batchId cannot be empty");
    });

    it("should reject zero quantity", async function () {
      await expect(
        contract.connect(farmer).createBatch("BATCH-X", "Rice", 0, sampleHash)
      ).to.be.revertedWith("AgriSupplyChain: quantity must be > 0");
    });
  });

  // Helper to get the next block timestamp
  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp + 1;
  }
});
