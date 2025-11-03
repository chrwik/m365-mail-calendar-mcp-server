# Microsoft Graph Mail & Calendar MCP Server

This is a Model Context Protocol (MCP) server that provides access to Microsoft Graph Mail and Calendar APIs with **built-in device code flow authentication**.

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Microsoft 365 app registration (see setup guide below)

### 1. Azure App Registration Setup
1. Go to [Azure Portal](https://portal.azure.com) → **App registrations** → **New registration**
2. Set **Redirect URI** to `http://localhost` (Public client/native)
3. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**
4. Add these permissions:
   - `User.Read`
   - `Mail.Read`
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `Calendars.Read`
   - `Calendars.ReadWrite`
5. Copy your **Application (client) ID**

### 2. Authentication Setup

**First time setup - Authenticate with Microsoft Graph:**
```cmd
cd graph-mail-calendar-sdk-mcp-typescript
node bin/mcp-server.js auth --client-id YOUR_CLIENT_ID
```

This will:
- Open your browser to Microsoft's device code page
- Show you a code to enter
- Store your tokens securely for future use

**Check authentication status:**
```cmd
node bin/mcp-server.js auth --status --client-id YOUR_CLIENT_ID
```

**Logout (clear stored tokens):**
```cmd
node bin/mcp-server.js auth --logout --client-id YOUR_CLIENT_ID
```

### 3. Running the Server

**Using the batch file (Windows):**
```cmd
run-mcp-server.bat start --transport stdio
```

**Direct command:**
```cmd
cd graph-mail-calendar-sdk-mcp-typescript
node bin/mcp-server.js start --transport stdio
```

The server will automatically use stored authentication tokens!

## 🔧 Configuration Options

### Environment Variables
You can set these for easier usage:

```bash
OAUTH2_CLIENT_ID=your-azure-app-id
# Optional: OAUTH2_TENANT_ID=your-tenant-id
```

With environment variables set, you can use:
```cmd
node bin/mcp-server.js auth  # Uses OAUTH2_CLIENT_ID
node bin/mcp-server.js start  # Automatically finds and uses stored tokens
```

### Claude Desktop Integration
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "graph-mail-calendar": {
      "command": "C:\\Vscode\\M365_mail_calendar_mcp\\run-mcp-server.bat",
      "args": ["start"],
      "env": {
        "OAUTH2_CLIENT_ID": "your-app-id"
      }
    }
  }
}
```

**First time with Claude Desktop:**
1. Run authentication first: `node bin/mcp-server.js auth --client-id YOUR_CLIENT_ID`
2. Add the configuration above to Claude Desktop
3. Restart Claude Desktop - it will use your stored tokens automatically!

## 🛠️ Available Tools

### 📧 Email Management
- `list-me-messages` - List messages in your mailbox
- `get-me-message` - Get a specific message by ID  
- `delete-me-message` - Delete a message
- `update-me-message` - Update message properties
- `send-mail` - Send new emails
- `list-user-messages` - List messages for other users

### 📅 Calendar Management  
- `list-me-events` - List your calendar events
- `get-me-event` - Get a specific event by ID
- `create-me-event` - Create new calendar events
- `update-me-event` - Update existing events  
- `delete-me-event` - Delete calendar events
- `get-me-calendar-view` - Get calendar view for date range
- `list-user-events` - List events for other users

## 🔐 Required Microsoft Graph Permissions

Your Azure app registration needs these scopes:
- `User.Read` - Read user profile
- `Mail.Read` - Read user mail  
- `Mail.ReadWrite` - Read and write user mail
- `Mail.Send` - Send mail as user
- `Calendars.Read` - Read user calendars
- `Calendars.ReadWrite` - Read and write user calendars

## 🏗️ Development

### Building
```bash
npm run build
```

### Linting  
```bash
npm run lint
```

## 📦 Files Generated
- `mcp-server.dxt` - Desktop extension package
- `bin/mcp-server.js` - Compiled server executable
- Full TypeScript source in `src/` directory

---

Built with [Speakeasy](https://speakeasy.com) from OpenAPI spec.