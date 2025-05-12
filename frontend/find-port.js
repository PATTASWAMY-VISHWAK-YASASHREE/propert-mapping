
/**
 * Utility to find available ports
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

/**
 * Check if a port is available
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - True if port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

/**
 * Find an available port starting from the given port
 * @param {number} startPort - Port to start checking from
 * @returns {Promise<number>} - First available port
 */
async function findAvailablePort(startPort) {
  let port = startPort;
  
  while (!(await isPortAvailable(port))) {
    port++;
  }
  
  return port;
}

/**
 * Update environment files with available ports
 */
async function updatePorts() {
  try {
    // Find available ports
    const backendPort = await findAvailablePort(5000);
    const frontendPort = await findAvailablePort(backendPort + 1);
    
    console.log(`Found available ports - Backend: ${backendPort}, Frontend: ${frontendPort}`);
    
    // Update backend .env
    const backendEnvPath = path.join(__dirname, 'backend', '.env');
    let backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
    backendEnv = backendEnv.replace(/PORT=\d+/, `PORT=${backendPort}`);
    fs.writeFileSync(backendEnvPath, backendEnv);
    
    // Update frontend .env
    const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
    let frontendEnv = `REACT_APP_API_URL=http://localhost:${backendPort}/api\n`;
    fs.writeFileSync(frontendEnvPath, frontendEnv);
    
    // Create a ports.json file for reference
    const portsConfig = {
      backendPort,
      frontendPort
    };
    fs.writeFileSync(path.join(__dirname, 'ports.json'), JSON.stringify(portsConfig, null, 2));
    
    console.log('Environment files updated successfully');
    
    return portsConfig;
  } catch (error) {
    console.error('Error updating ports:', error.message);
    throw error;
  }
}

// If this script is run directly
if (require.main === module) {
  updatePorts().catch(console.error);
} else {
  // Export for use in other scripts
  module.exports = {
    isPortAvailable,
    findAvailablePort,
    updatePorts
  };
}
