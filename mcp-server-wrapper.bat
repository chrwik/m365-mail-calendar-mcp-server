@echo off
REM MCP Server Wrapper for Claude Desktop
REM This ensures proper working directory and environment setup

cd /d "C:\Vscode\M365_mail_calendar_mcp\graph-mail-calendar-sdk-mcp-typescript"

REM Set environment variable if not already set
if "%OAUTH2_CLIENT_ID%"=="" (
    set OAUTH2_CLIENT_ID=62f45267-fbb7-47d3-ae23-0b09855b283c
)

REM Run the MCP server
node bin/mcp-server.js %*