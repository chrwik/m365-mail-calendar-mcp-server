/*
 * Authentication CLI command implementation
 */

import { buildCommand } from "@stricli/core";
import * as z from "zod";

export const authCommand = buildCommand({
  loader: async () => {
    const { main } = await import("./impl.js");
    return main;
  },
  parameters: {
    flags: {
      "client-id": {
        kind: "parsed",
        brief: "Azure AD application (client) ID",
        optional: false,
        parse: (value: string) => z.string().min(1).parse(value),
      },
      "tenant-id": {
        kind: "parsed", 
        brief: "Azure AD tenant ID (optional, defaults to 'common')",
        optional: true,
        parse: (value: string) => z.string().min(1).parse(value),
      },
      logout: {
        kind: "boolean",
        brief: "Clear stored authentication tokens",
        default: false,
      },
      status: {
        kind: "boolean", 
        brief: "Check current authentication status",
        default: false,
      },
    },
  },
  docs: {
    brief: "Authenticate with Microsoft Graph using device code flow",
    fullDescription: `
This command initiates the Microsoft Graph device code authentication flow.
You'll be prompted to visit a URL and enter a code to complete authentication.
Tokens are stored securely and will be automatically refreshed when needed.

Examples:
  mcp auth --client-id YOUR_CLIENT_ID
  mcp auth --client-id YOUR_CLIENT_ID --tenant-id YOUR_TENANT_ID  
  mcp auth --logout
  mcp auth --status
    `.trim(),
  },
});