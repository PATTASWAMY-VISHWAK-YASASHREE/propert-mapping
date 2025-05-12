@echo off
echo ===================================================
echo      PROPERTY MAPPING PLATFORM - MASTER SCRIPT     
echo ===================================================
echo.

REM 1. Optionally install all dependencies
echo Do you want to install all dependencies? (Y/N)
set /p deps=
if /i "%deps%"=="Y" (
  call install-all-deps.bat
) else (
  echo Skipped installing all dependencies.
)

REM 2. Optionally install debug tools
echo.
echo Do you want to install backend debug tools (axios, colors)? (Y/N)
set /p debugtools=
if /i "%debugtools%"=="Y" (
  call install-debug-tools.bat
) else (
  echo Skipped installing debug tools.
)

REM 3. Optionally fix missing frontend files and actions
echo.
echo Do you want to fix missing frontend files and actions? (Y/N)
set /p fixfiles=
if /i "%fixfiles%"=="Y" (
  call fix-missing-files.bat
) else (
  echo Skipped fix for missing frontend files.
)

REM 4. Optionally run fix-frontend (mostly duplicates fix-missing, but more rapid/targeted)
echo.
echo Do you want to run additional frontend fixes (fix-frontend.bat)? (Y/N)
set /p fixfrontend=
if /i "%fixfrontend%"=="Y" (
  call fix-frontend.bat
) else (
  echo Skipped fix-frontend.
)

REM 5. Check and set up DB as needed
echo.
echo Checking and optionally setting up database...
call check-and-setup-db.bat

REM 6. Start the full stack: DB migrations, Chat, Main Server and Frontend
echo.
echo Do you want to start and migrate everything (recommended first full run)? (Y/N)
set /p doall=
if /i "%doall%"=="Y" (
  call setup-with-migrations.bat
) else (
  echo.
  echo Starting all servers without migrations...
  call start-servers.bat
)

echo.
echo ===================================================
echo        Master script completed.                    
echo All servers/services should now be running!
echo ===================================================
pause