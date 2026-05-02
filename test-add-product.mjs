#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/products';

const testProduct = {
  name: 'Test Paracetamol 500mg',
  category: 'Pain Relief',
  price: 30,
  description: 'Test product for adding to pharmacy',
  image: 'https://images.unsplash.com/photo-1584308666721-bb8bd1f9913d?auto=format&fit=crop&q=80&w=400&h=400',
  requiresPrescription: true,
  dosage: '500mg'
};

console.log('🧪 Testing Product Add API\n');
console.log('📝 Test Product Data:');
console.log(JSON.stringify(testProduct, null, 2));
console.log('\n');

async function testAddProduct() {
  try {
    console.log(`📤 Sending POST request to ${API_URL}`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProduct)
    });

    const data = await response.json();

    console.log(`\n📥 Response Status: ${response.status}`);
    console.log('📥 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ SUCCESS! Product added with ID:', data.product._id);
      return true;
    } else {
      console.log('\n❌ FAILED! Error:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
      return false;
    }
  } catch (error) {
    console.error('\n❌ FETCH ERROR:', error.message);
    return false;
  }
}

// First test: Check if server is running
async function testHealth() {
  try {
    console.log('🏥 Checking API Health...\n');
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('✅ Server is running!');
    console.log('Health status:', JSON.stringify(data, null, 2));
    console.log('\n---\n');
    return true;
  } catch (error) {
    console.error('❌ Server is NOT running!');
    console.error('Error:', error.message);
    console.error('\nPlease start the server with: npm run server\n');
    return false;
  }
}

async function main() {
  const serverRunning = await testHealth();
  if (!serverRunning) {
    process.exit(1);
  }

  const success = await testAddProduct();
  process.exit(success ? 0 : 1);
}

main();
