@echo off
echo Installing missing frontend dependencies...
cd frontend-old
npm install uuid chart.js@^3.9.1 react-chartjs-2@^4.3.1 --save --legacy-peer-deps

echo.
echo Dependencies installed successfully!
echo.
pause