# Claude Desktop MCP Server Troubleshooting Guide

## Issue Fixed: UTF-8 BOM Problem ✅

**Problem:** Claude Desktop was showing startup errors and the MCP server wasn't appearing.

**Root Cause:** The configuration file had a UTF-8 Byte Order Mark (BOM) which caused JSON parsing errors.

**Error Message in Logs:**
```
Error reading or parsing config file: {
  error: SyntaxError: Unexpected token 'ï»¿', "ï»¿{
    "mcpS"... is not valid JSON
```

**Solution:** Created configuration file without BOM using proper PowerShell encoding.

## Current Configuration

**File Location:** `%APPDATA%\Claude\claude_desktop_config.json`

**Content:**
```json
{
  "mcpServers": {
    "microsoft-graph": {
      "command": "node",
      "args": ["C:/Vscode/M365_mail_calendar_mcp/graph-mail-calendar-sdk-mcp-typescript/bin/mcp-server.js", "start", "--transport", "stdio"],
      "cwd": "C:/Vscode/M365_mail_calendar_mcp/graph-mail-calendar-sdk-mcp-typescript",
      "env": {
        "OAUTH2_CLIENT_ID": "62f45267-fbb7-47d3-ae23-0b09855b283c"
      }
    }
  }
}
```

## Next Steps

1. **Restart Claude Desktop completely** (close and reopen)
2. **Look for MCP indicators:**
   - Small plug/hammer icon in the interface
   - "microsoft-graph" server should appear in new conversations
   - You can use `@microsoft-graph` to reference tools

3. **Test with a command like:**
   - "List my recent emails using @microsoft-graph"
   - "Show my calendar events with @microsoft-graph"

## Expected Authentication Flow

When you first use any Microsoft Graph functionality:

1. **Initial Request:** "List my recent emails"
2. **Authentication Prompt:** Server will respond with device code instructions
3. **Browser Authentication:** Follow the link and enter the code
4. **Retry Request:** Repeat your original request
5. **Success:** Server executes with authenticated access

## Verification Commands

**Test MCP Server Directly:**
```powershell
cd "C:\Vscode\M365_mail_calendar_mcp\graph-mail-calendar-sdk-mcp-typescript"
$env:OAUTH2_CLIENT_ID="62f45267-fbb7-47d3-ae23-0b09855b283c"
node bin/mcp-server.js start --transport stdio
```

**Check Configuration Validity:**
```powershell
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" -Raw | ConvertFrom-Json
```

**View Claude Desktop Logs:**
```powershell
Get-Content "$env:APPDATA\Claude\logs\main.log" | Select-Object -Last 20
```

## Troubleshooting Tips

### If MCP Server Still Doesn't Appear:
1. Ensure Claude Desktop is completely closed and reopened
2. Check that Node.js is in your PATH: `node --version`
3. Verify the MCP server file exists and is executable
4. Check Claude Desktop logs for new error messages

### If You See Connection Errors:
- This is normal for the first run - authentication is required
- Follow the device code flow instructions when they appear
- The server will remember your authentication for future use

### If Authentication Fails:
1. Verify your Azure app registration allows device code flow
2. Check that the client ID is correct
3. Ensure your Microsoft account has appropriate permissions

## Files Created/Modified

- `claude_desktop_config.json` - Fixed UTF-8 BOM issue
- `mcp-server-wrapper.bat` - Backup wrapper script  
- `debug-mcp.js` - Diagnostic script
- `INTERACTIVE_AUTH.md` - Authentication documentation

## Success Indicators

✅ **Configuration file is valid JSON without BOM**  
✅ **MCP server starts without errors**  
✅ **Environment variables are properly set**  
✅ **All file paths are correct and accessible**

The configuration should now work correctly with Claude Desktop!