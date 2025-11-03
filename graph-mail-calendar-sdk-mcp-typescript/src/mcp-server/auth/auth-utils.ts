/*
 * Authentication utilities for MCP server startup
 */

import { DeviceFlowAuth } from "../auth/device-flow.js";

export interface AuthConfig {
  clientId?: string;
  tenantId?: string;
  tokenStorePath?: string;
}

export async function getValidAccessToken(config?: AuthConfig): Promise<string | null> {
  // First check if OAuth2 token is provided directly
  const directToken = process.env["OAUTH2_TOKEN"] || process.env["GRAPH_ACCESS_TOKEN"];
  if (directToken) {
    return directToken;
  }

  // If no config provided, try to use environment variables
  const clientId = config?.clientId || 
    process.env["OAUTH2_CLIENT_ID"] || 
    process.env["GRAPH_CLIENT_ID"];
  
  if (!clientId) {
    return null; // No authentication configuration available
  }

  const tenantId = config?.tenantId || process.env["OAUTH2_TENANT_ID"];
  const authOptions: any = { clientId };
  if (tenantId) authOptions.tenantId = tenantId;
  if (config?.tokenStorePath) authOptions.tokenStorePath = config.tokenStorePath;

  const auth = new DeviceFlowAuth(authOptions);

  // Try to get a valid token from storage
  try {
    const token = await auth.getValidAccessToken();
    return token;
  } catch (error) {
    console.warn("Failed to get valid access token:", error);
    return null;
  }
}

export async function ensureAuthenticated(config?: AuthConfig): Promise<string> {
  const token = await getValidAccessToken(config);
  
  if (!token) {
    const clientId = config?.clientId || 
      process.env["OAUTH2_CLIENT_ID"] || 
      process.env["GRAPH_CLIENT_ID"];
      
    if (!clientId) {
      throw new Error(`
Authentication required but no client ID configured.

Please either:
1. Set environment variable: OAUTH2_CLIENT_ID=your-client-id
2. Run authentication: mcp auth --client-id your-client-id
3. Provide access token: OAUTH2_TOKEN=your-token

Get a client ID from: https://portal.azure.com → App registrations
      `.trim());
    }

    throw new Error(`
No valid authentication found.

Please run: mcp auth --client-id ${clientId}

This will start the device code flow to authenticate with Microsoft Graph.
      `.trim());
  }

  return token;
}