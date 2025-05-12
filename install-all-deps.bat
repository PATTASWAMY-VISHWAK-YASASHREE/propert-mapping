@echo off
echo Installing all required dependencies...

echo.
echo Installing uuid and chart.js...
cd frontend-old
npm install uuid chart.js@^3.9.1 react-chartjs-2@^4.3.1 --save --legacy-peer-deps

echo.
echo Installing react-router-dom v5 (compatible version)...
npm install react-router-dom@5.3.0 --save --legacy-peer-deps

echo.
echo All dependencies installed successfully!
echo Now running fix-missing-files.bat to create required files...
echo.
cd ..
call fix-missing-files.bat

echo.
echo Setup complete! You can now start the application with setup-with-migrations.bat
pause