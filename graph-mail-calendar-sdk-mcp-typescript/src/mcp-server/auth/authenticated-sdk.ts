/*
 * Authentication wrapper for SDK function calls with automatic token refresh
 */

import { GraphMailCalendarSDKCore } from "../../core.js";
import { DeviceFlowAuth } from "./device-flow.js";

export interface AuthenticatedSDKOptions {
  clientId?: string;
  tenantId?: string;
  initialToken?: string;
}

export class AuthenticatedSDKWrapper {
  private deviceAuth?: DeviceFlowAuth;
  private currentToken: string | undefined;

  constructor(options?: AuthenticatedSDKOptions) {
    this.currentToken = options?.initialToken;
    
    // Initialize device auth if we have a client ID
    const clientId = options?.clientId || 
      process.env["OAUTH2_CLIENT_ID"] || 
      process.env["GRAPH_CLIENT_ID"];
      
    if (clientId) {
      const tenantId = options?.tenantId || process.env["OAUTH2_TENANT_ID"];
      const authOptions: any = { clientId };
      if (tenantId) authOptions.tenantId = tenantId;
      
      this.deviceAuth = new DeviceFlowAuth(authOptions);
    }
  }

  /**
   * Get a fresh SDK instance with current valid token
   */
  async getSDK(): Promise<GraphMailCalendarSDKCore> {
    const token = await this.getValidToken();
    return new GraphMailCalendarSDKCore({
      security: { oauth2: token },
    });
  }

  /**
   * Execute a function with automatic token refresh on 401 errors
   */
  async withTokenRefresh<T>(
    sdkFunction: (sdk: GraphMailCalendarSDKCore) => Promise<T>
  ): Promise<T> {
    try {
      const sdk = await this.getSDK();
      return await sdkFunction(sdk);
    } catch (error: any) {
      // If we get a 401 and can refresh tokens, try once more
      if (this.isAuthError(error) && this.deviceAuth) {
        console.log("🔄 Access token expired, attempting refresh...");
        
        try {
          // Force refresh the token
          await this.refreshToken();
          const sdk = await this.getSDK();
          console.log("✅ Token refreshed, retrying request...");
          return await sdkFunction(sdk);
        } catch (refreshError) {
          console.warn("❌ Token refresh failed:", refreshError);
          throw new Error(`
Authentication expired and refresh failed.

Please re-authenticate by running:
mcp auth --client-id YOUR_CLIENT_ID

Original error: ${error.message || error}
          `.trim());
        }
      }
      
      throw error;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getValidToken(): Promise<string> {
    // Use cached token if available
    if (this.currentToken) {
      return this.currentToken;
    }

    // Try to get token from device auth
    if (this.deviceAuth) {
      const token = await this.deviceAuth.getValidAccessToken();
      if (token) {
        this.currentToken = token;
        return token;
      }
    }

    throw new Error(`
No valid authentication found.

Please authenticate by running:
mcp auth --client-id YOUR_CLIENT_ID
    `.trim());
  }

  /**
   * Force refresh the current token
   */
  private async refreshToken(): Promise<void> {
    if (!this.deviceAuth) {
      throw new Error("No device authentication configured");
    }

    // Clear current token to force refresh
    this.currentToken = undefined;
    const newToken = await this.deviceAuth.getValidAccessToken();
    
    if (!newToken) {
      throw new Error("Failed to refresh token");
    }
    
    this.currentToken = newToken;
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
       error.message.toLowerCase().includes("unauthorized"))
    );
  }

  /**
   * Clear cached token (useful for logout)
   */
  public clearToken(): void {
    this.currentToken = undefined;
    if (this.deviceAuth) {
      this.deviceAuth.clearTokens();
    }
  }
}