# Interactive Authentication System

## Overview

The MCP server now supports **interactive authentication** that automatically triggers Microsoft Graph device code flow when users attempt to use tools that require authentication. This eliminates the need for users to manually run authentication commands.

## How It Works

### User Experience
1. User requests an action: *"Hi server, please list my last 3 emails"*
2. If not authenticated, the server responds with:
   ```
   🔐 Authentication Required

   To use 'list_messages' and other Microsoft Graph features, you need to authenticate first.

   Please follow these steps:

   1. Open your web browser and go to:
      📱 https://microsoft.com/devicelogin

   2. Enter this code when prompted:
      🔑 ABC123DEF

   3. Sign in with your Microsoft account
   4. Grant permissions to the application
   5. Return here and try your request again

   ⏱️ This code expires in 15 minutes.
   ```
3. User completes authentication in browser
4. User repeats original request: *"list my last 3 emails"*
5. Server executes the request successfully

### Technical Implementation

#### Core Components

1. **InteractiveAuthHandler** (`src/mcp-server/auth/interactive-auth.ts`)
   - Manages device code flow automatically
   - Provides user-friendly authentication instructions
   - Handles token validation and refresh

2. **Tool Wrapper** (`src/mcp-server/auth/tool-wrapper.ts`)
   - Wraps existing MCP tools with authentication logic
   - Automatically detects authentication errors
   - Triggers device flow when needed

#### Key Features

- **Automatic Detection**: Detects when authentication is required (401 errors, missing tokens)
- **Background Polling**: Polls Microsoft Graph for token completion without blocking
- **Token Persistence**: Stores tokens securely and handles refresh automatically
- **User-Friendly Instructions**: Provides clear, step-by-step authentication guidance
- **Error Handling**: Gracefully handles authentication failures and timeouts

## Implementation Details

### Authentication Flow

```typescript
// Simplified flow
1. Tool execution attempted
2. Check for valid tokens
3. If no valid tokens:
   a. Start device code flow
   b. Display instructions to user
   c. Poll for completion in background
   d. Return instructions immediately
4. If valid tokens exist:
   a. Execute original tool
   b. Return results
5. If auth error during execution:
   a. Clear invalid tokens
   b. Restart device flow
```

### Configuration

The system uses environment variables from `.env`:

```env
OAUTH2_CLIENT_ID=your-azure-app-client-id
OAUTH2_TENANT_ID=your-tenant-id  # Optional
```

### Token Storage

Tokens are stored encrypted in:
- Windows: `%APPDATA%/graph-mail-calendar-mcp/tokens.json`
- macOS/Linux: `~/.config/graph-mail-calendar-mcp/tokens.json`

## Usage Examples

### First-Time Authentication
```
User: "List my recent emails"
Server: [Displays device code instructions]
User: [Completes authentication in browser]
User: "List my recent emails" 
Server: [Returns email list]
```

### Subsequent Requests
```
User: "Create a calendar event"
Server: [Executes immediately - already authenticated]
```

### Token Expiration
```
User: "Get my messages"
Server: [Detects expired token, shows new device code]
User: [Completes re-authentication]
User: "Get my messages"
Server: [Returns messages with fresh token]
```

## Benefits

1. **Seamless UX**: No need to remember authentication commands
2. **Automatic**: Handles token refresh and expiration transparently  
3. **Secure**: Uses Microsoft's recommended device code flow
4. **Persistent**: Tokens stored securely across sessions
5. **Informative**: Clear instructions guide users through process

## Future Enhancements

- Support for multiple tenant authentication
- Integration with Azure CLI authentication
- Custom authentication callback URLs
- Enhanced error recovery mechanisms