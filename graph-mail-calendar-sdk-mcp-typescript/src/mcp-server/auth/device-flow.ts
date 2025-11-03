/*
 * Device Code Flow Authentication for Microsoft Graph
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import os from "os";

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope: string;
}

export class DeviceFlowAuth {
  private readonly clientId: string;
  private readonly tenantId: string;
  private readonly scopes: string[];
  private readonly tokenFilePath: string;

  constructor(options: {
    clientId: string;
    tenantId?: string;
    scopes?: string[];
    tokenStorePath?: string;
  }) {
    this.clientId = options.clientId;
    // Use specific tenant ID if provided, otherwise fallback to common
    // For multi-tenant apps, sometimes 'common' works better than 'organizations'
    this.tenantId = options.tenantId || "common";
    this.scopes = options.scopes || [
      "User.Read",
      "Mail.Read",
      "Mail.ReadWrite", 
      "Mail.Send",
      "Calendars.Read",
      "Calendars.ReadWrite",
    ];
    
    const configDir = options.tokenStorePath || path.join(os.homedir(), ".mcp-graph-auth");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    this.tokenFilePath = path.join(configDir, "tokens.enc");
  }

  /**
   * Initiate device code flow authentication
   */
  async startDeviceFlow(): Promise<DeviceCodeResponse> {
    const deviceCodeUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/devicecode`;
    
    const body = new URLSearchParams({
      client_id: this.clientId,
      scope: this.scopes.join(" "),
    });

    const response = await fetch(deviceCodeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Device code request failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Poll for device code completion and exchange for tokens
   */
  async pollForToken(deviceCode: string, interval: number, expiresIn: number): Promise<TokenResponse> {
    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const endTime = Date.now() + (expiresIn * 1000);

    while (Date.now() < endTime) {
      await new Promise(resolve => setTimeout(resolve, interval * 1000));

      const body = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        client_id: this.clientId,
        device_code: deviceCode,
      });

      try {
        const response = await fetch(tokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        const result = await response.json();

        if (response.ok) {
          console.error(`Token received successfully for device code: ${deviceCode.substring(0, 4)}...`);
          return result as TokenResponse;
        }

        // Handle specific error codes
        if (result.error === "authorization_pending") {
          continue; // Keep polling
        } else if (result.error === "slow_down") {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        } else {
          throw new Error(`Token request failed: ${result.error} - ${result.error_description}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("Token request failed")) {
          throw error;
        }
        console.warn("Polling error, retrying:", error);
      }
    }

    throw new Error("Device code expired");
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.clientId,
      refresh_token: refreshToken,
      scope: this.scopes.join(" "),
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Store tokens securely on disk
   */
  async storeTokens(tokens: TokenResponse): Promise<void> {
    try {
      console.error(`Storing tokens to: ${this.tokenFilePath}`);
      
      const storedTokens: StoredTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000),
        scope: tokens.scope,
      };

      const data = JSON.stringify(storedTokens);
      const key = crypto.scryptSync(this.clientId, "salt", 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      
      let encrypted = cipher.update(data, "utf8", "hex");
      encrypted += cipher.final("hex");
      
      const encryptedData = iv.toString("hex") + ":" + encrypted;
      
      // Ensure directory exists
      const dir = path.dirname(this.tokenFilePath);
      if (!fs.existsSync(dir)) {
        console.error(`Creating token directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.tokenFilePath, encryptedData, { mode: 0o600 });
      console.error(`Tokens stored successfully to: ${this.tokenFilePath}`);
    } catch (error) {
      console.error(`Failed to store tokens: ${error}`);
      throw error;
    }
  }

  /**
   * Load stored tokens from disk
   */
  loadTokens(): StoredTokens | null {
    try {
      console.error(`Checking if token file exists: ${this.tokenFilePath}`);
      if (!fs.existsSync(this.tokenFilePath)) {
        console.error(`Token file does not exist: ${this.tokenFilePath}`);
        return null;
      }

      const encryptedData = fs.readFileSync(this.tokenFilePath, "utf8");
      const [ivHex, encrypted] = encryptedData.split(":");
      
      if (!ivHex || !encrypted) {
        return null;
      }
      
      const key = crypto.scryptSync(this.clientId, "salt", 32);
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      
      return JSON.parse(decrypted) as StoredTokens;
    } catch (error) {
      console.warn("Failed to load stored tokens:", error);
      return null;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    console.error(`Checking for valid access token at: ${this.tokenFilePath}`);
    const storedTokens = this.loadTokens();
    
    if (!storedTokens) {
      console.error(`No stored tokens found`);
      return null;
    }

    // Check if token is still valid (with 5 minute buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    if (Date.now() < (storedTokens.expires_at - bufferTime)) {
      return storedTokens.access_token;
    }

    // Try to refresh the token
    try {
      const newTokens = await this.refreshToken(storedTokens.refresh_token);
      await this.storeTokens(newTokens);
      return newTokens.access_token;
    } catch (error) {
      console.warn("Token refresh failed:", error);
      return null;
    }
  }

  /**
   * Clear stored tokens (logout)
   */
  clearTokens(): void {
    if (fs.existsSync(this.tokenFilePath)) {
      fs.unlinkSync(this.tokenFilePath);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const tokens = this.loadTokens();
    return tokens !== null;
  }

  /**
   * Complete device flow authentication process
   */
  async authenticate(): Promise<string> {
    console.log("Starting Microsoft Graph authentication...\n");
    
    const deviceCode = await this.startDeviceFlow();
    
    console.log("🔐 Please complete authentication:");
    console.log(`1. Go to: ${deviceCode.verification_uri}`);
    console.log(`2. Enter code: ${deviceCode.user_code}`);
    console.log("\nWaiting for authentication to complete...");
    
    const tokens = await this.pollForToken(
      deviceCode.device_code,
      deviceCode.interval,
      deviceCode.expires_in
    );
    
    console.error(`About to store tokens...`);
    await this.storeTokens(tokens);
    console.error(`Tokens stored successfully!`);
    
    console.log("\n✅ Authentication successful! Tokens stored securely.");
    return tokens.access_token;
  }
}