@echo off
REM Debug MCP Server Launcher for Claude Desktop
REM Logs startup attempts for debugging

echo [%date% %time%] Starting MCP Server for Claude Desktop >> "C:\temp\mcp-debug.log"
echo [%date% %time%] Working directory: %CD% >> "C:\temp\mcp-debug.log"
echo [%date% %time%] Command line args: %* >> "C:\temp\mcp-debug.log"

cd /d "C:\Vscode\M365_mail_calendar_mcp\graph-mail-calendar-sdk-mcp-typescript"
echo [%date% %time%] Changed to: %CD% >> "C:\temp\mcp-debug.log"

set OAUTH2_CLIENT_ID=62f45267-fbb7-47d3-ae23-0b09855b283c
echo [%date% %time%] Set OAUTH2_CLIENT_ID >> "C:\temp\mcp-debug.log"

echo [%date% %time%] Launching node server >> "C:\temp\mcp-debug.log"
node bin/mcp-server.js start --transport stdio 2>>"C:\temp\mcp-debug.log"

echo [%date% %time%] Server exited with code: %ERRORLEVEL% >> "C:\temp\mcp-debug.log"