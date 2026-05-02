import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/design_project';

console.log('🔌 Testing MongoDB Connection...');
console.log(`📍 Connection String: ${MONGODB_URI}`);
console.log('');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS! MongoDB is connected!');
    console.log('📦 Database: design_project');
    console.log('🖥️  Server: localhost:27017');
    console.log('');
    console.log('Connection Details:');
    console.log(`- State: ${mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'}`);
    console.log(`- Host: ${mongoose.connection.host}`);
    console.log(`- Port: ${mongoose.connection.port}`);
    console.log(`- Database: ${mongoose.connection.name}`);
    
    // List collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.log('❌ Error listing collections:', err.message);
      } else {
        console.log(`- Collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None (will be created on first write)'}`);
      }
      mongoose.disconnect();
      console.log('');
      console.log('✨ Test completed successfully!');
      process.exit(0);
    });
  })
  .catch((err) => {
    console.log('❌ FAILED! Cannot connect to MongoDB');
    console.log('');
    console.log('Error Details:');
    console.log(`- Message: ${err.message}`);
    console.log(`- Code: ${err.code}`);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure MongoDB is running: mongod');
    console.log('2. Check if port 27017 is open');
    console.log('3. Verify MONGODB_URI in .env file');
    console.log('');
    process.exit(1);
  });
