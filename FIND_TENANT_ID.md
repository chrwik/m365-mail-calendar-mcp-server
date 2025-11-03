# Find Azure Tenant ID Script

## Method 1: Azure Portal (Most Reliable)
1. Go to https://portal.azure.com
2. Navigate to Azure Active Directory → Overview
3. Copy the "Directory (tenant) ID"

## Method 2: PowerShell with Azure CLI (if installed)
```powershell
# If you have Azure CLI installed:
az account show --query tenantId -o tsv
```

## Method 3: Microsoft Graph Explorer
1. Go to https://developer.microsoft.com/graph/graph-explorer
2. Sign in with your Microsoft 365 account
3. Run this query: GET https://graph.microsoft.com/v1.0/organization
4. The tenant ID will be in the response under "id"

## Method 4: PowerShell with Microsoft Graph PowerShell (if installed)
```powershell
# If you have Microsoft Graph PowerShell installed:
Connect-MgGraph
Get-MgOrganization | Select-Object Id, DisplayName
```

## Method 5: Check Your Email Domain
If your work email is something like `yourname@company.com`, you can often find the tenant ID by:
1. Going to https://login.microsoftonline.com/company.com/.well-known/openid_configuration
2. Look for the "issuer" field - the tenant ID is the GUID in that URL

## Once You Have Your Tenant ID

Replace `YOUR_TENANT_ID_HERE` in the Claude Desktop configuration with your actual tenant ID and restart Claude Desktop.

Your tenant ID will look like: `12345678-1234-1234-1234-123456789abc`