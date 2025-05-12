/**
 * CORS Configuration Fix Script
 * This script updates CORS configuration in both main and chat servers
 */

const fs = require('fs');
const path = require('path');

// Paths to server files
const mainServerPath = path.join(__dirname, 'backend', 'server.js');
const chatServerPath = path.join(__dirname, 'chat-server.js');

console.log('Fixing CORS configuration...');

// Fix main server CORS
try {
  let mainServerContent = fs.readFileSync(mainServerPath, 'utf8');
  
  // Check if we need to update CORS configuration
  if (mainServerContent.includes('app.use(cors(config.cors));')) {
    console.log('Updating main server CORS configuration...');
    
    // Replace the CORS configuration
    mainServerContent = mainServerContent.replace(
      'app.use(cors(config.cors));',
      `// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(mainServerPath, mainServerContent);
    console.log('✅ Main server CORS configuration updated');
  } else {
    console.log('Main server CORS configuration already updated or uses a different pattern');
  }
} catch (error) {
  console.error('Error updating main server CORS:', error.message);
}

// Fix chat server CORS
try {
  let chatServerContent = fs.readFileSync(chatServerPath, 'utf8');
  
  // Check if we need to update CORS configuration
  if (chatServerContent.includes("app.use(cors({")) {
    console.log('Updating chat server CORS configuration...');
    
    // Replace the CORS configuration
    chatServerContent = chatServerContent.replace(
      /app\.use\(cors\(\{[\s\S]*?\}\)\);/,
      `app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());`
    );
    
    // Also update Socket.IO CORS configuration
    chatServerContent = chatServerContent.replace(
      /const io = socketIo\(server, \{[\s\S]*?\}\);/,
      `const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(chatServerPath, chatServerContent);
    console.log('✅ Chat server CORS configuration updated');
  } else {
    console.log('Chat server CORS configuration already updated or uses a different pattern');
  }
} catch (error) {
  console.error('Error updating chat server CORS:', error.message);
}

console.log('\nCORS configuration update completed. Please restart your servers for changes to take effect.');