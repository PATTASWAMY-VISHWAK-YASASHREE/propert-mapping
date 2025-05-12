@echo off
echo Checking database connection...
node check-db-connection.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Database connection failed. Do you want to set up the database? (Y/N)
  set /p choice=
  
  if /i "%choice%"=="Y" (
    echo.
    echo Setting up database...
    node setup-database.js
    
    if %ERRORLEVEL% NEQ 0 (
      echo.
      echo Database setup failed. Please fix the issues and try again.
      echo Press any key to exit...
      pause > nul
      exit /b 1
    )
  ) else (
    echo.
    echo Database setup skipped. Servers may not function correctly.
    echo Press any key to continue anyway...
    pause > nul
  )
)

echo.
echo Starting Chat Server...
start cmd /k "node chat-server.js"
echo Starting Main Server...
start cmd /k "cd backend && node server.js"
echo Starting Frontend...
cd frontend-old
start cmd /k "npm start --legacy-peer-deps"