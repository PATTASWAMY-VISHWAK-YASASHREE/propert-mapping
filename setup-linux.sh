#!/bin/bash

echo "Property Mapping Platform - Setup Script"
echo "======================================"
echo

# Create necessary directories if they don't exist
echo "Creating directory structure..."
mkdir -p frontend/public/assets
mkdir -p database/migrations
mkdir -p database/seeds
mkdir -p docs/api
mkdir -p docs/user-guides

# Install backend dependencies
echo
echo "Installing backend dependencies..."
cd backend
npm init -y
npm install express mongoose dotenv colors morgan cookie-parser express-mongo-sanitize helmet xss-clean express-rate-limit hpp cors bcryptjs jsonwebtoken nodemailer speakeasy qrcode crypto multer axios json2csv
npm install -D nodemon

# Create .env file if it doesn't exist
echo
echo "Creating .env file..."
if [ ! -f config/.env ]; then
  cp config/.env.example config/.env
  echo "Please update the .env file with your configuration"
fi

# Install frontend dependencies
echo
echo "Installing frontend dependencies..."
cd ../frontend
npm init -y
npm install react react-dom react-router-dom redux react-redux redux-thunk redux-devtools-extension axios leaflet react-leaflet chart.js react-chartjs-2 moment uuid formik yup @material-ui/core @material-ui/icons

# Create package.json scripts for root directory
echo
echo "Setting up root package.json..."
cd ..
cat > package.json << EOL
{
  "name": "property-mapping-platform",
  "version": "1.0.0",
  "description": "A comprehensive platform for property mapping and owner wealth analysis",
  "main": "backend/server.js",
  "scripts": {
    "start": "node backend/server.js",
    "server": "nodemon backend/server.js",
    "client": "npm start --prefix frontend",
    "dev": "concurrently \\"npm run server\\" \\"npm run client\\"",
    "seed": "node database/seeds/seed.js"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "concurrently": "^7.0.0"
  }
}
EOL

# Install root dependencies
npm install

echo
echo "======================================"
echo "Setup completed!"
echo
echo "Next steps:"
echo "1. Update backend/config/.env with your configuration"
echo "2. Run 'npm run seed' to seed the database with sample data"
echo "3. Run 'npm run dev' to start both backend and frontend servers"
echo
echo "Note: Make sure MongoDB is running before starting the application."
echo "======================================"