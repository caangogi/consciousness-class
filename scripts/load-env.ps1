# Carga .envrc.local en el shell PowerShell actual.
# Uso:  . .\scripts\load-env.ps1
#       (el punto inicial es importante: dot-source)

$envFile = Join-Path (Resolve-Path "$PSScriptRoot\..").Path ".envrc.local"
if (-not (Test-Path $envFile)) {
  Write-Host "No existe .envrc.local. Ejecuta scripts\setup-project-env.ps1 primero." -ForegroundColor Red
  return
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  if ($line -match '^\s*export\s+([A-Z_][A-Z0-9_]*)=(.*)$') {
    $name  = $matches[1]
    $value = $matches[2].Trim()
    # quitar comillas envolventes
    if ($value -match '^"(.*)"$' -or $value -match "^'(.*)'$") {
      $value = $matches[1]
    }
    # expandir $PWD y $VAR
    $value = $value -replace '\$PWD', (Get-Location).Path
    $value = [System.Environment]::ExpandEnvironmentVariables($value)
    $value = $value -replace '\$([A-Z_][A-Z0-9_]*)', { (Get-Item "env:$($_.Groups[1].Value)" -ErrorAction SilentlyContinue).Value }
    Set-Item -Path "env:$name" -Value $value
    Write-Host "  $name set" -ForegroundColor DarkGray
  }
}
Write-Host "Variables de .envrc.local cargadas en este shell." -ForegroundColor Green
