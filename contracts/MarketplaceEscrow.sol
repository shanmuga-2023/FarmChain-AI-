// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MarketplaceEscrow
 * @dev Trustless agricultural escrow enforcing the 60% Farmer, 20% Intermediary, 15% Retailer, 5% Platform revenue distribution.
 */
contract MarketplaceEscrow {
    enum OrderStatus { Placed, Funded, Shipped, Delivered, Released, Disputed, Refunded }

    struct Order {
        string orderId;
        string productId;
        address buyer;
        address payable farmer;
        address payable intermediary;
        address payable retailer;
        uint256 totalAmountWei;
        uint256 quantity;
        OrderStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    address payable public platformAdmin;
    uint256 public constant FARMER_BPS = 6000;       // 60.00%
    uint256 public constant INTERMEDIARY_BPS = 2000; // 20.00%
    uint256 public constant RETAILER_BPS = 1500;     // 15.00%
    uint256 public constant PLATFORM_BPS = 500;      // 5.00%
    uint256 public constant BPS_DENOMINATOR = 10000;

    mapping(string => Order) public orders;
    string[] public orderIds;

    event OrderCreated(string indexed orderId, string indexed productId, address indexed buyer, uint256 totalAmountWei);
    event OrderFunded(string indexed orderId, uint256 amountWei);
    event OrderShipped(string indexed orderId, uint256 shippedAt);
    event OrderDelivered(string indexed orderId, uint256 deliveredAt);
    event FundsReleased(
        string indexed orderId,
        uint256 farmerShare,
        uint256 intermediaryShare,
        uint256 retailerShare,
        uint256 platformShare
    );
    event OrderRefunded(string indexed orderId, uint256 refundAmount);

    modifier onlyAdmin() {
        require(msg.sender == platformAdmin, "Only platform admin");
        _;
    }

    constructor() {
        platformAdmin = payable(msg.sender);
    }

    /**
     * @dev Create and fund an agricultural trade escrow order
     */
    function createOrder(
        string memory _orderId,
        string memory _productId,
        address payable _farmer,
        address payable _intermediary,
        address payable _retailer,
        uint256 _quantity
    ) external payable returns (bool) {
        require(bytes(_orderId).length > 0, "Invalid order ID");
        require(msg.value > 0, "Escrow deposit required");
        require(_farmer != address(0), "Invalid farmer address");
        require(orders[_orderId].createdAt == 0, "Order ID already exists");

        orders[_orderId] = Order({
            orderId: _orderId,
            productId: _productId,
            buyer: msg.sender,
            farmer: _farmer,
            intermediary: _intermediary,
            retailer: _retailer,
            totalAmountWei: msg.value,
            quantity: _quantity,
            status: OrderStatus.Funded,
            createdAt: block.timestamp,
            completedAt: 0
        });

        orderIds.push(_orderId);

        emit OrderCreated(_orderId, _productId, msg.sender, msg.value);
        emit OrderFunded(_orderId, msg.value);

        return true;
    }

    /**
     * @dev Confirm produce shipment
     */
    function confirmShipment(string memory _orderId) external {
        Order storage order = orders[_orderId];
        require(
            msg.sender == order.farmer || msg.sender == order.intermediary || msg.sender == platformAdmin,
            "Unauthorized shipment confirmation"
        );
        require(order.status == OrderStatus.Funded, "Order is not funded");

        order.status = OrderStatus.Shipped;
        emit OrderShipped(_orderId, block.timestamp);
    }

    /**
     * @dev Confirm delivery by buyer or scanner, automatically triggering fair payment split
     */
    function confirmDeliveryAndRelease(string memory _orderId) external {
        Order storage order = orders[_orderId];
        require(
            msg.sender == order.buyer || msg.sender == platformAdmin,
            "Only buyer or admin can confirm delivery"
        );
        require(
            order.status == OrderStatus.Funded || order.status == OrderStatus.Shipped,
            "Invalid status for delivery"
        );

        order.status = OrderStatus.Delivered;
        emit OrderDelivered(_orderId, block.timestamp);

        _distributeFunds(_orderId);
    }

    /**
     * @dev Internal automated split calculation
     */
    function _distributeFunds(string memory _orderId) internal {
        Order storage order = orders[_orderId];
        uint256 total = order.totalAmountWei;

        uint256 farmerAmount;
        uint256 intermediaryAmount = 0;
        uint256 retailerAmount = 0;
        uint256 platformAmount;

        if (order.intermediary != address(0) && order.retailer != address(0)) {
            // Complete 4-tier chain
            farmerAmount = (total * FARMER_BPS) / BPS_DENOMINATOR;
            intermediaryAmount = (total * INTERMEDIARY_BPS) / BPS_DENOMINATOR;
            retailerAmount = (total * RETAILER_BPS) / BPS_DENOMINATOR;
            platformAmount = total - farmerAmount - intermediaryAmount - retailerAmount;
        } else if (order.intermediary != address(0)) {
            // Farmer -> Intermediary -> Consumer
            farmerAmount = (total * 7000) / BPS_DENOMINATOR; // 70%
            intermediaryAmount = (total * 2500) / BPS_DENOMINATOR; // 25%
            platformAmount = total - farmerAmount - intermediaryAmount;
        } else {
            // Direct Farmer -> Consumer (Maximum farmer benefit)
            farmerAmount = (total * 9500) / BPS_DENOMINATOR; // 95% direct to farmer
            platformAmount = total - farmerAmount;
        }

        order.status = OrderStatus.Released;
        order.completedAt = block.timestamp;

        // Execute payouts
        order.farmer.transfer(farmerAmount);
        if (intermediaryAmount > 0 && order.intermediary != address(0)) {
            order.intermediary.transfer(intermediaryAmount);
        }
        if (retailerAmount > 0 && order.retailer != address(0)) {
            order.retailer.transfer(retailerAmount);
        }
        platformAdmin.transfer(platformAmount);

        emit FundsReleased(_orderId, farmerAmount, intermediaryAmount, retailerAmount, platformAmount);
    }

    /**
     * @dev Refund buyer in case of dispute or cancellation
     */
    function refundBuyer(string memory _orderId) external onlyAdmin {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Funded || order.status == OrderStatus.Disputed, "Cannot refund");

        order.status = OrderStatus.Refunded;
        order.completedAt = block.timestamp;
        payable(order.buyer).transfer(order.totalAmountWei);

        emit OrderRefunded(_orderId, order.totalAmountWei);
    }

    function getOrder(string memory _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }
}
