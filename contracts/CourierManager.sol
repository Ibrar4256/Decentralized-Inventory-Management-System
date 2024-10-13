pragma solidity ^0.5.16;

contract CourierManager {
    address[100] public owners;
    string[100] public titles;
    string[100] public descriptions;
    string[100] public categories;
    string[100] public locations;
    uint256[100] public quantities; // Store quantity as uint256 instead of string


   // uint256 public constant COURIER_FEE = 0.01 ether; // Set a fixed fee for adding a courier

    event CourierAdded(uint256 id, string title, string description, string category, string location, uint256 quantity, address courier);
    event CourierRemoved(uint256 id, uint256 quantities);

    // Add courier with title, description,category, location, and quantity
    function addCourier(string memory _title, string memory _description, string memory _category, string memory _location, uint256 _quantity ) public returns(uint256){
       // require(msg.value > 0, "You must send some ETH to add a courier.");

         // require(msg.value >= COURIER_FEE, "Insufficient fee provided.");

         // Iterate over the array to find the first empty slot
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == address(0)) { // // Slot available if the address is empty
                owners[i] = msg.sender; // Store sender address
                titles[i] = _title; // Store title
                descriptions[i] = _description; // Store description
                categories[i] = _category; // Store category
                locations[i] = _location; // Store location
                quantities[i] = _quantity; // Store quantity

                emit CourierAdded(i, _title, _description,  _category, _location, _quantity, msg.sender); // Emit event with the value field
                return i; // Return the index of the added courier
            }
        }
        revert("No space available for more Inventory."); // Revert if array is full
    }

    // Remove courier by ID
    // Updated removeCourier function to subtract a specified quantity
function removeCourier(uint256 _id, uint256 _quantityToRemove) public {
    require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
    require(owners[_id] == msg.sender, "You must be the owner of the courier to modify it.");
    require(quantities[_id] >= _quantityToRemove, "Insufficient quantity to remove."); // Check if enough quantity exists

    // Subtract the quantity
    quantities[_id] -= _quantityToRemove;

    // Emit an event if some quantity is removed
    emit CourierRemoved(_id,_quantityToRemove);

    // Optional: If all quantity is removed, you can leave the entry but with zero quantity
    if (quantities[_id] == 0) {
        // Optionally emit an event or leave the courier in the array with 0 quantity
        emit CourierRemoved(_id, _quantityToRemove);
    }
}

 function updateQuantity(uint256 _id, uint256 _additionalQuantity) public {
        require(_id < owners.length, "Invalid courier ID.");
        require(owners[_id] == msg.sender, "You must be the owner of the courier to modify it.");
        
        quantities[_id] += _additionalQuantity;
        
        emit CourierAdded(_id, titles[_id], descriptions[_id], categories[_id], locations[_id], quantities[_id], msg.sender);
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

     function getCategory(uint256 _id) public view returns (string memory) {
        require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
        return categories[_id];
    }

    function getLocation(uint256 _id) public view returns (string memory) {
        require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
        return locations[_id];
    }

    function getQuantity(uint256 _id) public view returns (uint256) {
        require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
        return quantities[_id];
    }

    // Retrieve full courier information including value
    function getCourier(uint256 _id) public view returns (address, string memory, string memory,  string memory, 
            string memory, 
            uint256) {
        require(_id < owners.length, "Invalid courier ID."); // Check if ID is valid
        return (owners[_id], titles[_id], descriptions[_id],  categories[_id], 
            locations[_id], 
            quantities[_id]);
    }
}
