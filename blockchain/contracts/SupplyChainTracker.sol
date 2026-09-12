// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChainTracker
 * @dev Immutable checkpoint logging for produce journey from harvest to retail
 */
contract SupplyChainTracker {
    enum CheckpointType { Harvested, QualityInspected, InTransit, ColdStorageStored, RetailShelfed, ConsumerPurchased }

    struct Checkpoint {
        string checkpointId;
        string productId;
        CheckpointType checkpointType;
        string location;
        string actorName;
        address actorAddress;
        string notes;
        int256 temperatureCelsius; // For cold-chain monitoring (multiplied by 10, e.g. 4.5 C = 45)
        uint256 timestamp;
    }

    mapping(string => Checkpoint[]) private productCheckpoints;
    uint256 public totalCheckpoints;

    event CheckpointLogged(
        string indexed checkpointId,
        string indexed productId,
        CheckpointType checkpointType,
        string location,
        address indexed actorAddress,
        uint256 timestamp
    );

    function logCheckpoint(
        string memory _checkpointId,
        string memory _productId,
        CheckpointType _type,
        string memory _location,
        string memory _actorName,
        string memory _notes,
        int256 _tempCelsius
    ) external returns (bool) {
        require(bytes(_productId).length > 0, "Product ID required");

        Checkpoint memory cp = Checkpoint({
            checkpointId: _checkpointId,
            productId: _productId,
            checkpointType: _type,
            location: _location,
            actorName: _actorName,
            actorAddress: msg.sender,
            notes: _notes,
            temperatureCelsius: _tempCelsius,
            timestamp: block.timestamp
        });

        productCheckpoints[_productId].push(cp);
        totalCheckpoints++;

        emit CheckpointLogged(_checkpointId, _productId, _type, _location, msg.sender, block.timestamp);
        return true;
    }

    function getProductCheckpoints(string memory _productId) external view returns (Checkpoint[] memory) {
        return productCheckpoints[_productId];
    }
}
