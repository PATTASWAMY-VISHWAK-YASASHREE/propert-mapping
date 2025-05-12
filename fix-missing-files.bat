@echo off
echo Creating missing files and fixing imports...

cd frontend-old

echo.
echo Creating missing CSS files...
echo. > src\components\property\PropertyList.css
echo. > src\pages\Dashboard.css
echo. > src\pages\PropertyDetail.css
echo. > src\pages\PropertyMap.css
echo. > src\pages\ReportGenerator.css
echo. > src\pages\WealthAnalysis.css

echo.
echo Creating missing action files...
mkdir src\store\actions 2>nul

echo // Property actions > src\store\actions\propertyActions.js
echo export const getProperties = () => dispatch => { >> src\store\actions\propertyActions.js
echo   // Placeholder for API call >> src\store\actions\propertyActions.js
echo   dispatch({ >> src\store\actions\propertyActions.js
echo     type: 'GET_PROPERTIES', >> src\store\actions\propertyActions.js
echo     payload: [] >> src\store\actions\propertyActions.js
echo   }); >> src\store\actions\propertyActions.js
echo }; >> src\store\actions\propertyActions.js
echo export const getProperty = (id) => dispatch => { >> src\store\actions\propertyActions.js
echo   // Placeholder for API call >> src\store\actions\propertyActions.js
echo   dispatch({ >> src\store\actions\propertyActions.js
echo     type: 'GET_PROPERTY', >> src\store\actions\propertyActions.js
echo     payload: { id } >> src\store\actions\propertyActions.js
echo   }); >> src\store\actions\propertyActions.js
echo }; >> src\store\actions\propertyActions.js

echo // Report actions > src\store\actions\reportActions.js
echo export const getReports = () => dispatch => { >> src\store\actions\reportActions.js
echo   // Placeholder for API call >> src\store\actions\reportActions.js
echo   dispatch({ >> src\store\actions\reportActions.js
echo     type: 'GET_REPORTS', >> src\store\actions\reportActions.js
echo     payload: [] >> src\store\actions\reportActions.js
echo   }); >> src\store\actions\reportActions.js
echo }; >> src\store\actions\reportActions.js
echo export const generateReport = (data) => dispatch => { >> src\store\actions\reportActions.js
echo   // Placeholder for API call >> src\store\actions\reportActions.js
echo   dispatch({ >> src\store\actions\reportActions.js
echo     type: 'GENERATE_REPORT', >> src\store\actions\reportActions.js
echo     payload: { data } >> src\store\actions\reportActions.js
echo   }); >> src\store\actions\reportActions.js
echo }; >> src\store\actions\reportActions.js

echo // User actions > src\store\actions\userActions.js
echo export const getUsers = () => dispatch => { >> src\store\actions\userActions.js
echo   // Placeholder for API call >> src\store\actions\userActions.js
echo   dispatch({ >> src\store\actions\userActions.js
echo     type: 'GET_USERS', >> src\store\actions\userActions.js
echo     payload: [] >> src\store\actions\userActions.js
echo   }); >> src\store\actions\userActions.js
echo }; >> src\store\actions\userActions.js
echo export const getUserProfile = () => dispatch => { >> src\store\actions\userActions.js
echo   // Placeholder for API call >> src\store\actions\userActions.js
echo   dispatch({ >> src\store\actions\userActions.js
echo     type: 'GET_USER_PROFILE', >> src\store\actions\userActions.js
echo     payload: {} >> src\store\actions\userActions.js
echo   }); >> src\store\actions\userActions.js
echo }; >> src\store\actions\userActions.js

echo.
echo Fixing react-router-dom imports...
echo Updating files that use useNavigate...

echo Checking for Header.js...
if exist src\components\layout\Header.js (
  echo Fixing Header.js...
  powershell -Command "(Get-Content src\components\layout\Header.js) -replace 'useNavigate', 'useHistory' | Set-Content src\components\layout\Header.js"
  powershell -Command "(Get-Content src\components\layout\Header.js) -replace 'const navigate = useHistory\(\);', 'const history = useHistory();' | Set-Content src\components\layout\Header.js"
  powershell -Command "(Get-Content src\components\layout\Header.js) -replace 'navigate\(', 'history.push(' | Set-Content src\components\layout\Header.js"
)

echo Checking for ReportGenerator.js...
if exist src\pages\ReportGenerator.js (
  echo Fixing ReportGenerator.js...
  powershell -Command "(Get-Content src\pages\ReportGenerator.js) -replace 'useNavigate', 'useHistory' | Set-Content src\pages\ReportGenerator.js"
  powershell -Command "(Get-Content src\pages\ReportGenerator.js) -replace 'const navigate = useHistory\(\);', 'const history = useHistory();' | Set-Content src\pages\ReportGenerator.js"
  powershell -Command "(Get-Content src\pages\ReportGenerator.js) -replace 'navigate\(', 'history.push(' | Set-Content src\pages\ReportGenerator.js"
)

echo.
echo Checking for theme.js...
if exist src\theme\index.js (
  echo Fixing theme imports...
  powershell -Command "(Get-Content src\App.js) -replace 'import theme from', 'import { lightTheme as theme } from' | Set-Content src\App.js"
)

echo.
echo All missing files created and imports fixed!
echo Please restart your application.
pause