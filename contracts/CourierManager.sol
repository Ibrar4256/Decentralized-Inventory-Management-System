// SPDX-License-Identifier: MIT
pragma solidity ^0.5.16;

contract CourierManager {
    address[100] public owners;
    string[100] public titles;
    string[100] public descriptions;

    event CourierAdded(uint256 id, string title, string description, address courier);
    event CourierRemoved(uint256 id);

    function addCourier(string memory _title, string memory _description) public payable returns (uint256) {
        require(msg.value > 0, "You must send some ETH to add a courier.");

        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == address(0)) { // Check for unoccupied slot
                owners[i] = msg.sender; // Store sender address
                titles[i] = _title; // Store title
                descriptions[i] = _description; // Store description
                emit CourierAdded(i, _title, _description, msg.sender); // Emit event
                return i; // Return the index of the added courier
            }
        }
        revert("No space available for more couriers."); // Add revert statement if full
    }

    function removeCourier(uint256 _id) public {
        require(owners[_id] == msg.sender, "You must be the owner of the courier to remove it.");
        owners[_id] = address(0);
        emit CourierRemoved(_id);
    }

    function getAddresses() public view returns (address[100] memory) {
        return owners;
    }

    function getAddress(uint256 _id) public view returns (address) {
        return owners[_id];
    }

    function getTitle(uint256 _id) public view returns (string memory) {
        return titles[_id];
    }

    function getDescription(uint256 _id) public view returns (string memory) {
        return descriptions[_id];
    }

    function getCourier(uint256 _id) public view returns (address, string memory, string memory) {
        return (owners[_id], titles[_id], descriptions[_id]);
    }
}
