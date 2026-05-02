#!/usr/bin/env node

/**
 * MongoDB Product Storage Test
 * This script tests if products are being saved and retrieved correctly
 */

const http = require('http');

console.log('\n🔍 TESTING PRODUCT STORAGE & DELETION\n');
console.log('This script will:');
console.log('1. Check MongoDB connection');
console.log('2. Get current products');
console.log('3. Try to delete a product');
console.log('4. Verify deletion\n');

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  try {
    // Test 1: Check server health
    console.log('📌 Test 1: Checking server health...');
    const health = await makeRequest('GET', '/api/health');
    if (health.status === 200) {
      console.log('✅ Server is running\n');
    } else {
      console.error('❌ Server not responding\n');
      process.exit(1);
    }

    // Test 2: Get diagnostic info
    console.log('📌 Test 2: Checking database connection...');
    const diagnostic = await makeRequest('GET', '/api/diagnostic');
    const dbStatus = diagnostic.data.database.status;
    const productCount = diagnostic.data.database.collections.products;
    
    console.log(`   Status: ${dbStatus}`);
    console.log(`   Products in database: ${productCount}`);
    
    if (dbStatus !== 'Connected') {
      console.error('❌ MongoDB NOT connected - products cannot be saved!\n');
      process.exit(1);
    }
    console.log('✅ MongoDB is connected\n');

    // Test 3: Check if any products exist
    console.log('📌 Test 3: Fetching products...');
    const productsResponse = await makeRequest('GET', '/api/products');
    const products = productsResponse.data.products || [];
    
    console.log(`   Found ${products.length} products`);
    if (products.length > 0) {
      console.log(`   First product: ${products[0].name} (${products[0]._id})\n`);
    } else {
      console.log('   ⚠️  No products found in database\n');
      console.log('SOLUTION: Add a product through the UI first!\n');
      process.exit(0);
    }

    // Test 4: Try to delete the first product
    console.log('📌 Test 4: Testing product deletion...');
    const productId = products[0]._id;
    console.log(`   Attempting to delete: ${productId}\n`);
    
    const deleteResponse = await makeRequest('DELETE', `/api/products/${productId}`);
    
    if (deleteResponse.status === 200 && deleteResponse.data.success) {
      console.log('✅ Product deleted successfully!\n');
      
      // Test 5: Verify deletion
      console.log('📌 Test 5: Verifying deletion...');
      const verify = await makeRequest('GET', '/api/products');
      const newCount = (verify.data.products || []).length;
      
      if (newCount === products.length - 1) {
        console.log(`✅ Deletion verified! Products: ${products.length} → ${newCount}\n`);
        console.log('🎉 ALL TESTS PASSED - Product deletion works!\n');
      } else {
        console.error(`❌ Deletion verification failed! Expected ${products.length - 1} products, got ${newCount}\n`);
      }
    } else {
      console.error(`❌ Deletion failed with status ${deleteResponse.status}`);
      console.error(`   Error: ${deleteResponse.data.error || deleteResponse.data}\n`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Server is running (npm run dev:all)');
    console.error('   2. MongoDB is running (mongod)');
    console.error('   3. At least one product is in the database\n');
    process.exit(1);
  }
}

runTests();
