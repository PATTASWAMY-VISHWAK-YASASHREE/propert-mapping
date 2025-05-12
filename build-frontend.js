/**
 * Script to build the frontend and copy it to the backend's public directory
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Paths
const frontendDir = path.join(__dirname, 'frontend');
const frontendBuildDir = path.join(frontendDir, 'build');
const backendPublicDir = path.join(__dirname, 'backend', 'public');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}Building frontend and copying to backend...${colors.reset}\n`);

try {
  // Check if frontend directory exists
  if (!fs.existsSync(frontendDir)) {
    throw new Error('Frontend directory not found');
  }

  // Build the frontend
  console.log(`${colors.yellow}Building React frontend...${colors.reset}`);
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });
  console.log(`${colors.green}Frontend build complete!${colors.reset}\n`);

  // Check if build directory exists
  if (!fs.existsSync(frontendBuildDir)) {
    throw new Error('Frontend build directory not found');
  }

  // Ensure backend public directory exists
  if (!fs.existsSync(backendPublicDir)) {
    fs.mkdirSync(backendPublicDir, { recursive: true });
  }

  // Copy frontend build to backend public directory
  console.log(`${colors.yellow}Copying build files to backend...${colors.reset}`);
  fs.copySync(frontendBuildDir, backendPublicDir);
  console.log(`${colors.green}Files copied successfully!${colors.reset}\n`);

  console.log(`${colors.bright}${colors.green}Frontend build and copy complete!${colors.reset}`);
  console.log(`${colors.cyan}The backend server will now serve the frontend at http://localhost:5000${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}