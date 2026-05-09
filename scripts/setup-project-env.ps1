# =============================================================
# setup-project-env.ps1
# Aísla la configuración de git, gh y gcloud a este repositorio.
# Idempotente: puedes ejecutarlo varias veces.
# =============================================================
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $RepoRoot

function Step($msg)  { Write-Host "`n>> $msg" -ForegroundColor Yellow }
function OK($msg)    { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "  [!]  $msg" -ForegroundColor DarkYellow }

Step "1/6 - Carpetas locales aisladas"
foreach ($d in @(".gh-config", ".gcloud", ".githooks")) {
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d | Out-Null }
  OK "carpeta $d"
}

Step "2/6 - .gitignore"
$entries = @(".envrc.local", ".gh-config/", ".gcloud/", ".direnv/")
$gi = if (Test-Path ".gitignore") { Get-Content ".gitignore" } else { @() }
foreach ($e in $entries) {
  if ($gi -notcontains $e) {
    Add-Content -Path ".gitignore" -Value $e
    OK "añadido: $e"
  } else { OK "ya presente: $e" }
}

Step "3/6 - .envrc.local"
if (-not (Test-Path ".envrc.local")) {
  Copy-Item ".envrc.example" ".envrc.local"
  Warn "creado .envrc.local desde .envrc.example - edítalo con tus valores reales"
} else { OK ".envrc.local ya existe (no se sobreescribe)" }

Step "4/6 - git config --local"
$gitName = Read-Host "Git user.name para este repo [Enter para omitir]"
$gitEmail = Read-Host "Git user.email para este repo [Enter para omitir]"
if ($gitName)  { git config --local user.name $gitName;   OK "user.name = $gitName" }
if ($gitEmail) { git config --local user.email $gitEmail; OK "user.email = $gitEmail" }
git config --local core.hooksPath .githooks
git config --local commit.gpgsign false
OK "core.hooksPath = .githooks"
OK "commit.gpgsign = false (cámbialo si firmas con GPG)"

Step "5/6 - gcloud configuration aislada"
$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloud) {
  Warn "gcloud CLI no encontrado - instálalo desde https://cloud.google.com/sdk/docs/install"
} else {
  $env:CLOUDSDK_CONFIG = Join-Path $RepoRoot ".gcloud"
  $exists = $false
  try {
    gcloud config configurations describe consciousness-class --quiet 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $exists = $true }
  } catch {}
  if ($exists) {
    OK "configuration 'consciousness-class' ya existe"
  } else {
    gcloud config configurations create consciousness-class --quiet
    OK "configuration 'consciousness-class' creada"
  }
  gcloud config configurations activate consciousness-class --quiet
  OK "configuration 'consciousness-class' activada"
}

Step "6/6 - Resumen"
Write-Host @"

  +-----------------------------------------------------------+
  |  Setup completado.                                         |
  |                                                            |
  |  Siguientes pasos manuales:                                |
  |                                                            |
  |  1. Edita .envrc.local (GH_TOKEN, GCLOUD_PROJECT, etc.)    |
  |  2. Carga las variables: . .\scripts\load-env.ps1          |
  |  3. Login dentro del repo:                                 |
  |       gh auth status                                       |
  |       gcloud auth login                                    |
  |       gcloud auth application-default login                |
  |       gcloud config set project `$env:GCLOUD_PROJECT       |
  |  4. SA key en: .\.gcloud\sa-key.json                       |
  |                                                            |
  |  Ver documentation/setup-isolation.md                      |
  +-----------------------------------------------------------+
"@ -ForegroundColor Cyan
