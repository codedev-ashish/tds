@echo off
REM FVU 9.3 Database Setup Script
REM This script applies all FVU 9.3 compliance fixes to the database

setlocal enabledelayedexpansion

echo.
echo ================================
echo FVU 9.3 Compliance Database Setup
echo ================================
echo.

REM Get database credentials (you can modify these or use environment variables)
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=root
set DB_NAME=tds_pro_db

echo Step 1: Adding address_change_flag column...
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < database\add_address_change_flag.sql
if errorlevel 1 (
    echo ERROR: Failed to add address_change_flag column
    pause
    exit /b 1
)
echo ✓ Column added successfully

echo.
echo Step 2: Running FVU 9.3 compliance setup...
mysql -h %DB_HOST% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < database\fvu_9_3_compliance_setup.sql
if errorlevel 1 (
    echo ERROR: Failed to run compliance setup
    pause
    exit /b 1
)
echo ✓ Compliance setup completed

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Restart the Node.js server: npm start
echo 2. Open the Deductor form and set Address Change Flag
echo 3. Generate a TDS file
echo 4. Validate against FVU 9.3
echo.
pause
