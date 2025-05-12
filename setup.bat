@echo off
echo Property Mapping Platform - Setup Script
echo ======================================
echo.

REM Create necessary directories if they don't exist
echo Creating directory structure...
mkdir frontend\public\assets 2>nul
mkdir database\migrations 2>nul
mkdir database\seeds 2>nul
mkdir docs\api 2>nul
mkdir docs\user-guides 2>nul

REM Install backend dependencies
echo.
echo Installing backend dependencies...
cd backend
npm init -y
npm install express mongoose dotenv colors morgan cookie-parser express-mongo-sanitize helmet xss-clean express-rate-limit hpp cors bcryptjs jsonwebtoken nodemailer speakeasy qrcode crypto multer axios json2csv --legacy-peer-deps
npm install -D nodemon --legacy-peer-deps

REM Create .env file if it doesn't exist
echo.
echo Creating .env file...
if not exist config\.env (
  copy config\.env.example config\.env
  echo Please update the .env file with your configuration
)

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd ..\frontend
npm init -y
npm install react react-dom react-router-dom redux react-redux redux-thunk redux-devtools-extension axios leaflet react-leaflet chart.js react-chartjs-2 moment uuid formik yup @material-ui/core @material-ui/icons --legacy-peer-deps

REM Create package.json scripts for root directory
echo.
echo Setting up root package.json...
cd ..
echo {
echo   "name": "property-mapping-platform",
echo   "version": "1.0.0",
echo   "description": "A comprehensive platform for property mapping and owner wealth analysis",
echo   "main": "backend/server.js",
echo   "scripts": {
echo     "start": "node backend/server.js",
echo     "server": "nodemon backend/server.js",
echo     "client": "npm start --prefix frontend",
echo     "dev": "concurrently \"npm run server\" \"npm run client\"",
echo     "seed": "node database/seeds/seed.js"
echo   },
echo   "author": "",
echo   "license": "ISC",
echo   "dependencies": {
echo     "concurrently": "^7.0.0"
echo   }
echo } > package.json

REM Install root dependencies
npm install --legacy-peer-deps

echo.
echo ======================================
echo Setup completed!
echo.
echo Next steps:
echo 1. Update backend/config/.env with your configuration
echo 2. Run 'npm run seed' to seed the database with sample data
echo 3. Run 'npm run dev' to start both backend and frontend servers
echo.
echo Note: Make sure MongoDB is running before starting the application.
echo ======================================