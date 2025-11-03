@echo off
REM Claude Desktop MCP Server Launcher
REM Ensures proper working directory and environment for Claude Desktop

cd /d "%~dp0graph-mail-calendar-sdk-mcp-typescript"

REM Set the OAuth2 client ID
set OAUTH2_CLIENT_ID=62f45267-fbb7-47d3-ae23-0b09855b283c

REM Launch the MCP server in stdio mode for Claude Desktop
node bin/mcp-server.js start --transport stdio