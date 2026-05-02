/**
 * Database Connection & Product Test
 * Run with: node test-db.js
 */

console.log('\n🔍 Testing MongoDB Connection and Product Storage...\n');

import mongoose from 'mongoose';
import { 
  initializeDatabase, 
  addProduct, 
  getAllProducts 
} from './src/database.ts';

async function testDatabase() {
  try {
    // Step 1: Initialize database
    console.log('📌 Step 1: Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully\n');

    // Step 2: Check connection status
    console.log('📌 Step 2: Checking connection status...');
    const readyState = mongoose.connection.readyState;
    console.log(`   Connection ready state: ${readyState}`);
    console.log(`   States: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting`);
    if (readyState !== 1) {
      console.error('❌ Database not properly connected!');
      process.exit(1);
    }
    console.log('✅ Database properly connected\n');

    // Step 3: Count existing products
    console.log('📌 Step 3: Counting existing products...');
    const existingProducts = await getAllProducts();
    console.log(`✅ Found ${existingProducts.length} existing products\n`);

    // Step 4: Add a test product
    console.log('📌 Step 4: Adding test product...');
    const testProduct = await addProduct(
      'Test Medicine',
      'General',
      99.99,
      'This is a test product to verify database storage',
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde0b?auto=format&fit=crop&q=80&w=400&h=400',
      true,
      '500mg'
    );
    console.log('✅ Test product created:\n', testProduct);
    console.log(`   Product ID: ${testProduct._id}\n`);

    // Step 5: Fetch all products and verify
    console.log('📌 Step 5: Fetching products to verify storage...');
    const allProducts = await getAllProducts();
    console.log(`✅ Total products now: ${allProducts.length}`);
    
    const found = allProducts.find(p => p._id === testProduct._id);
    if (found) {
      console.log('✅ TEST PASSED: Product successfully saved and retrieved from database!\n');
    } else {
      console.error('❌ TEST FAILED: Product saved but not found when fetching!\n');
    }

    // Step 6: Show all product IDs
    console.log('📌 All products in database:');
    allProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p._id})`);
    });

    console.log('\n✅ Database test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during database test:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testDatabase();
