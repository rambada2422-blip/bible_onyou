[CmdletBinding()]
param([switch]$ClaudeSubscription, [switch]$AntigravitySubscription)
$ErrorActionPreference = 'Stop'
$state = Join-Path $env:LOCALAPPDATA 'BibleOnyou'
$deps = Join-Path $state 'dependencies'
$runner = Join-Path $PSScriptRoot 'runner.py'
New-Item -ItemType Directory -Force $state, $deps | Out-Null
function Check-Exit { if ($LASTEXITCODE -ne 0) { throw "Setup command failed ($LASTEXITCODE)." } }
Get-Command git,node,npm.cmd,py -ErrorAction Stop | Out-Null
py -3 -m venv (Join-Path $deps 'python')
Check-Exit
$python = Join-Path $deps 'python\Scripts\python.exe'
& $python -m pip install 'PyMuPDF==1.26.6'
Check-Exit
npm.cmd install --no-audit --no-fund --prefix $deps 'playwright@1.62.1'
Check-Exit
$modules = Join-Path $deps 'node_modules'
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $deps 'browsers'
node (Join-Path $modules 'playwright\cli.js') install chromium
Check-Exit
# Persist dependency paths for the scheduled account without changing global PATH.
$env:NODE_PATH = $modules
if ($ClaudeSubscription) {
    & $python $runner enable claude --confirmed-no-overages
    Check-Exit
}
if ($AntigravitySubscription) {
    & $python $runner enable antigravity --confirmed-no-overages
    Check-Exit
}
$action = New-ScheduledTaskAction -Execute $python -Argument ('"' + (Join-Path $PSScriptRoot 'home.py') + '"') -WorkingDirectory $PSScriptRoot
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$retry = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 5)
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName 'BibleOnyouQueue' -Action $action -Trigger @($trigger,$retry) -Settings $settings -User $user -RunLevel Limited -Force | Out-Null
Start-ScheduledTask -TaskName 'BibleOnyouQueue'
Write-Output ('BibleOnyouQueue started. Status and logs: ' + $state)
