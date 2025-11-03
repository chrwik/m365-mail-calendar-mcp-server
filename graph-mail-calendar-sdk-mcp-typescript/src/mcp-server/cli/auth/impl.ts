/*
 * Authentication command implementation
 */

import { DeviceFlowAuth } from "../../auth/device-flow.js";
import { LocalContext } from "../../cli.js";

interface AuthCommandFlags {
  readonly "client-id": string;
  readonly "tenant-id"?: string;
  readonly logout: boolean;
  readonly status: boolean;
}

export async function main(this: LocalContext, flags: AuthCommandFlags) {
  const auth = new DeviceFlowAuth({
    clientId: flags["client-id"],
    ...(flags["tenant-id"] && { tenantId: flags["tenant-id"] }),
  });

  if (flags.logout) {
    auth.clearTokens();
    console.log("✅ Logged out successfully. Authentication tokens cleared.");
    return;
  }

  if (flags.status) {
    const isAuthenticated = auth.isAuthenticated();
    if (isAuthenticated) {
      console.log("✅ Authenticated - Valid tokens found");
      
      // Try to get a valid access token to verify it works
      const token = await auth.getValidAccessToken();
      if (token) {
        console.log("🔄 Token is valid and ready to use");
      } else {
        console.log("⚠️  Token needs refresh or re-authentication required");
      }
    } else {
      console.log("❌ Not authenticated - Run 'mcp auth --client-id YOUR_CLIENT_ID' to authenticate");
    }
    return;
  }

  // Check if already authenticated
  if (auth.isAuthenticated()) {
    const token = await auth.getValidAccessToken();
    if (token) {
      console.log("✅ Already authenticated with valid tokens!");
      console.log("💡 Use --logout to clear tokens or --status to check status");
      return;
    }
  }

  try {
    // Start device flow authentication
    await auth.authenticate();
  } catch (error) {
    console.error("❌ Authentication failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}