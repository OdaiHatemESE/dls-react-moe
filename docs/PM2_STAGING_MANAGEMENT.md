# PM2 Staging Server Management

## PM2 Configuration

The staging deployment uses a **global PM2 home directory**:
```
C:\ProgramData\pm2-ppapp-staging
```

This allows both the deployment pipeline and manual server administration to see the same PM2 processes.

## Managing PM2 on the Server

### Check Process Status

When you SSH into the server, you need to set the PM2_HOME environment variable first:

```powershell
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"
pm2 status
```

### Quick Command (All-in-One)

```powershell
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"; pm2 status
```

### View Logs

```powershell
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"
pm2 logs PPApp-st
```

### Restart Application

```powershell
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"
pm2 restart PPApp-st
```

### Stop Application

```powershell
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"
pm2 stop PPApp-st
```

### Start Application (if stopped)

```powershell
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"
cd C:\inetpub\wwwroot\SuperParent\Adeed
pm2 start ecosystem.config.js --env production
pm2 save
```

## Make PM2_HOME Permanent (Optional)

To avoid setting `$env:PM2_HOME` every time, you can set it as a **system environment variable**:

### Option A: PowerShell (Run as Administrator)

```powershell
[System.Environment]::SetEnvironmentVariable('PM2_HOME', 'C:\ProgramData\pm2-ppapp-staging', [System.EnvironmentVariableTarget]::Machine)
```

Then restart your PowerShell session or the server.

### Option B: GUI Method

1. Open System Properties → Advanced → Environment Variables
2. Under "System variables", click "New"
3. Variable name: `PM2_HOME`
4. Variable value: `C:\ProgramData\pm2-ppapp-staging`
5. Click OK and restart your PowerShell session

### Option C: Add to PowerShell Profile

Add this line to your PowerShell profile (`$PROFILE`):

```powershell
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"
```

## Troubleshooting

### PM2 Shows No Processes

**Cause**: PM2_HOME not set correctly

**Solution**:
```powershell
# Verify current PM2_HOME
$env:PM2_HOME

# If empty or wrong, set it:
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"
pm2 status
```

### Application Not Responding

**Check if process is running**:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
```

**Check PM2 status**:
```powershell
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"
pm2 status
pm2 logs PPApp-st --lines 50
```

**Restart if needed**:
```powershell
$env:PM2_HOME = "C:\ProgramData\pm2-ppapp-staging"
pm2 restart PPApp-st
```

### Permission Issues

If you get permission errors accessing `C:\ProgramData\pm2-ppapp-staging`:

```powershell
# Run as Administrator
icacls "C:\ProgramData\pm2-ppapp-staging" /grant "YourUsername:(OI)(CI)F" /T
```

## Next Deployment

The next time the pipeline runs, it will:
1. Use `C:\ProgramData\pm2-ppapp-staging` as PM2_HOME
2. All processes will be visible from that location
3. You can manage them with the commands above

## Related Files

- Pipeline: `azure-pipelines-staging.yml`
- PM2 Config: `ecosystem.config.js`
- Application Path: `C:\inetpub\wwwroot\SuperParent\Adeed`
