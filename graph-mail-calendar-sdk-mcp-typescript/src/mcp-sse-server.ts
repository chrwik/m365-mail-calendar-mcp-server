#!/usr/bin/env node

/**
 * MCP Server with SSE Transport for n8n MCP Client Tool
 * 
 * This server provides an SSE (Server-Sent Events) endpoint that n8n's MCP Client Tool
 * can connect to, in addition to the existing stdio transport for Claude Desktop.
 */

// Load environment variables from .env file
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Load .env from project root 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../../.env");
process.env['DOTENV_CONFIG_QUIET'] = 'true';
dotenv.config({ path: envPath, debug: false, override: false });

import express from 'express';
import cors from 'cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMCPServer } from './mcp-server/server.js';
import { getValidAccessToken } from './mcp-server/auth/auth-utils.js';
import { createConsoleLogger, consoleLoggerLevels } from './mcp-server/console-logger.js';

const app = express();
const PORT = parseInt(process.env['MCP_SSE_PORT'] || '3001');
const HOST = process.env['MCP_SSE_HOST'] || 'localhost';

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

async function startSSEServer() {
    const logger = createConsoleLogger("info");
    
    // Get OAuth2 token
    let oauth2Token: string;
    try {
        const tokenResult = await getValidAccessToken();
        if (!tokenResult) {
            throw new Error("No valid OAuth2 token available. Please run authentication first.");
        }
        oauth2Token = tokenResult;
        logger.info("OAuth2 token loaded successfully");
    } catch (error) {
        logger.error("Failed to get OAuth2 token", { error });
        throw error;
    }

    let transport: SSEServerTransport | undefined;

    // SSE endpoint for n8n MCP Client Tool
    app.get('/sse', async (req, res) => {
        try {
            logger.info("New SSE connection request", { 
                userAgent: req.get('User-Agent'),
                origin: req.get('Origin')
            });

            // Create the MCP server with OAuth2 token
            const mcpServer = createMCPServer({
                logger,
                security: {
                    oauth2: oauth2Token
                }
            });

            // Initialize SSE transport
            transport = new SSEServerTransport('/sse', res);
            
            // Connect server to transport
            await mcpServer.connect(transport);
            
            logger.info("MCP server connected via SSE transport");

            // Handle connection cleanup
            req.on('close', async () => {
                logger.info("SSE connection closed by client");
                try {
                    await mcpServer.close();
                    if (transport) {
                        await transport.close();
                    }
                } catch (error) {
                    logger.error("Error during SSE cleanup", { error });
                }
            });

            req.on('error', (error) => {
                logger.error("SSE connection error", { error });
            });

        } catch (error) {
            logger.error("Error in SSE endpoint", { error });
            res.status(500).json({ 
                error: 'Failed to establish SSE connection', 
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });

    // Handle POST messages (for MCP protocol)
    app.post('/message', async (req, res) => {
        try {
            if (!transport) {
                throw new Error("SSE transport not initialized");
            }

            await transport.handlePostMessage(req, res);
        } catch (error) {
            logger.error("Error handling POST message", { error });
            res.status(500).json({ 
                error: 'Failed to handle message', 
                details: error instanceof Error ? error.message : String(error)
            });
        }
    });

    // Start the HTTP server
    const httpServer = app.listen(PORT, HOST, () => {
        logger.info("MCP SSE server started for n8n MCP Client Tool", { 
            host: HOST, 
            port: PORT,
            sseEndpoint: `http://${HOST}:${PORT}/sse`,
            healthEndpoint: `http://${HOST}:${PORT}/health`,
            infoEndpoint: `http://${HOST}:${PORT}/info`
        });
        
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
    const controller = new AbortController();
    const abort = () => controller.abort();

    controller.signal.addEventListener("abort", async () => {
        if (closing) {
            logger.info("Received second signal. Forcing shutdown.");
            process.exit(1);
        }
        closing = true;

        logger.info("Shutting down MCP SSE server");

        const timer = setTimeout(() => {
            logger.info("Forcing shutdown");
            process.exit(1);
        }, 5000);

        httpServer.close(() => {
            clearTimeout(timer);
            logger.info("Graceful shutdown complete");
            process.exit(0);
        });
    });

    process.on("SIGTERM", abort);
    process.on("SIGINT", abort);
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startSSEServer().catch((error) => {
        console.error("Failed to start SSE server:", error);
        process.exit(1);
    });
}

export { startSSEServer };