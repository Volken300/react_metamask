import React from 'react';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RetailChain from '../artifacts/contracts/RetailChain.sol/RetailChain.json';
import './App.css';

const App = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    connectWallet();
  }, []);

  async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
        const retailChain = new ethers.Contract(contractAddress, RetailChain.abi, signer);
        setContract(retailChain);
        await loadProducts();
        await loadLoyaltyPoints();
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    }
  }

  async function loadProducts() {
    if (!contract) return;
    try {
      const productCount = await contract.productCounter();
      const loadedProducts = [];
      for (let i = 1; i <= productCount; i++) {
        const product = await contract.getProduct(i);
        if (product.isActive) {
          loadedProducts.push({
            ...product,
            id: i
          });
        }
      }
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async function loadLoyaltyPoints() {
    if (!contract || !account) return;
    try {
      const points = await contract.getLoyaltyPoints(account);
      setLoyaltyPoints(points);
    } catch (error) {
      console.error('Error loading loyalty points:', error);
    }
  }

  async function listProduct(name, price, quantity) {
    if (!contract) return;
    try {
      const tx = await contract.listProduct(name, price, quantity);
      await tx.wait();
      await loadProducts();
    } catch (error) {
      console.error('Error listing product:', error);
    }
  }

  async function placeOrder(productId, quantity, totalPrice) {
    if (!contract) return;
    try {
      const tx = await contract.placeOrder(productId, quantity, {
        value: totalPrice
      });
      await tx.wait();
      await loadProducts();
      await loadLoyaltyPoints();
    } catch (error) {
      console.error('Error placing order:', error);
    }
  }

  return (
    <div className="App">
      <header>
        <h1>RetailChain DApp</h1>
        <div className="wallet-info">
          {account ? (
            <p>Connected Wallet: {account}</p>
          ) : (
            <button onClick={connectWallet}>Connect Wallet</button>
          )}
          <p>Loyalty Points: {loyaltyPoints.toString()}</p>
        </div>
      </header>

      <main>
        <section className="products">
          <h2>Available Products</h2>
          <div className="product-list">
            {products.map((product) => (
              <div key={product.id.toString()} className="product-card">
                <h3>{product.name}</h3>
                <p>Price: {ethers.formatEther(product.price)} ETH</p>
                <p>Stock: {product.quantity.toString()}</p>
                <button
                  onClick={() => placeOrder(
                    product.id,
                    1,
                    product.price
                  )}
                  disabled={!account || product.quantity.toString() === '0'}
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="add-product">
          <h2>List New Product</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.name.value;
            const price = ethers.parseEther(e.target.price.value);
            const quantity = parseInt(e.target.quantity.value);
            listProduct(name, price, quantity);
            e.target.reset();
          }}>
            <input type="text" name="name" placeholder="Product Name" required />
            <input type="number" name="price" placeholder="Price (ETH)" step="0.01" required />
            <input type="number" name="quantity" placeholder="Quantity" required />
            <button type="submit" disabled={!account}>List Product</button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default App;