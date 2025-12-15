# Azure DevOps Staging Deployment Setup Guide

This guide walks you through setting up the staging deployment pipeline for deploying to two Windows IIS servers.

## Prerequisites

### On Both Windows Servers:
1. **IIS (Internet Information Services)** must be installed
2. **Node.js 20.x** installed at `C:\Program Files\nodejs\`
3. **iisnode** module installed ([Download here](https://github.com/azure/iisnode/releases))
4. **URL Rewrite Module** for IIS ([Download here](https://www.iis.net/downloads/microsoft/url-rewrite))
5. **Azure Pipelines Agent** installed and running ([Installation guide](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/windows-agent))

### In Azure DevOps:
1. Access to your Azure DevOps project
2. Permissions to create pipelines and environments

## Step 1: Install Prerequisites on Windows Servers

### Install IIS Features
```powershell
# Run in PowerShell as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
Enable-WindowsOptionalFeature -Online -FeatureName IIS-NetFxExtensibility45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HealthAndDiagnostics
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Security
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-Performance
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerManagementTools
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole
```

### Install Node.js
1. Download Node.js 20.x LTS from https://nodejs.org/
2. Install to default location `C:\Program Files\nodejs\`
3. Verify: `node --version` and `npm --version`

### Install iisnode
1. Download from https://github.com/azure/iisnode/releases
2. Run the installer (choose the appropriate version for your architecture)
3. Restart IIS: `iisreset`

### Install URL Rewrite Module
1. Download from https://www.iis.net/downloads/microsoft/url-rewrite
2. Run the installer
3. Restart IIS

### Create Application Directory
```powershell
# Create the deployment directory
New-Item -Path "C:\inetpub\wwwroot\PPApp" -ItemType Directory -Force

# Grant permissions (adjust the user as needed for your pipeline agent)
icacls "C:\inetpub\wwwroot\PPApp" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\PPApp" /grant "IUSR:(OI)(CI)F" /T
```

### Create IIS Application Pool
```powershell
Import-Module WebAdministration

# Create app pool
New-WebAppPool -Name "PPApp"

# Configure app pool
Set-ItemProperty IIS:\AppPools\PPApp -name "managedRuntimeVersion" -value ""
Set-ItemProperty IIS:\AppPools\PPApp -name "enable32BitAppOnWin64" -value $false

# Create IIS website or application
New-WebApplication -Name "PPApp" -Site "Default Web Site" -PhysicalPath "C:\inetpub\wwwroot\PPApp" -ApplicationPool "PPApp"
```

## Step 2: Set Up Azure DevOps Environments

1. Navigate to your Azure DevOps project
2. Go to **Pipelines** > **Environments**
3. Create two environments:
   - **Staging-Server-1**
   - **Staging-Server-2**

### Add Resources to Environments

For each environment:
1. Click **Add resource** > **Virtual machines**
2. Choose **Windows** as the OS
3. Copy the registration script
4. Run the script on the corresponding Windows server (as Administrator)
5. Tag the resource (optional but recommended): `staging`, `windows`, `iis`

## Step 3: Configure Pipeline Variables (Optional)

In Azure DevOps, you can override variables:

1. Go to **Pipelines** > Select your pipeline
2. Click **Edit** > **Variables**
3. Add any environment-specific variables:
   - `NODE_VERSION`: Node.js version (default: 20.x)
   - `IIS_DEPLOY_PATH`: Deployment path (default: C:\inetpub\wwwroot\PPApp)

## Step 4: Set Up Environment Variables on Servers

Create a `.env.production` file or configure environment variables in IIS:

### Option A: Using web.config (Recommended for IIS)

The pipeline automatically creates a basic `web.config`. To add environment variables:

```xml
<configuration>
  <system.webServer>
    <!-- existing config -->
    <iisnode>
      <environmentVariables>
        <add key="NEXTAUTH_URL" value="https://your-staging-url.com" />
        <add key="NEXTAUTH_SECRET" value="your-secret-here" />
        <add key="DATABASE_URL" value="sqlserver://..." />
        <!-- Add other env vars -->
      </environmentVariables>
    </iisnode>
  </system.webServer>
</configuration>
```

### Option B: Using Azure DevOps Library

1. Go to **Pipelines** > **Library**
2. Create a variable group named `Staging-Environment`
3. Add your secrets and configuration
4. Link the variable group to the pipeline

## Step 5: Create the Pipeline in Azure DevOps

1. Go to **Pipelines** > **Pipelines**
2. Click **New Pipeline**
3. Select your repository source (GitHub, Azure Repos, etc.)
4. Choose **Existing Azure Pipelines YAML file**
5. Select the branch and path: `/azure-pipelines-staging.yml`
6. Click **Continue** then **Run**

## Step 6: Configure Branch Policy (Optional)

To automatically trigger the pipeline on push to `staging-release`:

1. The pipeline already has a trigger configured for `staging-release` branch
2. Every push to this branch will automatically start the deployment

## Step 7: Test the Deployment

1. Push to `staging-release` branch:
   ```bash
   git checkout staging-release
   git merge your-feature-branch
   git push origin staging-release
   ```

2. Monitor the pipeline in Azure DevOps
3. Check both servers at `http://server-ip/PPApp` or your configured URL

## Monitoring and Troubleshooting

### View IIS Logs
```powershell
# Application logs
Get-Content "C:\inetpub\wwwroot\PPApp\iisnode\*.log" -Tail 50

# IIS logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50
```

### Check Application Pool Status
```powershell
Import-Module WebAdministration
Get-WebAppPoolState -Name "PPApp"
```

### Restart Application
```powershell
Import-Module WebAdministration
Restart-WebAppPool -Name "PPApp"
```

### Common Issues

**Issue: iisnode module not loading**
- Solution: Verify iisnode is installed, restart IIS with `iisreset`

**Issue: 500 errors**
- Check iisnode logs in `C:\inetpub\wwwroot\PPApp\iisnode\`
- Verify Node.js path in web.config
- Check environment variables

**Issue: Static files not loading**
- Verify URL Rewrite module is installed
- Check web.config rewrite rules

**Issue: Database connection errors**
- Verify DATABASE_URL in environment variables
- Check network connectivity from servers to database

## Security Considerations

1. **Environment Variables**: Store secrets in Azure DevOps Library or Key Vault, not in code
2. **File Permissions**: Ensure proper ACLs on deployment directory
3. **SSL/TLS**: Configure HTTPS bindings in IIS for production use
4. **Firewall**: Configure Windows Firewall rules as needed
5. **App Pool Identity**: Consider using a specific service account for the app pool

## Rollback Procedure

Each deployment creates a backup:

```powershell
# List backups
Get-ChildItem "C:\inetpub\wwwroot" -Filter "PPApp_backup_*"

# Rollback to a specific backup
Stop-WebAppPool -Name "PPApp"
Remove-Item "C:\inetpub\wwwroot\PPApp" -Recurse -Force
Rename-Item "C:\inetpub\wwwroot\PPApp_backup_[BuildId]" "C:\inetpub\wwwroot\PPApp"
Start-WebAppPool -Name "PPApp"
```

## Next Steps

1. Configure SSL certificates in IIS
2. Set up monitoring and alerts
3. Configure load balancer (if using one for the two servers)
4. Set up automated health checks
5. Configure log aggregation

## Support

For issues with:
- **Azure DevOps Pipeline**: Check the pipeline logs in Azure DevOps
- **IIS Configuration**: Review IIS logs and iisnode logs
- **Application Errors**: Check Next.js logs and browser console
