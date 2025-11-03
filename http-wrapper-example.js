// Example HTTP wrapper for n8n integration
const express = require('express');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());

// Wrapper to call MCP server tools via HTTP
app.post('/api/mcp/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const args = req.body;
    
    // Call MCP server with tool request
    const mcpRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    // Spawn MCP server process
    const mcp = spawn('node', ['bin/mcp-server.js', 'start', '--transport', 'stdio'], {
      cwd: './graph-mail-calendar-sdk-mcp-typescript',
      env: {
        ...process.env,
        OAUTH2_CLIENT_ID: "62f45267-fbb7-47d3-ae23-0b09855b283c",
        AZURE_TENANT_ID: "52ddf1b2-4f9b-4c8c-8006-0e1b5b89176c"
      }
    });
    
    // Send request and collect response
    mcp.stdin.write(JSON.stringify(mcpRequest) + '\n');
    
    let response = '';
    mcp.stdout.on('data', (data) => {
      response += data.toString();
    });
    
    mcp.on('close', () => {
      try {
        const result = JSON.parse(response.trim());
        res.json(result.result);
      } catch (error) {
        res.status(500).json({ error: 'Failed to parse MCP response' });
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Specific n8n-friendly endpoints
app.get('/api/emails', (req, res) => {
  // Redirect to MCP tool
  req.body = { 
    request: { 
      Dollar_top: req.query.limit || 10,
      Dollar_orderby: 'receivedDateTime desc' 
    }
  };
  // Call list-me-messages tool
});

app.listen(3000, () => {
  console.log('n8n HTTP wrapper running on port 3000');
});