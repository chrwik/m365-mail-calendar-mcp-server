# Microsoft Graph MCP Server - Setup Guide

## 🎯 Complete Setup Guide

### Step 1: Azure App Registration

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com
   - Sign in with your Microsoft 365 account

2. **Create App Registration**
   - Navigate to **Azure Active Directory** → **App registrations**
   - Click **New registration**
   - Name: `MCP Graph Server` (or any name you prefer)
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: **Public client/native (mobile & desktop)** → `http://localhost`
   - Click **Register**

3. **Configure API Permissions**
   - Go to **API permissions** → **Add a permission**
   - Select **Microsoft Graph** → **Delegated permissions**
   - Add these permissions:
     - ✅ `User.Read` - Read user profile
     - ✅ `Mail.Read` - Read user mail
     - ✅ `Mail.ReadWrite` - Read and write user mail
     - ✅ `Mail.Send` - Send mail as user
     - ✅ `Calendars.Read` - Read user calendars
     - ✅ `Calendars.ReadWrite` - Read and write user calendars
   - Click **Add permissions**
   - **Important**: Click **Grant admin consent** if you're an admin, or request admin consent

4. **Copy Application ID**
   - Go to **Overview** tab
   - Copy the **Application (client) ID** - you'll need this!

### Step 2: Authentication Setup

**Option A: Set Environment Variable (Recommended)**
```cmd
set OAUTH2_CLIENT_ID=your-copied-client-id
```

**Then authenticate:**
```cmd
cd graph-mail-calendar-sdk-mcp-typescript
node bin/mcp-server.js auth
```

**Option B: Direct Command**
```cmd
cd graph-mail-calendar-sdk-mcp-typescript
node bin/mcp-server.js auth --client-id your-copied-client-id
```

**What happens during authentication:**
1. The command will show you a URL (like https://microsoft.com/devicelogin)
2. It will display a short code (like `ABC123`)
3. Open the URL in your browser
4. Enter the code when prompted
5. Sign in with your Microsoft account
6. Grant permissions to your app
7. Return to the command line - authentication complete!

### Step 3: Test the Server

**Check authentication status:**
```cmd
node bin/mcp-server.js auth --status
```

**Start the server:**
```cmd
node bin/mcp-server.js start --transport stdio
```

**Or using the batch file:**
```cmd
run-mcp-server.bat start
```

### Step 4: Claude Desktop Integration

1. **Find your Claude Desktop config file:**
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. **Add this configuration:**
```json
{
  "mcpServers": {
    "microsoft-graph": {
      "command": "C:\\path\\to\\your\\run-mcp-server.bat",
      "args": ["start"],
      "env": {
        "OAUTH2_CLIENT_ID": "your-client-id-here"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

### Step 5: Test with Claude

Once configured, you can use Claude to:

**📧 Email Management:**
- "List my recent emails"
- "Send an email to john@example.com about the meeting"
- "Show me unread messages from last week"

**📅 Calendar Management:**
- "Show my calendar for today"
- "Create a meeting tomorrow at 2 PM"
- "List all events for next week"

## 🔧 Advanced Configuration

### Multiple Tenants
```cmd
node bin/mcp-server.js auth --client-id YOUR_CLIENT_ID --tenant-id YOUR_TENANT_ID
```

### Logout/Reset
```cmd
node bin/mcp-server.js auth --logout
```

### Check Token Status
```cmd
node bin/mcp-server.js auth --status
```

## 🛠️ Troubleshooting

### "No valid authentication found"
- Run: `node bin/mcp-server.js auth --client-id YOUR_CLIENT_ID`
- Make sure you completed the browser authentication

### "Token refresh failed"
- Your tokens may have expired
- Re-authenticate: `node bin/mcp-server.js auth --client-id YOUR_CLIENT_ID`

### "Insufficient permissions"
- Check that you added all required permissions in Azure Portal
- Make sure admin consent was granted

### Claude Desktop Not Working
- Verify the config file path is correct
- Check that the `command` path points to your batch file
- Restart Claude Desktop after config changes
- Check Claude Desktop logs for errors

## 📁 Files Created

The authentication process creates these secure files:
- `~/.mcp-graph-auth/tokens.enc` - Encrypted authentication tokens
- Tokens are automatically refreshed when needed
- Only accessible by your user account

## 🔒 Security Notes

- Tokens are encrypted and stored locally
- No sensitive data is sent to third parties
- Tokens are automatically refreshed
- You can logout anytime to clear stored tokens

## ✅ Success Checklist

- [ ] Azure app registration created
- [ ] API permissions added and consented
- [ ] Application ID copied
- [ ] Authentication completed successfully
- [ ] Server starts without errors
- [ ] Claude Desktop config updated
- [ ] Claude Desktop restarted
- [ ] Tested email/calendar operations

---

Need help? Check the main README.md or create an issue in the repository.