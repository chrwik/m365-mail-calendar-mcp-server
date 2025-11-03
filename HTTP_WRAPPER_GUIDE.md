# Microsoft Graph HTTP Wrapper - Usage Guide

## 🎯 **SUCCESS! Your HTTP Wrapper is Ready**

The HTTP wrapper is now running and ready for n8n integration. Here's how to use it:

## 🚀 **Quick Setup**

### 1. Server is Running
```
✅ HTTP Server: http://localhost:3000
✅ Authentication: Reuses MCP server tokens
✅ CORS: Enabled for web applications
```

### 2. Test the Server
Open your browser and go to:
- **Health Check:** http://localhost:3000/health
- **Available Tools:** http://localhost:3000/api/tools
- **Auth Status:** http://localhost:3000/auth/status

## 📧 **n8n Integration Examples**

### Get Latest Emails
```http
GET http://localhost:3000/api/emails?limit=10
```

**n8n HTTP Request Node:**
- **Method:** GET
- **URL:** `http://localhost:3000/api/emails`
- **Query Parameters:** 
  - `limit`: `10`
  - `orderby`: `receivedDateTime desc`

### Send Email
```http
POST http://localhost:3000/api/emails/send
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Hello from n8n!",
  "body": "This email was sent through the HTTP wrapper",
  "contentType": "Text"
}
```

**n8n HTTP Request Node:**
- **Method:** POST
- **URL:** `http://localhost:3000/api/emails/send`
- **Body Type:** JSON
- **JSON Body:**
```json
{
  "to": "{{ $json.email }}",
  "subject": "{{ $json.subject }}",
  "body": "{{ $json.message }}"
}
```

### Get Calendar Events
```http
GET http://localhost:3000/api/calendar/events?limit=20
```

**n8n HTTP Request Node:**
- **Method:** GET
- **URL:** `http://localhost:3000/api/calendar/events`
- **Query Parameters:**
  - `limit`: `20`

### Create Calendar Event
```http
POST http://localhost:3000/api/calendar/events
Content-Type: application/json

{
  "subject": "Team Meeting",
  "start": "2025-11-04T14:00:00Z",
  "end": "2025-11-04T15:00:00Z",
  "body": "Weekly team sync",
  "location": "Conference Room A"
}
```

## 🔧 **Advanced Usage**

### Direct MCP Tool Access
Call any MCP tool directly:
```http
POST http://localhost:3000/api/mcp/list-me-messages
Content-Type: application/json

{
  "request": {
    "Dollar_top": 5,
    "Dollar_orderby": "receivedDateTime desc"
  }
}
```

### Authentication Check
```http
GET http://localhost:3000/auth/status
```

**Responses:**
- `{"authenticated": true}` - Ready to use
- `{"authenticated": false}` - Need to complete device flow

## 🔐 **Authentication Flow**

### First Time Setup
1. **Make any API call** (e.g., GET /api/emails)
2. **If not authenticated**, you'll get device code instructions
3. **Complete device flow** in browser (one-time setup)
4. **Subsequent calls** work automatically

### Authentication Response Example
```json
{
  "error": "Microsoft Graph Authentication Required - Go to: https://microsoft.com/devicelogin and enter code: ABC123XYZ"
}
```

## 📊 **Complete n8n Workflow Example**

### Email Processing Workflow
1. **Trigger:** Webhook or Schedule
2. **Get Emails:** HTTP Request to `/api/emails`
3. **Process:** Filter/transform email data
4. **Send Response:** HTTP Request to `/api/emails/send`

### Calendar Management Workflow
1. **Get Events:** HTTP Request to `/api/calendar/events`
2. **Check Conflicts:** Process event data
3. **Create Event:** HTTP Request to `/api/calendar/events` (POST)

## 🛠️ **Error Handling**

### Common Responses
- `200` - Success
- `400` - Bad Request (check parameters)
- `401` - Authentication required
- `500` - Server error (check logs)

### Debugging
- **Check server logs** in terminal
- **Verify authentication** at `/auth/status`
- **Test endpoints** in browser first

## 🔗 **Available Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/auth/status` | Authentication status |
| GET | `/api/tools` | List available tools |
| GET | `/api/emails` | List emails |
| GET | `/api/emails/:id` | Get specific email |
| POST | `/api/emails/send` | Send email |
| GET | `/api/calendar/events` | List calendar events |
| GET | `/api/calendar/view` | Calendar view (time range) |
| POST | `/api/calendar/events` | Create calendar event |
| POST | `/api/mcp/:toolName` | Call any MCP tool |

## 🎉 **You're Ready!**

Your Microsoft 365 MCP server now has:
- ✅ **HTTP API** for n8n integration
- ✅ **Persistent authentication** (device flow)
- ✅ **All Microsoft 365 features** (emails, calendar, etc.)
- ✅ **Error handling** and logging
- ✅ **CORS support** for web apps

**Start using it in n8n now!** 🚀