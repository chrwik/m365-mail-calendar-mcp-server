# 🖥️ Adding Your MCP Server to Claude Desktop

## Step 1: Locate Claude Desktop Config File

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Full Path Example:**
```
C:\Users\YourUsername\AppData\Roaming\Claude\claude_desktop_config.json
```

**Mac:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

## Step 2: Create or Edit Config File

If the file doesn't exist, create it. If it exists, edit it to add your MCP server.

### Option A: Using .env File (Recommended)

```json
{
  "mcpServers": {
    "microsoft-graph": {
      "command": "C:\\Vscode\\M365_mail_calendar_mcp\\run-mcp-server.bat",
      "args": ["start"],
      "env": {
        "OAUTH2_CLIENT_ID": "your-azure-app-client-id-here"
      }
    }
  }
}
```

### Option B: Direct Path to Node

```json
{
  "mcpServers": {
    "microsoft-graph": {
      "command": "node",
      "args": [
        "C:\\Vscode\\M365_mail_calendar_mcp\\graph-mail-calendar-sdk-mcp-typescript\\bin\\mcp-server.js",
        "start"
      ],
      "env": {
        "OAUTH2_CLIENT_ID": "your-azure-app-client-id-here"
      }
    }
  }
}
```

### Option C: Multiple MCP Servers (if you have others)

```json
{
  "mcpServers": {
    "microsoft-graph": {
      "command": "C:\\Vscode\\M365_mail_calendar_mcp\\run-mcp-server.bat",
      "args": ["start"],
      "env": {
        "OAUTH2_CLIENT_ID": "your-azure-app-client-id-here"
      }
    },
    "other-server": {
      "command": "path-to-other-server",
      "args": ["start"]
    }
  }
}
```

## Step 3: Configure Your Client ID

**Replace `your-azure-app-client-id-here` with your actual Azure Application ID from Azure Portal.**

Example:
```json
"env": {
  "OAUTH2_CLIENT_ID": "12345678-1234-1234-1234-123456789abc"
}
```

## Step 4: Authenticate (First Time Only)

Before starting Claude Desktop, authenticate your MCP server:

```powershell
# Navigate to your project
cd "C:\Vscode\M365_mail_calendar_mcp"

# Authenticate with Microsoft Graph (opens browser)
run-mcp-server.bat auth

# Or if you haven't set up .env file:
run-mcp-server.bat auth --client-id YOUR_CLIENT_ID
```

## Step 5: Restart Claude Desktop

1. **Close Claude Desktop completely**
2. **Restart Claude Desktop**
3. **Check for your MCP server in the interface**

## Step 6: Test Your Integration

In Claude Desktop, you can now use commands like:

**📧 Email Operations:**
- "List my recent emails"
- "Send an email to john@example.com about the meeting tomorrow"
- "Show me unread messages from this week"
- "Delete the email with subject 'Old Newsletter'"

**📅 Calendar Operations:**
- "Show my calendar for today"
- "Create a meeting tomorrow at 2 PM with Alice about project review"
- "List all events for next week"
- "Update my 3 PM meeting to 4 PM"

## 🔧 Troubleshooting

### Claude Desktop Not Detecting MCP Server

1. **Check config file path** - Make sure it's in the exact location
2. **Validate JSON** - Use a JSON validator to check syntax
3. **Check file paths** - Ensure all paths in the config exist
4. **Restart Claude Desktop** - Close completely and reopen

### Authentication Issues

```powershell
# Check authentication status
run-mcp-server.bat auth --status

# Re-authenticate if needed
run-mcp-server.bat auth --logout
run-mcp-server.bat auth
```

### Server Not Starting

```powershell
# Test server manually
run-mcp-server.bat start --transport stdio

# Check for error messages
```

### Logs and Debugging

Claude Desktop logs are typically in:
- **Windows:** `%APPDATA%\Claude\logs\`
- **Mac:** `~/Library/Logs/Claude/`

## 📝 Complete Example Config

Here's a complete working example:

```json
{
  "mcpServers": {
    "microsoft-graph": {
      "command": "C:\\Vscode\\M365_mail_calendar_mcp\\run-mcp-server.bat",
      "args": ["start"],
      "env": {
        "OAUTH2_CLIENT_ID": "12345678-1234-1234-1234-123456789abc"
      }
    }
  },
  "globalShortcut": "CommandOrControl+Shift+C"
}
```

## 🎯 Success Indicators

You'll know it's working when:

1. ✅ Claude Desktop starts without errors
2. ✅ You can see Microsoft Graph tools in Claude's interface
3. ✅ Commands like "list my emails" work
4. ✅ Authentication tokens are automatically used

## 🔒 Security Note

The MCP server will automatically use your stored authentication tokens. You only need to authenticate once unless tokens expire or you logout.

---

**Need the Azure Client ID?** 
Go to [Azure Portal](https://portal.azure.com) → App registrations → Your app → Overview → Copy "Application (client) ID"