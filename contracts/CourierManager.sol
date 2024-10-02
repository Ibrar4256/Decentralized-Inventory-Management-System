pragma solidity ^0.5.16;

contract CourierManager {
    address[100] public owners;
    string[100] public titles;
    string[100] public descriptions;

    event CourierAdded(uint256 id, string title, string description, address courier);
    event CourierRemoved(uint256 id);

    // Add courier with title, description, and value
    function addCourier(string memory _title, string memory _description ) public payable returns (uint256) {
        require(msg.value > 0, "You must send some ETH to add a courier.");

        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == address(0)) { // Corrected comparison operator
                owners[i] = msg.sender; // Store sender address
                titles[i] = _title; // Store title
                descriptions[i] = _description; // Store description
                emit CourierAdded(i, _title, _description, msg.sender); // Emit event with the value field
                return i; // Return the index of the added courier
            }
        }
        revert("No space available for more couriers."); // Revert if array is full
    }

    // Remove courier by ID
    function removeCourier(uint256 _id) public {
        require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
        require(owners[_id] == msg.sender, "You must be the owner of the courier to remove it.");

        owners[_id] = address(0); // Reset the owner's address
        titles[_id] = ""; // Reset the title
        descriptions[_id] = ""; // Reset the description

        emit CourierRemoved(_id); // Emit event for removal
    }

    // Getter functions
    function getAddresses() public view returns (address[100] memory) {
        return owners;
    }

    function getAddress(uint256 _id) public view returns (address) {
        require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
        return owners[_id];
    }

    function getTitle(uint256 _id) public view returns (string memory) {
        require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
        return titles[_id];
    }

    function getDescription(uint256 _id) public view returns (string memory) {
        require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
        return descriptions[_id];
    }

    // Retrieve full courier information including value
    function getCourier(uint256 _id) public view returns (address, string memory, string memory) {
        require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
        return (owners[_id], titles[_id], descriptions[_id]);
    }
}
