const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configuration
const MCP_SERVER_PATH = path.join(__dirname, '..', 'graph-mail-calendar-sdk-mcp-typescript', 'bin', 'mcp-server.js');
const CLIENT_ID = process.env.OAUTH2_CLIENT_ID || "62f45267-fbb7-47d3-ae23-0b09855b283c";
const TENANT_ID = process.env.AZURE_TENANT_ID || "52ddf1b2-4f9b-4c8c-8006-0e1b5b89176c";

/**
 * Call MCP server tool and return result
 */
async function callMCPTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Calling MCP tool: ${toolName} with args:`, JSON.stringify(args, null, 2));
    
    // Create MCP request
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: { roots: { listChanged: true }, sampling: {} },
        clientInfo: { name: "http-wrapper", version: "1.0.0" }
      }
    };
    
    const toolRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    // Spawn MCP server process
    const mcp = spawn('node', [MCP_SERVER_PATH, 'start', '--transport', 'stdio'], {
      env: {
        ...process.env,
        OAUTH2_CLIENT_ID: CLIENT_ID,
        AZURE_TENANT_ID: TENANT_ID
      },
      cwd: path.dirname(MCP_SERVER_PATH)
    });
    
    let stdout = '';
    let stderr = '';
    let responses = [];
    
    mcp.stdout.on('data', (data) => {
      stdout += data.toString();
      
      // Try to parse complete JSON responses
      const lines = stdout.split('\n');
      stdout = lines.pop() || ''; // Keep incomplete line
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line.trim());
            responses.push(response);
          } catch (e) {
            // Ignore parse errors for non-JSON output (like logs)
          }
        }
      }
    });
    
    mcp.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('MCP stderr:', data.toString());
    });
    
    mcp.on('close', (code) => {
      console.log(`MCP server closed with code: ${code}`);
      
      if (code !== 0) {
        return reject(new Error(`MCP server failed with code ${code}. stderr: ${stderr}`));
      }
      
      // Find the tool response (id: 2)
      const toolResponse = responses.find(r => r.id === 2);
      
      if (!toolResponse) {
        return reject(new Error('No tool response received from MCP server'));
      }
      
      if (toolResponse.error) {
        return reject(new Error(`MCP tool error: ${toolResponse.error.message || toolResponse.error}`));
      }
      
      resolve(toolResponse.result);
    });
    
    mcp.on('error', (error) => {
      console.error('MCP server spawn error:', error);
      reject(error);
    });
    
    // Send initialization and tool request
    try {
      mcp.stdin.write(JSON.stringify(initRequest) + '\n');
      mcp.stdin.write(JSON.stringify(toolRequest) + '\n');
      mcp.stdin.end();
    } catch (error) {
      console.error('Failed to write to MCP server:', error);
      reject(error);
    }
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!mcp.killed) {
        mcp.kill();
        reject(new Error('MCP server timeout (30s)'));
      }
    }, 30000);
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Microsoft Graph HTTP Wrapper',
    timestamp: new Date().toISOString()
  });
});

// Authentication status
app.get('/auth/status', async (req, res) => {
  try {
    // Try to call a simple tool to check auth status
    const result = await callMCPTool('list-me-messages', { 
      request: { Dollar_top: 1 } 
    });
    
    // If we get here without device code request, we're authenticated
    res.json({ 
      authenticated: true,
      message: 'Authentication is valid'
    });
  } catch (error) {
    if (error.message && error.message.includes('Microsoft Graph Authentication Required')) {
      res.json({ 
        authenticated: false,
        message: 'Authentication required - please complete device flow'
      });
    } else {
      res.status(500).json({ 
        authenticated: false,
        error: error.message 
      });
    }
  }
});

// Email endpoints
app.get('/api/emails', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const orderBy = req.query.orderby || 'receivedDateTime desc';
    
    const result = await callMCPTool('list-me-messages', {
      request: {
        Dollar_top: limit,
        Dollar_orderby: orderBy
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emails/:id', async (req, res) => {
  try {
    const result = await callMCPTool('get-me-message', {
      request: {
        id: req.params.id
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emails/send', async (req, res) => {
  try {
    const { to, subject, body, contentType = 'Text' } = req.body;
    
    if (!to || !subject) {
      return res.status(400).json({ error: 'Missing required fields: to, subject' });
    }
    
    const result = await callMCPTool('send-mail', {
      request: {
        message: {
          subject: subject,
          body: {
            contentType: contentType,
            content: body || ''
          },
          toRecipients: Array.isArray(to) ? to : [{ emailAddress: { address: to } }]
        }
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Calendar endpoints
app.get('/api/calendar/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const orderBy = req.query.orderby || 'start/dateTime desc';
    
    const result = await callMCPTool('list-me-events', {
      request: {
        Dollar_top: limit,
        Dollar_orderby: orderBy
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/calendar/view', async (req, res) => {
  try {
    const startTime = req.query.startTime || new Date().toISOString();
    const endTime = req.query.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const result = await callMCPTool('get-me-calendar-view', {
      request: {
        startTime: startTime,
        endTime: endTime
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching calendar view:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/calendar/events', async (req, res) => {
  try {
    const { subject, start, end, body, location } = req.body;
    
    if (!subject || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields: subject, start, end' });
    }
    
    const event = {
      subject: subject,
      start: {
        dateTime: start,
        timeZone: 'UTC'
      },
      end: {
        dateTime: end,
        timeZone: 'UTC'
      }
    };
    
    if (body) {
      event.body = {
        contentType: 'Text',
        content: body
      };
    }
    
    if (location) {
      event.location = {
        displayName: location
      };
    }
    
    const result = await callMCPTool('create-me-event', {
      request: { event }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generic MCP tool endpoint
app.post('/api/mcp/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const args = req.body;
    
    const result = await callMCPTool(toolName, args);
    res.json(result);
  } catch (error) {
    console.error(`Error calling MCP tool ${toolName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// List available tools
app.get('/api/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'list-me-messages',
        description: 'List messages in the signed-in user\'s mailbox',
        endpoint: 'GET /api/emails'
      },
      {
        name: 'get-me-message',
        description: 'Get a specific message',
        endpoint: 'GET /api/emails/:id'
      },
      {
        name: 'send-mail',
        description: 'Send an email message',
        endpoint: 'POST /api/emails/send'
      },
      {
        name: 'list-me-events',
        description: 'List calendar events',
        endpoint: 'GET /api/calendar/events'
      },
      {
        name: 'get-me-calendar-view',
        description: 'Get calendar view for a time range',
        endpoint: 'GET /api/calendar/view'
      },
      {
        name: 'create-me-event',
        description: 'Create a calendar event',
        endpoint: 'POST /api/calendar/events'
      }
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Microsoft Graph HTTP Wrapper running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Available endpoints:`);
  console.log(`   GET  /api/emails           - List emails`);
  console.log(`   GET  /api/emails/:id       - Get specific email`);
  console.log(`   POST /api/emails/send      - Send email`);
  console.log(`   GET  /api/calendar/events  - List calendar events`);
  console.log(`   GET  /api/calendar/view    - Get calendar view`);
  console.log(`   POST /api/calendar/events  - Create calendar event`);
  console.log(`   POST /api/mcp/:toolName    - Call any MCP tool directly`);
  console.log(`   GET  /api/tools            - List available tools`);
  console.log(`   GET  /auth/status          - Check authentication status`);
});