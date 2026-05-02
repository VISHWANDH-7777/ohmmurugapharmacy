#!/usr/bin/env node

/**
 * Startup Script - Diagnose and Start the Application
 * Run: node startup-check.mjs
 */

import http from 'http';
import { spawn } from 'child_process';

console.log('\n' + '='.repeat(60));
console.log('🚀 PHARMACY APP STARTUP CHECK');
console.log('='.repeat(60));

// Step 1: Check MongoDB
console.log('\n1️⃣  Checking MongoDB...');
http.get('http://127.0.0.1:27017', (res) => {
  console.log('   ✅ MongoDB is running on port 27017');
}).on('error', (err) => {
  console.log('   ❌ MongoDB is NOT running');
  console.log('   💡 Start MongoDB with: mongod');
  process.exit(1);
});

// Step 2: Wait and then check Backend
setTimeout(() => {
  console.log('\n2️⃣  Checking Backend Server...');
  http.get('http://localhost:5000/api/health', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.success && json.dbReady) {
          console.log('   ✅ Backend is running and MongoDB is connected!');
          console.log('\n' + '='.repeat(60));
          console.log('✨ APPLICATION READY!');
          console.log('='.repeat(60));
          console.log('Frontend: http://localhost:3000/');
          console.log('Backend:  http://localhost:5000/');
          console.log('='.repeat(60) + '\n');
          process.exit(0);
        } else {
          console.log('   ⚠️  Backend running but database not ready');
          process.exit(1);
        }
      } catch {
        console.log('   ❌ Backend is NOT responding');
        console.log('   💡 Start backend with: npm run server');
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.log('   ❌ Backend is NOT running on port 5000');
    console.log('   💡 Start backend with: npm run server');
    process.exit(1);
  });
}, 500);

setTimeout(() => {
  console.log('   ❌ Health check timeout');
  process.exit(1);
}, 5000);
