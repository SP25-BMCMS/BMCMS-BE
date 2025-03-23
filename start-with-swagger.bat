@echo off
echo Starting Building Management & Crack Monitoring System (BMCMS)
echo This script will start the application with enhanced Swagger documentation

REM Check if dependencies are installed
echo Checking dependencies...
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

REM Build the application
echo Building the application...
call npm run build

REM Start the application
echo Starting the application...
echo Once the application is running, you can access:
echo - API: http://localhost:3000
echo - Swagger Documentation: http://localhost:3000/api
echo.
echo Press Ctrl+C to stop the application

REM Start in development mode
call npm run start:dev 