@echo off
echo Running network debug tests...
node debug-network.js

echo.
echo Do you want to fix CORS configuration? (Y/N)
set /p choice=

if /i "%choice%"=="Y" (
  echo.
  echo Fixing CORS configuration...
  node fix-cors.js
  
  echo.
  echo CORS configuration updated. Restarting servers...
  echo.
)

echo Starting Chat Server...
start cmd /k "node chat-server.js"
echo Starting Main Server...
start cmd /k "cd backend && node server.js"
echo Starting Frontend...
cd frontend-old
start cmd /k "npm start --legacy-peer-deps"