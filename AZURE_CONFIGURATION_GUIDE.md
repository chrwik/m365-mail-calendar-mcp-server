# Azure App Registration Configuration Guide

## Problem: AADSTS50059 Error

You're seeing this error because the Azure app registration doesn't have proper tenant configuration for the device code flow.

```
AADSTS50059: No tenant-identifying information found in either the request or implied by any provided credentials.
```

## Solution Options

### Option 1: Configure Multi-Tenant Support (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find your app registration (the one with the client ID in your `.env` file)
4. Click on your app
5. Go to **Authentication** in the left sidebar
6. Under **Supported account types**, change from:
   - ❌ "Accounts in this organizational directory only (Single tenant)"
   - ✅ **"Accounts in any organizational directory (Any Azure AD directory - Multitenant)"**
7. Click **Save**

### Option 2: Specify Tenant ID in Configuration

If you want to keep single-tenant, you need to specify your tenant ID:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **Overview**
3. Copy your **Directory (tenant) ID**
4. Open your `.env` file and add:
   ```
   AZURE_TENANT_ID=your-tenant-id-here
   ```

Then update the device flow configuration to use the tenant-specific endpoint.

### Option 3: Use Personal Microsoft Accounts (If Needed)

If you want to support personal Microsoft accounts:

1. In your app registration → **Authentication**
2. Under **Supported account types**, select:
   - **"Accounts in any organizational directory and personal Microsoft accounts"**
3. Click **Save**

## Testing the Fix

After making changes:

1. Wait 5-10 minutes for Azure changes to propagate
2. Delete any stored tokens:
   ```powershell
   Remove-Item "$env:APPDATA\graph-mail-calendar-mcp\tokens.json" -ErrorAction SilentlyContinue
   ```
3. Test the authentication again in Claude Desktop

## Current Configuration Check

Your current app registration settings should show:
- **Client ID**: `{your-client-id}` (from `.env` file)
- **Supported account types**: Should be multitenant
- **Redirect URIs**: Not needed for device code flow
- **API permissions**: Microsoft Graph permissions should be granted

## Required Microsoft Graph Permissions

Make sure your app has these permissions:
- `Mail.Read`
- `Mail.Send`
- `Calendars.ReadWrite`
- `User.Read`

Grant admin consent for these permissions in the Azure Portal.