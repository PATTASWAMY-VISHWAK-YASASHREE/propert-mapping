/**
 * Simple CORS Configuration Fix Script
 * This script updates CORS configuration in both main and chat servers
 * without requiring external dependencies
 */

const fs = require('fs');
const path = require('path');

// Paths to server files
const mainServerPath = path.join(__dirname, 'backend', 'server.js');
const chatServerPath = path.join(__dirname, 'chat-server.js');

console.log('Fixing CORS configuration...');

// Fix main server CORS
try {
  if (fs.existsSync(mainServerPath)) {
    let mainServerContent = fs.readFileSync(mainServerPath, 'utf8');
    
    // Check if we need to update CORS configuration
    if (mainServerContent.includes('app.use(cors(')) {
      console.log('Updating main server CORS configuration...');
      
      // Replace the CORS configuration with a more permissive one
      const corsConfig = `
// Enhanced CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());`;

      // Try to find and replace the CORS configuration
      if (mainServerContent.includes('app.use(cors(config.cors));')) {
        mainServerContent = mainServerContent.replace('app.use(cors(config.cors));', corsConfig);
      } else {
        // More generic replacement
        mainServerContent = mainServerContent.replace(/app\.use\(cors\([^)]*\)\);/, corsConfig);
      }
      
      // Write the updated content back to the file
      fs.writeFileSync(mainServerPath, mainServerContent);
      console.log('✅ Main server CORS configuration updated');
    } else {
      console.log('Main server CORS configuration not found or already updated');
    }
  } else {
    console.log('❌ Main server file not found at:', mainServerPath);
  }
} catch (error) {
  console.error('Error updating main server CORS:', error.message);
}

// Fix chat server CORS
try {
  if (fs.existsSync(chatServerPath)) {
    let chatServerContent = fs.readFileSync(chatServerPath, 'utf8');
    
    // Check if we need to update CORS configuration
    if (chatServerContent.includes('app.use(cors(')) {
      console.log('Updating chat server CORS configuration...');
      
      // Replace the CORS configuration with a more permissive one
      chatServerContent = chatServerContent.replace(
        /app\.use\(cors\(\{[\s\S]*?\}\)\);/,
        `app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());`
      );
      
      // Also update Socket.IO CORS configuration if it exists
      if (chatServerContent.includes('const io = socketIo(server, {')) {
        chatServerContent = chatServerContent.replace(
          /const io = socketIo\(server, \{[\s\S]*?\}\);/,
          `const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin
      if(!origin) return callback(null, true);
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});`
        );
      }
      
      // Write the updated content back to the file
      fs.writeFileSync(chatServerPath, chatServerContent);
      console.log('✅ Chat server CORS configuration updated');
    } else {
      console.log('Chat server CORS configuration not found or already updated');
    }
  } else {
    console.log('❌ Chat server file not found at:', chatServerPath);
  }
} catch (error) {
  console.error('Error updating chat server CORS:', error.message);
}

console.log('\nCORS configuration update completed. Please restart your servers for changes to take effect.');