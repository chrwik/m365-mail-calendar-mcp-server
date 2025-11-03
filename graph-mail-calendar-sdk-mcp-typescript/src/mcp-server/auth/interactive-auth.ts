/*
 * Interactive Authentication Wrapper for MCP Tools
 * Handles device flow authentication automatically when tools are called
 */

import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DeviceFlowAuth, DeviceCodeResponse } from "./device-flow.js";

export interface InteractiveAuthConfig {
  clientId: string;
  tenantId?: string;
  onAuthenticationRequired?: (deviceCode: DeviceCodeResponse) => void;
}

interface PendingDeviceAuth {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  interval: number;
  expiresAt: number;
}

interface StoredDeviceAuth extends PendingDeviceAuth {
  clientId: string;
  tenantId: string;
}

export class InteractiveAuthHandler {
  private deviceAuth: DeviceFlowAuth;
  private isAuthenticating = false;
  private pendingAuthentication: Promise<string | null> | null = null;
  private pendingDeviceAuth: PendingDeviceAuth | null = null;
  private clientId: string;
  private tenantId: string;

  constructor(config: InteractiveAuthConfig) {
    this.clientId = config.clientId;
    this.tenantId = config.tenantId || 'common';
    
    const authOptions: any = { clientId: config.clientId };
    if (config.tenantId) authOptions.tenantId = config.tenantId;
    
    this.deviceAuth = new DeviceFlowAuth(authOptions);
    
    // Load any pending device auth from previous session
    this.loadPendingDeviceAuth();
  }

  /**
   * Execute a tool function with automatic authentication handling
   */
  async executeWithAuth<T>(
    toolName: string,
    toolFunction: () => Promise<T>
  ): Promise<CallToolResult> {
    try {
      // First, check if there's a pending device authentication to complete
      if (this.pendingDeviceAuth && Date.now() < this.pendingDeviceAuth.expiresAt) {
        console.error(`Checking for pending device authentication completion... Code: ${this.pendingDeviceAuth.userCode}`);
        const completed = await this.checkDeviceAuthCompletion();
        if (completed) {
          console.error("Device authentication completed! Using stored tokens.");
          this.pendingDeviceAuth = null;
        } else {
          console.error("Device authentication still pending...");
        }
      } else if (this.pendingDeviceAuth) {
        console.error("Previous device authentication expired, clearing state.");
        this.clearPendingDeviceAuth();
      }
      
      // Check if we already have valid tokens
      const existingToken = await this.deviceAuth.getValidAccessToken();
      
      if (existingToken) {
        // We have valid authentication, execute the tool
        const result = await toolFunction();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } else {
        // No valid authentication - start device flow
        return await this.handleAuthenticationFlow(toolName);
      }
    } catch (error: any) {
      // Check if it's an authentication error
      if (this.isAuthError(error)) {
        return await this.handleAuthenticationFlow(toolName);
      }
      
      // Other error - return as failure
      return {
        content: [
          {
            type: "text",
            text: `❌ Error executing ${toolName}: ${error.message || error}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Handle the device authentication flow
   */
  private async handleAuthenticationFlow(toolName: string): Promise<CallToolResult> {
    if (this.isAuthenticating && this.pendingAuthentication) {
      // Authentication already in progress, wait for it
      try {
        const result = await this.pendingAuthentication;
        if (result) {
          return {
            content: [
              {
                type: "text",
                text: `✅ Authentication completed! Please try your '${toolName}' request again.`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `❌ Authentication failed. Please try again or check your Azure app configuration.`
              }
            ],
            isError: true
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Authentication failed: ${error instanceof Error ? error.message : error}. Please try again.`
            }
          ],
          isError: true
        };
      }
    }

    // Start new authentication flow
    this.isAuthenticating = true;
    
    // Start background authentication (errors are handled inside performDeviceFlow)
    this.pendingAuthentication = this.performDeviceFlow();

    try {
      const deviceCode = await this.deviceAuth.startDeviceFlow();
      
      // Store pending device authentication for future requests to check
      this.pendingDeviceAuth = {
        deviceCode: deviceCode.device_code,
        userCode: deviceCode.user_code,
        verificationUri: deviceCode.verification_uri,
        interval: deviceCode.interval,
        expiresAt: Date.now() + (deviceCode.expires_in * 1000)
      };
      
      // Save state to file so it persists across requests
      this.savePendingDeviceAuth();
      
      // Return immediate response with device code instructions
      return {
        content: [
          {
            type: "text",
            text: this.formatAuthenticationInstructions(deviceCode, toolName)
          }
        ]
      };
    } catch (error) {
      this.isAuthenticating = false;
      this.pendingAuthentication = null;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Authentication error in handleAuthenticationFlow: ${errorMessage}`);
      console.error(`Full error details:`, error);
      
      // Check for tenant configuration issues
      if (errorMessage.includes('AADSTS50059') || errorMessage.includes('tenant-identifying information')) {
        return {
          content: [
            {
              type: "text", 
              text: `🔧 **Microsoft 365 Authentication Setup Required**

I can help you access your Microsoft 365 emails and calendar, but first we need to configure the Azure app registration properly.

**The Issue:** Your Azure app registration needs tenant configuration for the device code authentication flow.

**Quick Fix Steps:**

1. **Open Azure Portal**: Go to [portal.azure.com](https://portal.azure.com)
2. **Navigate to**: Azure Active Directory → App registrations  
3. **Find your app**: Look for Client ID ${process.env['OAUTH2_CLIENT_ID']?.substring(0, 8)}...
4. **Click Authentication** in the left sidebar
5. **Update account types**: Select "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
6. **Save** the changes
7. **Wait 5-10 minutes** for Azure to propagate changes
8. **Try your request again**

**Alternative Solution:** If you prefer single-tenant, add your specific tenant ID to the MCP server configuration.

**After fixing**: You'll see a device code prompt with a link and code to complete authentication.

**Technical Details:** ${errorMessage}`
            }
          ]
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to start authentication: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  }

  /**
   * Perform the complete device flow authentication
   */
  private async performDeviceFlow(): Promise<string | null> {
    try {
      console.error("Starting device flow authentication...");
      const deviceCode = await this.deviceAuth.startDeviceFlow();
      console.error(`Device code generated: ${deviceCode.user_code}`);
      
      // Poll for completion in background
      console.error("Starting token polling...");
      const tokens = await this.deviceAuth.pollForToken(
        deviceCode.device_code,
        deviceCode.interval,
        deviceCode.expires_in
      );
      
      console.error("Tokens received, attempting to store...");
      // Store tokens
      await this.deviceAuth.storeTokens(tokens);
      console.error("Tokens stored successfully!");
      
      return tokens.access_token;
    } catch (error) {
      // Log error but don't crash the server
      console.error("Device flow authentication failed:", error instanceof Error ? error.message : error);
      console.error("Full error:", error);
      return null; // Return null instead of throwing to prevent server crashes
    } finally {
      console.error("Cleaning up device flow state...");
      this.isAuthenticating = false;
      this.pendingAuthentication = null;
    }
  }

  /**
   * Get path for storing pending device auth state
   */
  private get pendingDeviceAuthPath(): string {
    const os = require('os');
    const path = require('path');
    const configDir = path.join(os.homedir(), '.mcp-graph-auth');
    return path.join(configDir, 'pending-device-auth.json');
  }

  /**
   * Save pending device auth state to file
   */
  private savePendingDeviceAuth(): void {
    if (!this.pendingDeviceAuth) return;
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      const dir = path.dirname(this.pendingDeviceAuthPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const storedAuth: StoredDeviceAuth = {
        ...this.pendingDeviceAuth,
        clientId: this.clientId,
        tenantId: this.tenantId
      };
      
      fs.writeFileSync(this.pendingDeviceAuthPath, JSON.stringify(storedAuth), 'utf8');
      console.error(`Saved pending device auth state to: ${this.pendingDeviceAuthPath}`);
    } catch (error) {
      console.error('Failed to save pending device auth state:', error);
    }
  }

  /**
   * Load pending device auth state from file
   */
  private loadPendingDeviceAuth(): void {
    try {
      const fs = require('fs');
      
      if (!fs.existsSync(this.pendingDeviceAuthPath)) {
        return;
      }
      
      const data = fs.readFileSync(this.pendingDeviceAuthPath, 'utf8');
      const storedAuth: StoredDeviceAuth = JSON.parse(data);
      
      // Only load if it's for the same client/tenant and not expired
      if (storedAuth.clientId === this.clientId && 
          storedAuth.tenantId === this.tenantId && 
          Date.now() < storedAuth.expiresAt) {
        
        this.pendingDeviceAuth = {
          deviceCode: storedAuth.deviceCode,
          userCode: storedAuth.userCode,
          verificationUri: storedAuth.verificationUri,
          interval: storedAuth.interval,
          expiresAt: storedAuth.expiresAt
        };
        
        console.error(`Loaded pending device auth state: ${storedAuth.userCode}`);
      } else {
        // Clean up expired/invalid state
        fs.unlinkSync(this.pendingDeviceAuthPath);
        console.error('Cleared expired pending device auth state');
      }
    } catch (error) {
      console.error('Failed to load pending device auth state:', error);
    }
  }

  /**
   * Clear pending device auth state
   */
  private clearPendingDeviceAuth(): void {
    try {
      const fs = require('fs');
      if (fs.existsSync(this.pendingDeviceAuthPath)) {
        fs.unlinkSync(this.pendingDeviceAuthPath);
        console.error('Cleared pending device auth state file');
      }
    } catch (error) {
      console.error('Failed to clear pending device auth state:', error);
    }
    this.pendingDeviceAuth = null;
  }

  /**
   * Check if pending device authentication has been completed
   */
  private async checkDeviceAuthCompletion(): Promise<boolean> {
    if (!this.pendingDeviceAuth) {
      return false;
    }

    try {
      // Try to get tokens without waiting (single poll attempt)
      const response = await fetch(`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          client_id: this.clientId,
          device_code: this.pendingDeviceAuth.deviceCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Authentication completed! Store tokens
        console.error("Device authentication completed, storing tokens...");
        await this.deviceAuth.storeTokens(data);
        this.clearPendingDeviceAuth();
        return true;
      } else if (data.error === 'authorization_pending') {
        // Still waiting for user authentication
        return false;
      } else {
        // Some other error, clear pending auth
        console.error("Device authentication failed:", data.error);
        this.clearPendingDeviceAuth();
        return false;
      }
    } catch (error) {
      console.error("Error checking device authentication:", error);
      return false;
    }
  }

  /**
   * Format authentication instructions for the user
   */
  private formatAuthenticationInstructions(deviceCode: DeviceCodeResponse, toolName: string): string {
    return `🔐 **Microsoft Graph Authentication Required**

To use '${toolName}' and access your Microsoft 365 data, please authenticate:

**Step 1: Open Browser**
📱 Go to: **${deviceCode.verification_uri}**

**Step 2: Enter Code**  
🔑 Enter this code: **${deviceCode.user_code}**

**Step 3: Sign In**
✅ Sign in with your Microsoft 365 account
✅ Grant the requested permissions

**Step 4: Return Here**
🔄 Come back and try your request again: "${toolName}"

⏱️ Code expires in ${Math.floor(deviceCode.expires_in / 60)} minutes

**Need Help?**
If you see authentication errors, check that your Azure app is configured for multi-tenant access in the Azure Portal.

Your authentication will be stored securely for future requests.`;
  }

  /**
   * Check if error is authentication-related
   */
  private isAuthError(error: any): boolean {
    return (
      error?.status === 401 ||
      error?.statusCode === 401 ||
      error?.code === "UNAUTHORIZED" ||
      (typeof error?.message === "string" && 
       error.message.toLowerCase().includes("unauthorized")) ||
      (typeof error?.message === "string" && 
       error.message.toLowerCase().includes("authentication"))
    );
  }

  /**
   * Check if authentication is available
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.deviceAuth.getValidAccessToken();
      return token !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear authentication (logout)
   */
  clearAuthentication(): void {
    this.deviceAuth.clearTokens();
    this.isAuthenticating = false;
    this.pendingAuthentication = null;
  }

  /**
   * Get valid access token if available
   */
  async getValidToken(): Promise<string | null> {
    try {
      return await this.deviceAuth.getValidAccessToken();
    } catch {
      return null;
    }
  }
}