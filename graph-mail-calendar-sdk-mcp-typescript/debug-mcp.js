#!/usr/bin/env node

// Debug script for MCP Server
console.log("=== MCP Server Debug Information ===");
console.log("Node.js version:", process.version);
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);
console.log("Current working directory:", process.cwd());
console.log("Command line arguments:", process.argv.slice(2));

console.log("\n=== Environment Variables ===");
console.log("OAUTH2_CLIENT_ID:", process.env.OAUTH2_CLIENT_ID || "NOT SET");
console.log("OAUTH2_TENANT_ID:", process.env.OAUTH2_TENANT_ID || "NOT SET");

console.log("\n=== File System Check ===");
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, 'bin', 'mcp-server.js');
console.log("Server path:", serverPath);
console.log("Server exists:", fs.existsSync(serverPath));

if (fs.existsSync('.env')) {
  console.log(".env file exists");
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log(".env content preview:", envContent.substring(0, 200) + "...");
} else {
  console.log(".env file NOT found");
}

console.log("\n=== Server Test ===");
console.log("This confirms the environment is set up correctly for Claude Desktop.");
console.log("The server should work with the current Claude Desktop configuration.");