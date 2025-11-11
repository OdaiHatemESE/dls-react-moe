# Azure DevOps Setup Guide - Quick Start

## Step 1: Upload .env Files to Azure DevOps Secure Files

Since `.env.test` and `.env.production` contain secrets, they should NOT be committed to your repository. Instead, you'll store them securely in Azure DevOps Library.

1. **Go to Azure DevOps** → Your Project
2. **Click "Pipelines"** → **"Library"** → **"Secure files"** tab
3. **Click "+ Secure file"**
4. **Upload `.env.test`**:
   - Browse and select your local `.env.test` file
   - Click "OK"
   - After upload, click on the file name
   - Check "Authorize for use in all pipelines" (or select specific pipelines)
   - Click "Save"

5. **Upload `.env.production`** (for future production pipeline):
   - Same process as above
   - This will be used when you create a production pipeline later

**That's it!** The pipeline will automatically download and use these files during build and deployment.

---

## Step 2: Create Azure DevOps Environments

1. **Go to "Pipelines"** → **"Environments"**
2. **Click "New environment"**
3. **Create Environment 1:**
   - Name: `Staging-Server-1`
   - Resource: Click "Add resource" → "Virtual machines"
   - Select: Windows
   - **Copy the registration script shown**

4. **On Windows Server 1**, open PowerShell as Administrator and run:
   ```powershell
   # The script copied from Azure DevOps - it will look like:
   mkdir C:\azagent ; cd C:\azagent
   Invoke-WebRequest -Uri https://vstsagentpackage.azureedge.net/agent/...
   # ... rest of the script
   ```

5. **Repeat for Server 2:**
   - Create environment: `Staging-Server-2`
   - Register the agent on Windows Server 2

---

## Step 3: Create the Pipeline in Azure DevOps

1. **Go to "Pipelines"** → **"Pipelines"**
2. **Click "New pipeline"**
3. **Select your repository source:**
   - Azure Repos Git
   - GitHub
   - Bitbucket
   - (wherever your code is)

4. **Choose "Existing Azure Pipelines YAML file"**
5. **Select:**
   - Branch: `staging-release`
   - Path: `/azure-pipelines-staging.yml`

6. **Click "Continue"**
7. **Click "Run"** to test it (or "Save" to save without running)

---

## Step 4: Prerequisites on Windows Servers

Run these commands on **BOTH Windows servers** as Administrator:

### Install Node.js
```powershell
# Download and install Node.js 20.x LTS
# Visit: https://nodejs.org/
# Or use winget:
winget install OpenJS.NodeJS.LTS
```

### Install IIS
```powershell
# Enable IIS with required features
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
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

### Install iisnode
```powershell
# Download iisnode from: https://github.com/azure/iisnode/releases
# Example (adjust version as needed):
$iisNodeUrl = "https://github.com/Azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi"
Invoke-WebRequest -Uri $iisNodeUrl -OutFile "iisnode.msi"
Start-Process msiexec.exe -Wait -ArgumentList '/i iisnode.msi /quiet'
```

### Install URL Rewrite Module
```powershell
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite
$urlRewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
Invoke-WebRequest -Uri $urlRewriteUrl -OutFile "urlrewrite.msi"
Start-Process msiexec.exe -Wait -ArgumentList '/i urlrewrite.msi /quiet'
```

### Create Deployment Directory
```powershell
# Create the directory
New-Item -Path "C:\inetpub\wwwroot\PPApp" -ItemType Directory -Force

# Set permissions
icacls "C:\inetpub\wwwroot\PPApp" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\PPApp" /grant "IUSR:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\PPApp" /grant "Everyone:(OI)(CI)F" /T
```

### Create IIS Application Pool and Site
```powershell
Import-Module WebAdministration

# Create app pool
New-WebAppPool -Name "PPApp"
Set-ItemProperty IIS:\AppPools\PPApp -name "managedRuntimeVersion" -value ""
Set-ItemProperty IIS:\AppPools\PPApp -name "enable32BitAppOnWin64" -value $false

# Create website or application under Default Web Site
# Option 1: As a separate website
New-Website -Name "PPApp" -Port 80 -PhysicalPath "C:\inetpub\wwwroot\PPApp" -ApplicationPool "PPApp"

# Option 2: As an application under Default Web Site (recommended)
# New-WebApplication -Name "PPApp" -Site "Default Web Site" -PhysicalPath "C:\inetpub\wwwroot\PPApp" -ApplicationPool "PPApp"
```

### Restart IIS
```powershell
iisreset
```

---

## Step 5: Test the Pipeline

1. **Commit and push to `staging-release` branch:**
   ```bash
   git add .
   git commit -m "Add Azure DevOps pipeline for staging"
   git push origin staging-release
   ```

2. **Go to Azure DevOps** → **"Pipelines"**
3. **Watch the pipeline run**
4. **Check each stage:**
   - Build
   - Deploy to Server 1
   - Deploy to Server 2

---

## Step 6: Verify Deployment on Servers

On each server, check:

```powershell
# Check PM2 status
pm2 list

# Check PM2 logs
pm2 logs PPApp-staging

# Check if app is running
curl http://localhost:4200

# Check IIS status
Import-Module WebAdministration
Get-WebAppPoolState -Name "PPApp"

# View recent logs
Get-Content "C:\inetpub\wwwroot\PPApp\logs\pm2-out.log" -Tail 50
```

---

## Common Issues & Solutions

### Issue: Pipeline can't find .env.test
**Solution**: Make sure you uploaded the secure file or created the variable group correctly.

### Issue: PM2 command not found
**Solution**: Install PM2 globally on the server:
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### Issue: IIS shows 500 error
**Solution**: Check logs:
```powershell
Get-Content "C:\inetpub\wwwroot\PPApp\iisnode\*.log" -Tail 100
```

### Issue: Port 4200 already in use
**Solution**: Stop other processes or change the port in `ecosystem.config.js`

### Issue: Database connection fails
**Solution**: Check DATABASE_URL in environment variables and verify network access from servers to database.

---

## Next Steps

1. ✅ Set up SSL certificate in IIS for HTTPS
2. ✅ Configure load balancer (if using one for the two servers)
3. ✅ Set up monitoring and alerts
4. ✅ Create production pipeline (similar to staging but uses `.env.production`)
5. ✅ Set up automated backups

---

## Summary: What Gets Uploaded to Azure DevOps

Just upload these two files to **Secure Files**:
- ✅ `.env.test` (for staging deployments)
- ✅ `.env.production` (for production deployments - future use)

The pipeline automatically downloads and uses them during build and deployment. No need to manually configure individual variables!
