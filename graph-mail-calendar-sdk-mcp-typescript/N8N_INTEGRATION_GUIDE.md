# MCP Server with SSE Transport for n8n Integration

This project provides a **Microsoft Graph Mail and Calendar MCP Server** with multiple transport options for different integration scenarios.

## 🚀 Quick Start

### For n8n MCP Client Tool (SSE Transport)

1. **Start the SSE Server:**
```bash
cd C:\Vscode\M365_mail_calendar_mcp\graph-mail-calendar-sdk-mcp-typescript
node mcp-sse-server-simple.js
```

2. **Server will be available at:**
- 📡 **SSE Endpoint**: `http://localhost:3001/sse`
- 🏥 **Health Check**: `http://localhost:3001/health`
- ℹ️ **Server Info**: `http://localhost:3001/info`

### For Claude Desktop (stdio Transport)

1. **Configure Claude Desktop** with the existing MCP server setup in `claude_desktop_config.json`

## 🔧 n8n MCP Client Tool Configuration

### Step 1: Install n8n MCP Client Tool
In your n8n workflow, add the **MCP Client Tool** node from the community nodes.

### Step 2: Configure the MCP Client Tool Node

**Basic Configuration:**
- **SSE Endpoint URL**: `http://localhost:3001/sse`
- **Authentication**: None (for local development)
- **Protocol Version**: `2024-11-05`

**Advanced Configuration:**
- **Connection Type**: Server-Sent Events (SSE)
- **Timeout**: 30000ms (30 seconds)
- **Keep-Alive**: Yes

### Step 3: Available Microsoft Graph Tools

The server provides the following tools for Microsoft Graph operations:

#### 📧 Email Management
- `listMeMessages` - List emails from user mailbox
- `getMeMessage` - Get specific email by ID  
- `deleteMeMessage` - Delete email by ID
- `updateMeMessage` - Update email properties
- `listUserMessages` - List emails for specific user
- `sendMail` - Send email to recipients

#### 📅 Calendar Management  
- `listMeEvents` - List calendar events
- `createMeEvent` - Create new calendar event
- `getMeEvent` - Get specific event by ID
- `updateMeEvent` - Update calendar event
- `deleteMeEvent` - Delete calendar event
- `listUserEvents` - List events for specific user
- `getMeCalendarView` - Get calendar view for date range

## 🏗️ Architecture Overview

### Transport Options

1. **SSE Transport (for n8n)**:
   - Server: `mcp-sse-server-simple.js` 
   - Port: 3001
   - Protocol: HTTP with Server-Sent Events
   - Use Case: n8n MCP Client Tool integration

2. **stdio Transport (for Claude Desktop)**:
   - Server: Built-in MCP server  
   - Protocol: JSON-RPC over stdio
   - Use Case: Claude Desktop integration

3. **HTTP Wrapper (for general HTTP clients)**:
   - Server: `http-wrapper/server.js`
   - Port: 3000  
   - Protocol: RESTful HTTP API
   - Use Case: General HTTP streaming compatibility

### Authentication Flow

All transport options use the same OAuth2 Device Flow authentication:

1. **Initial Setup**: Run authentication to get device code
2. **Token Storage**: Encrypted tokens stored in `.auth/` directory  
3. **Automatic Refresh**: Tokens refreshed automatically when needed
4. **Persistent State**: Device auth state maintained across sessions

## 🧪 Testing the Integration

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T...",
  "transport": "sse", 
  "version": "0.0.1"
}
```

### Test 2: Server Information
```bash
curl http://localhost:3001/info
```

### Test 3: SSE Connection (using curl)
```bash
curl -H "Accept: text/event-stream" http://localhost:3001/sse
```

### Test 4: n8n Workflow Example

Create an n8n workflow with:

1. **Trigger Node** (Manual/Webhook)
2. **MCP Client Tool Node**:
   - SSE Endpoint: `http://localhost:3001/sse`
   - Tool: `listMeMessages`
   - Parameters: `{}`
3. **Output Node** to display results

## 📁 Project Structure

```
graph-mail-calendar-sdk-mcp-typescript/
├── src/                          # TypeScript MCP server source
│   ├── mcp-server/              # Core MCP server implementation
│   │   ├── auth/                # OAuth2 authentication 
│   │   ├── tools/               # Microsoft Graph tool implementations
│   │   └── server.ts            # Main MCP server setup
│   └── mcp-sse-server.ts        # TypeScript SSE server (needs compilation)
├── mcp-sse-server-simple.js     # Simple JavaScript SSE server (ready to run)
├── http-wrapper/                # Express.js HTTP wrapper
│   ├── server.js               # HTTP server with MCP bridge
│   └── README.md               # HTTP wrapper documentation  
├── .env                        # Environment variables
├── .auth/                      # OAuth2 token storage (encrypted)
└── package.json               # Node.js dependencies
```

## 🔐 Security Considerations

### For Production Deployment

1. **Environment Variables**:
```bash
MCP_SSE_PORT=3001
MCP_SSE_HOST=localhost
TENANT_ID=your-tenant-id
CLIENT_ID=your-client-id  
CLIENT_SECRET=your-client-secret
```

2. **CORS Configuration**: Update allowed origins in `mcp-sse-server-simple.js`
3. **Authentication**: Add proper authentication middleware
4. **HTTPS**: Use HTTPS in production environments
5. **Firewall**: Restrict access to trusted networks only

### OAuth2 Token Security

- Tokens are encrypted using AES-256-CBC with system-derived keys
- Device auth state persisted to recover from interruptions  
- Automatic token refresh prevents expired token issues
- Tokens stored in `.auth/` directory (add to .gitignore)

## 🚨 Troubleshooting

### Common Issues

**1. "Cannot find module" error**
- Ensure you're in the correct directory
- Run: `npm install` to install dependencies

**2. "Port already in use" error**  
- Change port: `MCP_SSE_PORT=3002 node mcp-sse-server-simple.js`
- Or kill existing process using the port

**3. "Authentication failed" error**
- Re-run the OAuth2 device flow authentication
- Check tenant ID and client credentials
- Verify Azure AD app permissions

**4. n8n connection timeout**
- Increase timeout in n8n MCP Client Tool configuration
- Check network connectivity to localhost:3001
- Verify server is running: `curl http://localhost:3001/health`

**5. CORS errors in browser**
- CORS is configured for localhost and 127.0.0.1
- For other origins, update the CORS configuration

### Debug Mode

Enable detailed logging:
```bash
DEBUG=mcp* node mcp-sse-server-simple.js
```

## 📚 Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [OAuth2 Device Flow Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-device-code)

## 🤝 Integration Examples

### n8n Workflow Templates

1. **Email Processing Workflow**:
   - Trigger: Schedule/Webhook
   - MCP Tool: `listMeMessages` 
   - Processing: Filter/Transform emails
   - Output: Save to database/send notifications

2. **Calendar Management Workflow**:
   - Trigger: HTTP Request  
   - MCP Tool: `createMeEvent`
   - Integration: Sync with external calendar systems

3. **Email Automation Workflow**:  
   - Trigger: Database change
   - MCP Tool: `sendMail`
   - Use Case: Automated email notifications

---

## 🎯 Summary

You now have **three integration options**:

1. **n8n MCP Client Tool** → SSE Server (`localhost:3001/sse`)
2. **Claude Desktop** → stdio MCP Server (existing config) 
3. **General HTTP clients** → HTTP Wrapper (`localhost:3000`)

The SSE server is specifically optimized for n8n's MCP Client Tool, providing seamless integration with Microsoft Graph APIs for email and calendar operations.