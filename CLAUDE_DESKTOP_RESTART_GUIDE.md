# Claude Desktop MCP Server Setup Guide

## Current Status ✅

Your Microsoft Graph MCP server is fully built and configured. Here's what we've completed:

### ✅ Completed Tasks
- **MCP Server**: Built and functional with all Microsoft Graph tools
- **Interactive Authentication**: Automatic device flow authentication system  
- **Error Handling**: Graceful failure handling, no server crashes
- **Claude Desktop Config**: Fixed UTF-8 BOM issues, properly formatted JSON
- **Azure Integration**: Ready for tenant configuration

### 🔄 Next Steps Required

## 1. Restart Claude Desktop

**IMPORTANT**: You must completely restart Claude Desktop for the configuration changes to take effect.

1. **Close Claude Desktop** completely (not just minimize)
2. **Wait 5 seconds**  
3. **Reopen Claude Desktop**

## 2. Verify MCP Server Connection

After restarting Claude Desktop:

1. The Microsoft Graph server should appear in your integrations
2. You should see `microsoft-graph-mail-calendar` as an available MCP server
3. Try asking: **"List my last 3 emails"** or **"Show my calendar events"**

## 3. Expected Authentication Flow

When you first use any Microsoft Graph tool, you should see:

```
🔧 Microsoft 365 Authentication Setup Required

I can help you access your Microsoft 365 emails and calendar, but first we need to configure the Azure app registration properly.

The Issue: Your Azure app registration needs tenant configuration for the device code authentication flow.

Quick Fix Steps:
1. Open Azure Portal: Go to portal.azure.com
2. Navigate to: Azure Active Directory → App registrations  
3. Find your app: Look for Client ID 62f45267...
4. Click Authentication in the left sidebar
5. Update account types: Select "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
6. Save the changes
7. Wait 5-10 minutes for Azure to propagate changes
8. Try your request again
```

## 4. After Azure Configuration

Once you fix the Azure tenant configuration, you'll see:

```
🔐 Microsoft Graph Authentication Required

To use 'list-me-messages' and access your Microsoft 365 data, please authenticate:

Step 1: Open Browser
📱 Go to: https://microsoft.com/devicelogin

Step 2: Enter Code  
🔑 Enter this code: XXXXXXXXX

Step 3: Sign In
✅ Sign in with your Microsoft 365 account
✅ Grant the requested permissions

Step 4: Return Here
🔄 Come back and try your request again
```

## 5. Troubleshooting

### If the server doesn't appear:
- Ensure Claude Desktop was completely restarted
- Check that the config file exists: `%APPDATA%\Claude\claude_desktop_config.json`
- Verify no syntax errors in the config file

### If authentication fails:
- Follow the Azure configuration steps exactly
- Wait 5-10 minutes after Azure changes
- Try clearing stored tokens if needed

### If you see generic responses:
- This means Claude Desktop isn't connecting to our MCP server
- Restart Claude Desktop again
- Check the logs: `%APPDATA%\Claude\logs\main.log`

## Current Configuration

Your Claude Desktop configuration is set to:
- **Server Name**: `microsoft-graph-mail-calendar`
- **Client ID**: `62f45267-fbb7-47d3-ae23-0b09855b283c`
- **Tenant**: `organizations` (multi-tenant)

## Available Tools

Once connected, you'll have access to:
- **Email**: List, read, send, update, delete messages
- **Calendar**: List, create, update, delete events  
- **Calendar Views**: Get calendar data within time ranges
- **User Operations**: Access other users' emails/calendars (with permissions)

## Success Indicators

✅ **Connected**: You see specific authentication instructions with device codes
✅ **Authenticated**: You can access your actual Microsoft 365 data
✅ **Working**: All email and calendar operations function normally

**Need Help?** If you're still seeing generic responses after restarting Claude Desktop and following the Azure configuration, there may be a deeper integration issue that requires further debugging.