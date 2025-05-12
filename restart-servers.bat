@echo off
echo Stopping any running servers...
taskkill /f /im node.exe

echo.
echo Starting Chat Server...
start cmd /k "node chat-server.js"
echo Starting Main Server...
start cmd /k "cd backend && node server.js"
echo Starting Frontend...
cd frontend-old
start cmd /k "npm start --legacy-peer-deps"

echo.
echo All servers restarted!