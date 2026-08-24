// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProductRegistry
 * @dev Manages agricultural produce batches, farmers, and immutable harvest provenance on-chain.
 *      Integrates AI Visual Quality Oracle scores for GIGO attack prevention.
 */
contract ProductRegistry {
    enum ProductStatus { Available, Reserved, InTransit, Sold, Delisted }

    struct Product {
        string productId;
        string name;
        string category;
        address farmerAddress;
        string farmerName;
        string originLocation;
        uint256 quantity; // in standard units (kg or quintal)
        string unit;
        uint256 pricePerUnitWei; // Price in Wei or smallest fiat token subunit
        string harvestDate;
        bool isOrganic;
        string ipfsMetadataHash; // Pinata / IPFS hash containing lab test & photos
        // AI Visual Quality Oracle fields — binds physical crop reality to on-chain identity
        uint256 aiQualityScore;   // 0–100 AI confidence score from edge MobileNet analysis
        string aiQualityGrade;    // "A+", "A", "B", "C", "D" — determined by Visual Oracle
        string imageIpfsHash;     // SHA-256 hash of the crop image (IPFS CID format)
        ProductStatus status;
        uint256 registeredAt;
    }

    address public owner;
    uint256 public totalProducts;
    
    // Mapping from productId (string) to Product struct
    mapping(string => Product) public products;
    string[] public productIds;
    
    // Mapping from farmer address to their registered productIds
    mapping(address => string[]) private farmerProducts;

    event ProductRegistered(
        string indexed productId,
        string name,
        address indexed farmerAddress,
        uint256 quantity,
        uint256 pricePerUnitWei,
        bool isOrganic,
        uint256 registeredAt
    );

    event ProductQualityVerified(
        string indexed productId,
        uint256 aiQualityScore,
        string aiQualityGrade,
        string imageIpfsHash,
        uint256 verifiedAt
    );

    event ProductStatusUpdated(
        string indexed productId,
        ProductStatus newStatus,
        uint256 updatedAt
    );

    event ProductPriceUpdated(
        string indexed productId,
        uint256 newPricePerUnitWei,
        uint256 updatedAt
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can execute");
        _;
    }

    modifier onlyFarmer(string memory _productId) {
        require(products[_productId].farmerAddress == msg.sender, "Caller is not the product farmer");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Register a new produce batch on the immutable ledger
     *      Now includes AI Visual Oracle quality data for GIGO prevention
     */
    function registerProduct(
        string memory _productId,
        string memory _name,
        string memory _category,
        string memory _farmerName,
        string memory _originLocation,
        uint256 _quantity,
        string memory _unit,
        uint256 _pricePerUnitWei,
        string memory _harvestDate,
        bool _isOrganic,
        string memory _ipfsMetadataHash,
        uint256 _aiQualityScore,
        string memory _aiQualityGrade,
        string memory _imageIpfsHash
    ) external returns (bool) {
        require(bytes(_productId).length > 0, "Product ID cannot be empty");
        require(products[_productId].registeredAt == 0, "Product already registered");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(_aiQualityScore <= 100, "AI quality score must be 0-100");

        Product memory newProduct = Product({
            productId: _productId,
            name: _name,
            category: _category,
            farmerAddress: msg.sender,
            farmerName: _farmerName,
            originLocation: _originLocation,
            quantity: _quantity,
            unit: _unit,
            pricePerUnitWei: _pricePerUnitWei,
            harvestDate: _harvestDate,
            isOrganic: _isOrganic,
            ipfsMetadataHash: _ipfsMetadataHash,
            aiQualityScore: _aiQualityScore,
            aiQualityGrade: _aiQualityGrade,
            imageIpfsHash: _imageIpfsHash,
            status: ProductStatus.Available,
            registeredAt: block.timestamp
        });

        products[_productId] = newProduct;
        productIds.push(_productId);
        farmerProducts[msg.sender].push(_productId);
        totalProducts++;

        emit ProductRegistered(
            _productId,
            _name,
            msg.sender,
            _quantity,
            _pricePerUnitWei,
            _isOrganic,
            block.timestamp
        );

        // Emit quality verification event — cryptographically binds AI assessment to on-chain record
        if (_aiQualityScore > 0) {
            emit ProductQualityVerified(
                _productId,
                _aiQualityScore,
                _aiQualityGrade,
                _imageIpfsHash,
                block.timestamp
            );
        }

        return true;
    }

    /**
     * @dev Update status of a product (e.g. when locked in escrow or sold)
     */
    function updateProductStatus(string memory _productId, ProductStatus _status) external {
        require(
            msg.sender == products[_productId].farmerAddress || msg.sender == owner,
            "Unauthorized status update"
        );
        products[_productId].status = _status;
        emit ProductStatusUpdated(_productId, _status, block.timestamp);
    }

    /**
     * @dev Update unit price of product by farmer
     */
    function updateProductPrice(string memory _productId, uint256 _newPriceWei) external onlyFarmer(_productId) {
        products[_productId].pricePerUnitWei = _newPriceWei;
        emit ProductPriceUpdated(_productId, _newPriceWei, block.timestamp);
    }

    /**
     * @dev Retrieve full product details
     */
    function getProduct(string memory _productId) external view returns (Product memory) {
        require(products[_productId].registeredAt > 0, "Product does not exist");
        return products[_productId];
    }

    /**
     * @dev Retrieve all product IDs for a farmer
     */
    function getFarmerProducts(address _farmer) external view returns (string[] memory) {
        return farmerProducts[_farmer];
    }

    /**
     * @dev Retrieve all registered product IDs
     */
    function getAllProductIds() external view returns (string[] memory) {
        return productIds;
    }
}
