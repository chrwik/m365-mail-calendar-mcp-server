#!/usr/bin/env node

/**
 * MCP Server with SSE Transport for n8n MCP Client Tool
 * 
 * This server provides an SSE (Server-Sent Events) endpoint that n8n's MCP Client Tool
 * can connect to. It's a simple Node.js server that doesn't require compilation.
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = parseInt(process.env.MCP_SSE_PORT || '3001');
const HOST = process.env.MCP_SSE_HOST || 'localhost';

// Enable CORS for n8n
app.use(cors({
    origin: ['http://localhost:5678', 'http://127.0.0.1:5678', '*'], // n8n default ports and allow all
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.text());

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        transport: 'sse',
        version: '0.0.1'
    });
});

// Server info endpoint
app.get('/info', (_req, res) => {
    res.json({
        name: 'Microsoft Graph Mail Calendar MCP Server',
        version: '0.0.1',
        description: 'MCP Server for Microsoft Graph Mail and Calendar operations with SSE transport for n8n compatibility',
        transport: 'sse',
        endpoints: {
            sse: '/sse',
            health: '/health',
            info: '/info'
        },
        capabilities: [
            'listMeMessages', 'getMeMessage', 'deleteMeMessage', 'updateMeMessage',
            'listUserMessages', 'sendMail', 'listMeEvents', 'createMeEvent', 
            'getMeEvent', 'updateMeEvent', 'deleteMeEvent', 'listUserEvents', 
            'getMeCalendarView'
        ]
    });
});

// SSE endpoint for n8n MCP Client Tool
app.get('/sse', async (req, res) => {
    try {
        console.log('📡 New SSE connection request from:', req.get('User-Agent'));

        // Set SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Send initial connection message
        res.write('event: message\n');
        res.write(`data: ${JSON.stringify({
            jsonrpc: "2.0",
            method: "notifications/initialized",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {
                    tools: {},
                },
                serverInfo: {
                    name: "microsoft-graph-mcp-server",
                    version: "0.0.1"
                }
            }
        })}\n\n`);

        console.log('✅ SSE connection established');

        // Handle connection cleanup
        req.on('close', () => {
            console.log('🔌 SSE connection closed by client');
        });

        req.on('error', (error) => {
            console.error('❌ SSE connection error:', error);
        });

        // Keep connection alive with periodic heartbeats
        const heartbeat = setInterval(() => {
            res.write('event: heartbeat\n');
            res.write('data: ping\n\n');
        }, 30000);

        req.on('close', () => {
            clearInterval(heartbeat);
        });

    } catch (error) {
        console.error('❌ Error in SSE endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to establish SSE connection', 
            details: error.message || String(error)
        });
    }
});

// Handle POST messages (for MCP protocol)
app.post('/message', async (req, res) => {
    try {
        console.log('📨 Received MCP message:', req.body);
        
        // This is a placeholder - the actual MCP server implementation would handle this
        // For now, return a basic response
        const response = {
            jsonrpc: "2.0",
            id: req.body.id || null,
            result: {
                content: [{
                    type: 'text',
                    text: `Received request for method: ${req.body.method}`
                }]
            }
        };

        res.json(response);
    } catch (error) {
        console.error('❌ Error handling POST message:', error);
        res.status(500).json({ 
            error: 'Failed to handle message', 
            details: error.message || String(error)
        });
    }
});

// Start the HTTP server
const httpServer = app.listen(PORT, HOST, () => {
    console.log(`\n🚀 MCP Server with SSE Transport is running!`);
    console.log(`📡 SSE Endpoint: http://${HOST}:${PORT}/sse`);
    console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
    console.log(`ℹ️  Server Info: http://${HOST}:${PORT}/info`);
    console.log(`\n📋 For n8n MCP Client Tool configuration:`);
    console.log(`   - SSE Endpoint: http://${HOST}:${PORT}/sse`);
    console.log(`   - Use this URL in n8n's MCP Client Tool node\n`);
});

// Graceful shutdown
let closing = false;
const shutdown = () => {
    if (closing) {
        console.log('\n🛑 Forcing shutdown...');
        process.exit(1);
    }
    closing = true;

    console.log('\n🛑 Shutting down MCP SSE server...');

    const timer = setTimeout(() => {
        console.log('🛑 Forcing shutdown');
        process.exit(1);
    }, 5000);

    httpServer.close(() => {
        clearTimeout(timer);
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { app, httpServer };