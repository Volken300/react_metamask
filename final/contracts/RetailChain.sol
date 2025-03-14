// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RetailChain {
    struct Product {
        uint256 id;
        string name;
        uint256 price;
        uint256 quantity;
        address seller;
        bool isActive;
    }

    struct Order {
        uint256 id;
        uint256 productId;
        address buyer;
        uint256 quantity;
        uint256 totalPrice;
        bool isCompleted;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256) public loyaltyPoints;

    uint256 private productCounter;
    uint256 private orderCounter;

    event ProductListed(uint256 indexed id, string name, uint256 price, address seller);
    event OrderPlaced(uint256 indexed id, uint256 productId, address buyer, uint256 quantity);
    event LoyaltyPointsEarned(address indexed user, uint256 points);

    function listProduct(string memory _name, uint256 _price, uint256 _quantity) public {
        require(_price > 0, "Price must be greater than 0");
        require(_quantity > 0, "Quantity must be greater than 0");

        productCounter++;
        products[productCounter] = Product({
            id: productCounter,
            name: _name,
            price: _price,
            quantity: _quantity,
            seller: msg.sender,
            isActive: true
        });

        emit ProductListed(productCounter, _name, _price, msg.sender);
    }

    function placeOrder(uint256 _productId, uint256 _quantity) public payable {
        Product storage product = products[_productId];
        require(product.isActive, "Product is not active");
        require(_quantity <= product.quantity, "Insufficient product quantity");
        require(msg.value >= product.price * _quantity, "Insufficient payment");

        orderCounter++;
        orders[orderCounter] = Order({
            id: orderCounter,
            productId: _productId,
            buyer: msg.sender,
            quantity: _quantity,
            totalPrice: product.price * _quantity,
            isCompleted: false
        });

        product.quantity -= _quantity;
        if (product.quantity == 0) {
            product.isActive = false;
        }

        // Award loyalty points (1 point per wei spent)
        uint256 points = msg.value / 1e15; // Convert wei to finney for reasonable point values
        loyaltyPoints[msg.sender] += points;

        emit OrderPlaced(orderCounter, _productId, msg.sender, _quantity);
        emit LoyaltyPointsEarned(msg.sender, points);

        // Transfer payment to seller
        payable(product.seller).transfer(msg.value);
    }

    function getProduct(uint256 _productId) public view returns (Product memory) {
        return products[_productId];
    }

    function getOrder(uint256 _orderId) public view returns (Order memory) {
        return orders[_orderId];
    }

    function getLoyaltyPoints(address _user) public view returns (uint256) {
        return loyaltyPoints[_user];
    }
}