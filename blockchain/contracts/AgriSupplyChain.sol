// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AgriSupplyChain
 * @author FarmChain AI
 * @notice Manages agricultural produce batch lifecycle on-chain:
 *         batch registration, stage transitions (Harvested -> In Transit -> Quality Checked -> At Retailer -> Sold),
 *         ownership transfers, price tracking, quality certificates, and SHA-256 data hash verification.
 * @dev Uses OpenZeppelin AccessControl for role-based permissions (ADMIN, FARMER, INTERMEDIARY, RETAILER, QUALITY_INSPECTOR).
 */
contract AgriSupplyChain is AccessControl {
    // ==========================================
    // Roles
    // ==========================================

    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant INTERMEDIARY_ROLE = keccak256("INTERMEDIARY_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant QUALITY_INSPECTOR_ROLE = keccak256("QUALITY_INSPECTOR_ROLE");

    // ==========================================
    // Enums & Structs
    // ==========================================

    enum Stage {
        Harvested,       // 0
        InTransit,       // 1
        QualityChecked,  // 2
        AtRetailer,      // 3
        Sold             // 4
    }

    struct Batch {
        string batchId;
        string cropName;
        uint256 quantity;
        bytes32 dataHash;
        address currentOwner;
        uint256 pricePerUnit;
        Stage currentStage;
        uint256 createdAt;
        bool exists;
    }

    struct OwnershipRecord {
        address from;
        address to;
        uint256 timestamp;
    }

    struct PriceRecord {
        uint256 pricePerUnit;
        address updatedBy;
        uint256 timestamp;
    }

    struct StageRecord {
        Stage stage;
        address updatedBy;
        string location;
        uint256 price;
        uint256 timestamp;
    }

    struct QualityCertRecord {
        string certificateId;
        string grade;
        bytes32 certificateHash;
        address inspector;
        uint256 timestamp;
    }

    // ==========================================
    // State Variables
    // ==========================================

    mapping(string => Batch) private batches;
    mapping(string => OwnershipRecord[]) private ownershipHistory;
    mapping(string => PriceRecord[]) private priceHistory;
    mapping(string => StageRecord[]) private stageHistory;
    mapping(string => QualityCertRecord[]) private qualityHistory;

    uint256 public totalBatches;

    // ==========================================
    // Events
    // ==========================================

    event BatchCreated(
        string indexed batchId,
        string cropName,
        uint256 quantity,
        bytes32 dataHash,
        address indexed owner,
        uint256 timestamp
    );

    event OwnershipTransferred(
        string indexed batchId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );

    event PriceUpdated(
        string indexed batchId,
        uint256 newPrice,
        address indexed updatedBy,
        uint256 timestamp
    );

    event StageUpdated(
        string indexed batchId,
        Stage stage,
        address indexed updatedBy,
        string location,
        uint256 price,
        uint256 timestamp
    );

    event QualityCertificateAdded(
        string indexed batchId,
        string certificateId,
        string grade,
        bytes32 certificateHash,
        address indexed inspector,
        uint256 timestamp
    );

    // ==========================================
    // Constructor
    // ==========================================

    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(FARMER_ROLE, msg.sender);
        _grantRole(INTERMEDIARY_ROLE, msg.sender);
        _grantRole(RETAILER_ROLE, msg.sender);
        _grantRole(QUALITY_INSPECTOR_ROLE, msg.sender);
    }

    // ==========================================
    // Write Functions
    // ==========================================

    /**
     * @notice Create a new agricultural batch on-chain.
     */
    function createBatch(
        string calldata batchId,
        string calldata cropName,
        uint256 quantity,
        bytes32 dataHash
    ) external onlyRole(FARMER_ROLE) {
        require(!batches[batchId].exists, "AgriSupplyChain: batch already exists");
        require(bytes(batchId).length > 0, "AgriSupplyChain: batchId cannot be empty");
        require(bytes(cropName).length > 0, "AgriSupplyChain: cropName cannot be empty");
        require(quantity > 0, "AgriSupplyChain: quantity must be > 0");

        batches[batchId] = Batch({
            batchId: batchId,
            cropName: cropName,
            quantity: quantity,
            dataHash: dataHash,
            currentOwner: msg.sender,
            pricePerUnit: 0,
            currentStage: Stage.Harvested,
            createdAt: block.timestamp,
            exists: true
        });

        ownershipHistory[batchId].push(OwnershipRecord({
            from: address(0),
            to: msg.sender,
            timestamp: block.timestamp
        }));

        stageHistory[batchId].push(StageRecord({
            stage: Stage.Harvested,
            updatedBy: msg.sender,
            location: "Origin Farm",
            price: 0,
            timestamp: block.timestamp
        }));

        totalBatches++;

        emit BatchCreated(batchId, cropName, quantity, dataHash, msg.sender, block.timestamp);
        emit StageUpdated(batchId, Stage.Harvested, msg.sender, "Origin Farm", 0, block.timestamp);
    }

    /**
     * @notice Transfer ownership of a batch to a new address.
     */
    function transferOwnership(
        string calldata batchId,
        address newOwner
    ) external {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        require(batches[batchId].currentOwner == msg.sender, "AgriSupplyChain: caller is not the current owner");
        require(newOwner != address(0), "AgriSupplyChain: cannot transfer to zero address");
        require(newOwner != msg.sender, "AgriSupplyChain: cannot transfer to self");

        address previousOwner = batches[batchId].currentOwner;
        batches[batchId].currentOwner = newOwner;

        ownershipHistory[batchId].push(OwnershipRecord({
            from: previousOwner,
            to: newOwner,
            timestamp: block.timestamp
        }));

        emit OwnershipTransferred(batchId, previousOwner, newOwner, block.timestamp);
    }

    /**
     * @notice Update the price per unit for a batch.
     */
    function updatePrice(
        string calldata batchId,
        uint256 pricePerUnit
    ) external {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        require(batches[batchId].currentOwner == msg.sender, "AgriSupplyChain: caller is not the current owner");
        require(pricePerUnit > 0, "AgriSupplyChain: price must be > 0");

        batches[batchId].pricePerUnit = pricePerUnit;

        priceHistory[batchId].push(PriceRecord({
            pricePerUnit: pricePerUnit,
            updatedBy: msg.sender,
            timestamp: block.timestamp
        }));

        emit PriceUpdated(batchId, pricePerUnit, msg.sender, block.timestamp);
    }

    /**
     * @notice Transition a batch to a new supply chain stage with location and price.
     */
    function updateStage(
        string calldata batchId,
        Stage stage,
        string calldata location,
        uint256 price
    ) external {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        require(
            batches[batchId].currentOwner == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "AgriSupplyChain: caller is not the owner or admin"
        );

        batches[batchId].currentStage = stage;
        if (price > 0) {
            batches[batchId].pricePerUnit = price;
            priceHistory[batchId].push(PriceRecord({
                pricePerUnit: price,
                updatedBy: msg.sender,
                timestamp: block.timestamp
            }));
            emit PriceUpdated(batchId, price, msg.sender, block.timestamp);
        }

        stageHistory[batchId].push(StageRecord({
            stage: stage,
            updatedBy: msg.sender,
            location: location,
            price: price,
            timestamp: block.timestamp
        }));

        emit StageUpdated(batchId, stage, msg.sender, location, price, block.timestamp);
    }

    /**
     * @notice Add a quality certificate to a batch.
     */
    function addQualityCertificate(
        string calldata batchId,
        string calldata certificateId,
        string calldata grade,
        bytes32 certificateHash
    ) external onlyRole(QUALITY_INSPECTOR_ROLE) {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        require(bytes(certificateId).length > 0, "AgriSupplyChain: certificateId cannot be empty");
        require(bytes(grade).length > 0, "AgriSupplyChain: grade cannot be empty");

        qualityHistory[batchId].push(QualityCertRecord({
            certificateId: certificateId,
            grade: grade,
            certificateHash: certificateHash,
            inspector: msg.sender,
            timestamp: block.timestamp
        }));

        emit QualityCertificateAdded(batchId, certificateId, grade, certificateHash, msg.sender, block.timestamp);
    }

    // ==========================================
    // Read Functions
    // ==========================================

    /**
     * @notice Get basic batch details (backward compatible).
     */
    function getBatch(string calldata batchId) external view returns (
        string memory batchId_,
        string memory cropName,
        uint256 quantity,
        bytes32 dataHash,
        address currentOwner,
        uint256 pricePerUnit,
        uint256 createdAt
    ) {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        Batch storage b = batches[batchId];
        return (b.batchId, b.cropName, b.quantity, b.dataHash, b.currentOwner, b.pricePerUnit, b.createdAt);
    }

    /**
     * @notice Get full batch details including current stage.
     */
    function getBatchDetails(string calldata batchId) external view returns (
        string memory batchId_,
        string memory cropName,
        uint256 quantity,
        bytes32 dataHash,
        address currentOwner,
        uint256 pricePerUnit,
        Stage currentStage,
        uint256 createdAt,
        uint256 certCount
    ) {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        Batch storage b = batches[batchId];
        return (
            b.batchId,
            b.cropName,
            b.quantity,
            b.dataHash,
            b.currentOwner,
            b.pricePerUnit,
            b.currentStage,
            b.createdAt,
            qualityHistory[batchId].length
        );
    }

    /**
     * @notice Public verification for consumers scanning a QR code.
     */
    function verifyBatch(string calldata batchId) external view returns (
        bool isValid,
        address currentOwner,
        Stage currentStage,
        uint256 certCount,
        bytes32 dataHash
    ) {
        if (!batches[batchId].exists) {
            return (false, address(0), Stage.Harvested, 0, bytes32(0));
        }
        Batch storage b = batches[batchId];
        return (true, b.currentOwner, b.currentStage, qualityHistory[batchId].length, b.dataHash);
    }

    /**
     * @notice Verify whether a provided data hash matches the batch's on-chain record.
     */
    function verifyBatchHash(string calldata batchId, bytes32 dataHash) external view returns (bool) {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        return batches[batchId].dataHash == dataHash;
    }

    /**
     * @notice Get full price history for a batch.
     */
    function getPriceHistory(string calldata batchId) external view returns (PriceRecord[] memory) {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        return priceHistory[batchId];
    }

    /**
     * @notice Get full ownership history for a batch.
     */
    function getOwnershipHistory(string calldata batchId) external view returns (OwnershipRecord[] memory) {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        return ownershipHistory[batchId];
    }

    /**
     * @notice Get full stage history for a batch.
     */
    function getStageHistory(string calldata batchId) external view returns (StageRecord[] memory) {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        return stageHistory[batchId];
    }

    /**
     * @notice Get full quality certificate history for a batch.
     */
    function getQualityHistory(string calldata batchId) external view returns (QualityCertRecord[] memory) {
        require(batches[batchId].exists, "AgriSupplyChain: batch does not exist");
        return qualityHistory[batchId];
    }

    // ==========================================
    // Role Management Admin Functions
    // ==========================================

    function addFarmer(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(FARMER_ROLE, account);
    }

    function addIntermediary(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(INTERMEDIARY_ROLE, account);
    }

    function addRetailer(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(RETAILER_ROLE, account);
    }

    function addInspector(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(QUALITY_INSPECTOR_ROLE, account);
    }
}
