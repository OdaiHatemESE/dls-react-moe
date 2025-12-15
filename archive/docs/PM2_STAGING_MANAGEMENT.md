# PM2 Staging Server Management

## PM2 Configuration

The staging deployment uses the **service account's PM2 home directory**:
```
C:\Users\SVC-PARENTPORTAL\.pm2
```

To manage PM2 processes, you need to either:
1. Log in as the `SVC-PARENTPORTAL` user, OR
2. Set the PM2_HOME environment variable to point to this location

## Managing PM2 on the Server

### Option A: Run as Service Account

If you have access to run commands as `SVC-PARENTPORTAL`:

```powershell
pm2 status
pm2 logs PPApp-st
pm2 restart PPApp-st
```

### Option B: Set PM2_HOME Variable

If logged in as a different user, set the PM2_HOME to the service account's directory:

```powershell
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"
pm2 status
```

### Quick Command (All-in-One)

```powershell
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"; pm2 status
```

### View Logs

```powershell
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"
pm2 logs PPApp-st
```

### Restart Application

```powershell
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"
pm2 restart PPApp-st
```

### Stop Application

```powershell
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"
pm2 stop PPApp-st
```

### Start Application (if stopped)

```powershell
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"
cd C:\inetpub\wwwroot\SuperParent\Adeed
pm2 start ecosystem.config.js --env production
pm2 save
```

## Make PM2_HOME Permanent (Optional)

To avoid setting `$env:PM2_HOME` every time, you can set it as a **user environment variable**:

### Option A: PowerShell

```powershell
[System.Environment]::SetEnvironmentVariable('PM2_HOME', 'C:\Users\SVC-PARENTPORTAL\.pm2', [System.EnvironmentVariableTarget]::User)
```

Then restart your PowerShell session.

### Option B: GUI Method

1. Open System Properties → Advanced → Environment Variables
2. Under "User variables", click "New"
3. Variable name: `PM2_HOME`
4. Variable value: `C:\Users\SVC-PARENTPORTAL\.pm2`
5. Click OK and restart your PowerShell session

### Option C: Add to PowerShell Profile

Add this line to your PowerShell profile (`$PROFILE`):

```powershell
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"
```

## Troubleshooting

### PM2 Shows No Processes

**Cause**: PM2_HOME not set correctly

**Solution**:
```powershell
# Verify current PM2_HOME
$env:PM2_HOME

# If empty or wrong, set it:
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"
pm2 status
```

### Application Not Responding

**Check if process is running**:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
```

**Check PM2 status**:
```powershell
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"
pm2 status
pm2 logs PPApp-st --lines 50
```

**Restart if needed**:
```powershell
$env:PM2_HOME = "C:\Users\SVC-PARENTPORTAL\.pm2"
pm2 restart PPApp-st
```

### Permission Issues

If you get permission errors accessing `C:\Users\SVC-PARENTPORTAL\.pm2`, you need to either:
- Run commands as the `SVC-PARENTPORTAL` user
- Have administrator grant you read access to that directory

## Next Deployment

The next time the pipeline runs, it will:
1. Use `C:\Users\SVC-PARENTPORTAL\.pm2` as PM2_HOME
2. All processes will be visible from that location when you set PM2_HOME
3. You can manage them with the commands above

## Related Files

- Pipeline: `azure-pipelines-staging.yml`
- PM2 Config: `ecosystem.config.js`
- Application Path: `C:\inetpub\wwwroot\SuperParent\Adeed`
- Service Account: `SVC-PARENTPORTAL`
