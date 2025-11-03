# Microsoft Graph HTTP Wrapper for n8n

This HTTP wrapper makes the Microsoft Graph MCP server compatible with n8n HTTP streaming and other HTTP-based integrations.

## Features

- ✅ **RESTful API** endpoints for Microsoft 365 operations
- ✅ **Reuses existing authentication** from MCP server
- ✅ **n8n compatible** HTTP streaming
- ✅ **Automatic token management** 
- ✅ **Error handling** with proper HTTP status codes
- ✅ **CORS enabled** for web applications

## Quick Start

1. **Install dependencies:**
```bash
cd http-wrapper
npm install
```

2. **Set environment variables:**
```bash
# Create .env file
echo "OAUTH2_CLIENT_ID=62f45267-fbb7-47d3-ae23-0b09855b283c" > .env
echo "AZURE_TENANT_ID=52ddf1b2-4f9b-4c8c-8006-0e1b5b89176c" >> .env
echo "PORT=3000" >> .env
```

3. **Start the server:**
```bash
npm start
```

4. **Test the server:**
```bash
curl http://localhost:3000/health
```

## API Endpoints

### Authentication
- `GET /auth/status` - Check authentication status
- `GET /health` - Health check

### Email Operations
- `GET /api/emails` - List emails
  - Query params: `limit`, `orderby`
- `GET /api/emails/:id` - Get specific email
- `POST /api/emails/send` - Send email
  ```json
  {
    "to": "user@example.com",
    "subject": "Test Subject",
    "body": "Email content",
    "contentType": "Text"
  }
  ```

### Calendar Operations
- `GET /api/calendar/events` - List calendar events
- `GET /api/calendar/view` - Get calendar view
  - Query params: `startTime`, `endTime`
- `POST /api/calendar/events` - Create event
  ```json
  {
    "subject": "Meeting",
    "start": "2025-11-03T10:00:00Z",
    "end": "2025-11-03T11:00:00Z",
    "body": "Meeting description",
    "location": "Conference Room"
  }
  ```

### Generic MCP Access
- `POST /api/mcp/:toolName` - Call any MCP tool directly
- `GET /api/tools` - List available tools

## Usage Examples

### List Latest Emails
```bash
curl "http://localhost:3000/api/emails?limit=5"
```

### Send Email
```bash
curl -X POST http://localhost:3000/api/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test from API",
    "body": "Hello from the HTTP wrapper!"
  }'
```

### Create Calendar Event
```bash
curl -X POST http://localhost:3000/api/calendar/events \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Team Meeting",
    "start": "2025-11-04T14:00:00Z",
    "end": "2025-11-04T15:00:00Z",
    "location": "Conference Room A"
  }'
```

## n8n Integration

### HTTP Request Node Configuration

1. **Method:** GET/POST (depending on operation)
2. **URL:** `http://localhost:3000/api/emails`
3. **Headers:** 
   - `Content-Type: application/json`
4. **Authentication:** None (uses MCP server's device flow)

### Example n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Get Latest Emails",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:3000/api/emails?limit=10",
        "options": {}
      }
    }
  ]
}
```

## Authentication Flow

1. **First API call** triggers device authentication if needed
2. **Complete device flow** in browser (one-time setup)
3. **Subsequent calls** use stored tokens automatically
4. **Token refresh** handled automatically

## Error Handling

- `200` - Success
- `400` - Bad Request (missing parameters)
- `401` - Authentication required
- `500` - Server error

## Development

```bash
# Development with auto-reload
npm run dev

# Check logs
tail -f logs/wrapper.log
```

## Security Notes

- Uses same secure token storage as MCP server
- CORS enabled for web applications
- Request/response logging for debugging
- Environment variable configuration

## Troubleshooting

### Authentication Issues
1. Check `/auth/status` endpoint
2. Verify environment variables
3. Complete device flow authentication

### Connection Issues
1. Ensure MCP server path is correct
2. Check Node.js is installed
3. Verify port 3000 is available