# Claude Desktop MCP Server Setup Script
# Run this from your M365_mail_calendar_mcp directory

Write-Host "🖥️ Claude Desktop MCP Server Setup Helper" -ForegroundColor Cyan
Write-Host ""

# Get current directory and batch path
$currentDir = Get-Location
$batchPath = Join-Path $currentDir "run-mcp-server.bat"

# Check if batch file exists
if (-not (Test-Path $batchPath)) {
    Write-Host "❌ Error: run-mcp-server.bat not found in current directory" -ForegroundColor Red
    Write-Host "Please run this script from the M365_mail_calendar_mcp folder" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📍 Current directory: $currentDir" -ForegroundColor Green
Write-Host "📁 Batch file path: $batchPath" -ForegroundColor Green
Write-Host ""

# Claude Desktop config location
$claudeConfigDir = "$env:APPDATA\Claude"
$claudeConfigPath = "$claudeConfigDir\claude_desktop_config.json"

Write-Host "📁 Claude Desktop config location: $claudeConfigPath" -ForegroundColor Yellow
Write-Host ""

# Check if Claude Desktop config directory exists
if (-not (Test-Path $claudeConfigDir)) {
    Write-Host "📂 Creating Claude Desktop config directory..." -ForegroundColor Blue
    New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
}

# Create the JSON configuration
$configObject = @{
    mcpServers = @{
        "microsoft-graph" = @{
            command = $batchPath.Replace('\', '\\')
            args = @("start")
            env = @{
                OAUTH2_CLIENT_ID = "YOUR_AZURE_APP_CLIENT_ID_HERE"
            }
        }
    }
}

$config = $configObject | ConvertTo-Json -Depth 4

Write-Host "📋 Generated Configuration:" -ForegroundColor Cyan
Write-Host $config -ForegroundColor White
Write-Host ""

# Check if config file already exists
if (Test-Path $claudeConfigPath) {
    Write-Host "⚠️  Claude Desktop config file already exists!" -ForegroundColor Yellow
    $choice = Read-Host "Do you want to backup and replace it? (y/N)"
    
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        # Backup existing config
        $backupPath = "$claudeConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $claudeConfigPath $backupPath
        Write-Host "✅ Backed up existing config to: $backupPath" -ForegroundColor Green
        
        # Write new config
        $config | Out-File -FilePath $claudeConfigPath -Encoding UTF8
        Write-Host "✅ New configuration written to Claude Desktop config" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Skipping config file creation. You'll need to manually merge the configuration." -ForegroundColor Blue
    }
} else {
    # Write new config file
    $config | Out-File -FilePath $claudeConfigPath -Encoding UTF8
    Write-Host "✅ Configuration written to Claude Desktop config" -ForegroundColor Green
}

# Check .env file
if (Test-Path ".env") {
    Write-Host "✅ Found .env file" -ForegroundColor Green
    $envContent = Get-Content ".env" | Select-String "OAUTH2_CLIENT_ID"
    if ($envContent) {
        Write-Host "✅ .env file contains OAUTH2_CLIENT_ID" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env file found but no OAUTH2_CLIENT_ID detected" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  No .env file found. Create one with: OAUTH2_CLIENT_ID=your-client-id" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔑 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Get your Azure App Client ID from: https://portal.azure.com" -ForegroundColor White
Write-Host "2. Replace 'YOUR_AZURE_APP_CLIENT_ID_HERE' in the config with your actual ID" -ForegroundColor White
Write-Host "3. Run authentication: .\run-mcp-server.bat auth" -ForegroundColor White
Write-Host "4. Restart Claude Desktop" -ForegroundColor White
Write-Host ""

# Offer to open config file
$openChoice = Read-Host "Would you like to open the Claude Desktop config file now? (y/N)"
if ($openChoice -eq 'y' -or $openChoice -eq 'Y') {
    if (Test-Path $claudeConfigPath) {
        Start-Process notepad.exe $claudeConfigPath
    } else {
        Write-Host "❌ Config file not found at $claudeConfigPath" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Setup complete! Don't forget to authenticate before using Claude Desktop." -ForegroundColor Green
Read-Host "Press Enter to exit"