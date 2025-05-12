/**
 * Test Setup
 * Sets up the testing environment
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../config/.env.test') });

// Connect to test database before tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Clear database collections after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect from database after all tests
afterAll(async () => {
  await mongoose.connection.close();
});