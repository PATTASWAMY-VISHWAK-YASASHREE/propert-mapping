@echo off
echo Checking database connection...
node check-db-connection.js

echo.
echo Do you want to set up the database? (Y/N)
set /p choice=

if /i "%choice%"=="Y" (
  echo.
  echo Setting up database...
  node setup-database.js
) else (
  echo.
  echo Database setup skipped.
)

echo.
echo Press any key to exit...
pause > nul