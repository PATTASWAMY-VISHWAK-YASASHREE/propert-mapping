const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT);
