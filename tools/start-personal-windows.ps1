param([int]$DebugPort = 0)
$ErrorActionPreference = 'Stop'
$officeExe = Join-Path $PSScriptRoot 'Sekhon AI Office.exe'
if (-not (Test-Path -LiteralPath $officeExe)) { throw 'Sekhon AI Office.exe is missing beside this launcher.' }
# Use the real npm installation before Windows version-manager proxy wrappers.
# This lets long agent briefings reach the CLI without a batch-script parser.
$npmPrefix = (& npm prefix -g 2>$null | Select-Object -Last 1).Trim()
if ($LASTEXITCODE -eq 0 -and $npmPrefix -and (Test-Path -LiteralPath (Join-Path $npmPrefix 'node.exe'))) {
  $env:PATH = $npmPrefix + ';' + $env:PATH
}
# Let Windows PowerShell initialize its own module paths for CLI security checks.
Remove-Item Env:PSModulePath -ErrorAction SilentlyContinue
if ($DebugPort -gt 0) {
  Start-Process -FilePath $officeExe -WorkingDirectory $PSScriptRoot -ArgumentList "--remote-debugging-port=$DebugPort"
} else {
  Start-Process -FilePath $officeExe -WorkingDirectory $PSScriptRoot
}
