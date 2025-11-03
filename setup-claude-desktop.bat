@echo off
echo 🖥️ Claude Desktop MCP Server Setup Helper
echo.

REM Get current directory
set "CURRENT_DIR=%CD%"
set "BATCH_PATH=%CURRENT_DIR%\run-mcp-server.bat"

REM Check if run-mcp-server.bat exists
if not exist "%BATCH_PATH%" (
    echo ❌ Error: run-mcp-server.bat not found in current directory
    echo Please run this script from the M365_mail_calendar_mcp folder
    pause
    exit /b 1
)

echo 📍 Current directory: %CURRENT_DIR%
echo 📁 Batch file path: %BATCH_PATH%
echo.

echo 📋 Claude Desktop Configuration:
echo Copy this JSON configuration to your Claude Desktop config file:
echo.
echo Location: %%APPDATA%%\Claude\claude_desktop_config.json
echo.
echo {
echo   "mcpServers": {
echo     "microsoft-graph": {
echo       "command": "%BATCH_PATH%",
echo       "args": ["start"],
echo       "env": {
echo         "OAUTH2_CLIENT_ID": "YOUR_AZURE_APP_CLIENT_ID_HERE"
echo       }
echo     }
echo   }
echo }
echo.

REM Check if .env file exists
if exist ".env" (
    echo ✅ Found .env file - great!
    echo Make sure it contains: OAUTH2_CLIENT_ID=your-client-id
) else (
    echo ⚠️  No .env file found. Create one with: OAUTH2_CLIENT_ID=your-client-id
)
echo.

echo 🔑 Next Steps:
echo 1. Replace YOUR_AZURE_APP_CLIENT_ID_HERE with your actual Azure App ID
echo 2. Save the config to: %%APPDATA%%\Claude\claude_desktop_config.json
echo 3. Run authentication: run-mcp-server.bat auth
echo 4. Restart Claude Desktop
echo.

pause