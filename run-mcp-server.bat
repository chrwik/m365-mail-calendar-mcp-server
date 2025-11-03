@echo off
cd /d "C:\Vscode\M365_mail_calendar_mcp\graph-mail-calendar-sdk-mcp-typescript"

REM Check if first argument is "auth" for authentication setup
if "%1"=="auth" (
    echo 🔐 Microsoft Graph Authentication
    echo.
    node bin/mcp-server.js %*
) else if "%1"=="start" (
    echo 🚀 Starting Microsoft Graph MCP Server...
    echo.
    node bin/mcp-server.js %*
) else (
    REM Default to showing help
    echo Microsoft Graph Mail ^& Calendar MCP Server
    echo.
    echo Usage:
    echo   run-mcp-server.bat auth --client-id YOUR_CLIENT_ID    ^(First time setup^)
    echo   run-mcp-server.bat start                              ^(Start the server^)
    echo   run-mcp-server.bat auth --status --client-id ID       ^(Check auth status^)
    echo   run-mcp-server.bat auth --logout --client-id ID       ^(Logout^)
    echo.
    echo For detailed help: run-mcp-server.bat COMMAND --help
    echo.
    node bin/mcp-server.js %*
)