/*
 * Tool wrapper that adds interactive authentication to MCP tools
 */

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { GraphMailCalendarSDKCore } from "../../core.js";
import { InteractiveAuthHandler } from "./interactive-auth.js";

export function withInteractiveAuth<T>(
  toolName: string,
  originalTool: (
    client: GraphMailCalendarSDKCore,
    args: T,
    extra: RequestHandlerExtra<any, any>
  ) => Promise<CallToolResult>
) {
  return async (
    args: T,
    extra: RequestHandlerExtra<any, any>
  ): Promise<CallToolResult> => {
    
    // Get client ID from environment
    const clientId = process.env["OAUTH2_CLIENT_ID"] || process.env["GRAPH_CLIENT_ID"];
    
    if (!clientId) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Configuration Error: No Microsoft Graph client ID found.

Please set up authentication by adding your Azure Application (client) ID to the environment:

**Option 1: Set environment variable**
OAUTH2_CLIENT_ID=your-azure-app-client-id

**Option 2: Create .env file** with:
OAUTH2_CLIENT_ID=your-azure-app-client-id

**Get your client ID from:**
1. Go to https://portal.azure.com
2. Navigate to Azure Active Directory → App registrations
3. Select your app (or create a new one)
4. Copy the "Application (client) ID" from the Overview page

**Required permissions for your Azure app:**
- User.Read
- Mail.Read, Mail.ReadWrite, Mail.Send
- Calendars.Read, Calendars.ReadWrite`
          }
        ],
        isError: true
      };
    }

    // Create interactive auth handler
    const authConfig: any = { clientId };
    const tenantId = process.env["AZURE_TENANT_ID"] || process.env["OAUTH2_TENANT_ID"];
    if (tenantId) authConfig.tenantId = tenantId;
    
    const authHandler = new InteractiveAuthHandler(authConfig);

    // Execute tool with interactive authentication
    return await authHandler.executeWithAuth(toolName, async () => {
      // Get valid token for SDK
      const validToken = await authHandler.getValidToken();
      if (!validToken) {
        throw new Error("Authentication required");
      }

      // Create authenticated client
      const authenticatedClient = new GraphMailCalendarSDKCore({
        security: { oauth2: validToken },
      });

      // Execute the original tool with authenticated client
      const result = await originalTool(authenticatedClient, args, extra);
      return result;
    });
  };
}

// Extend InteractiveAuthHandler to expose getValidToken
declare module "./interactive-auth.js" {
  interface InteractiveAuthHandler {
    getValidToken(): Promise<string>;
  }
}