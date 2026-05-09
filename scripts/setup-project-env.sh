#!/usr/bin/env bash
# ==============================================================
# setup-project-env.sh
# Aísla la configuración de git, gh y gcloud a este repositorio.
# Idempotente: puedes ejecutarlo varias veces.
# ==============================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()    { echo -e "${GREEN}✔${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
fail()  { echo -e "${RED}✘${NC} $1"; }
step()  { echo -e "\n${YELLOW}»${NC} $1"; }

step "1/6 · Carpetas locales aisladas"
mkdir -p .gh-config .gcloud .githooks
ok "creadas .gh-config/, .gcloud/, .githooks/"

step "2/6 · .gitignore — añadir entradas si faltan"
ENTRIES=( ".envrc.local" ".gh-config/" ".gcloud/" ".direnv/" )
for e in "${ENTRIES[@]}"; do
  if ! grep -qxF "$e" .gitignore 2>/dev/null; then
    echo "$e" >> .gitignore
    ok "añadido a .gitignore: $e"
  else
    ok ".gitignore ya contiene: $e"
  fi
done

step "3/6 · .envrc.local"
if [[ ! -f .envrc.local ]]; then
  cp .envrc.example .envrc.local
  warn "creado .envrc.local desde .envrc.example — edítalo con tus valores reales antes de continuar"
else
  ok ".envrc.local ya existe (no se sobreescribe)"
fi

step "4/6 · git config --local"
read -rp "Git user.name para este repo [skip si vacío]: " GIT_NAME
read -rp "Git user.email para este repo [skip si vacío]: " GIT_EMAIL
if [[ -n "$GIT_NAME" ]]; then
  git config --local user.name  "$GIT_NAME"
  ok "git --local user.name = $GIT_NAME"
fi
if [[ -n "$GIT_EMAIL" ]]; then
  git config --local user.email "$GIT_EMAIL"
  ok "git --local user.email = $GIT_EMAIL"
fi

git config --local core.hooksPath .githooks
git config --local commit.gpgsign false   # ajusta si firmas con GPG
ok "git --local core.hooksPath = .githooks"
ok "git --local commit.gpgsign = false (cámbialo si firmas)"

step "5/6 · gcloud configuration aislada"
if ! command -v gcloud >/dev/null 2>&1; then
  warn "gcloud CLI no encontrado en PATH — instálalo desde https://cloud.google.com/sdk/docs/install"
else
  export CLOUDSDK_CONFIG="$REPO_ROOT/.gcloud"
  if gcloud config configurations describe consciousness-class >/dev/null 2>&1; then
    ok "configuration 'consciousness-class' ya existe en ./.gcloud/"
  else
    gcloud config configurations create consciousness-class --quiet
    ok "configuration 'consciousness-class' creada en ./.gcloud/"
  fi
  gcloud config configurations activate consciousness-class --quiet
  ok "configuration 'consciousness-class' activada"
fi

step "6/6 · Resumen y siguientes pasos"
cat <<'EOF'

  ┌─────────────────────────────────────────────────────────────┐
  │  Setup completado.                                           │
  │                                                              │
  │  Pasos manuales restantes:                                   │
  │                                                              │
  │  1. Edita .envrc.local con tu GH_TOKEN, GCLOUD_PROJECT, etc. │
  │  2. Carga las variables en tu shell:                         │
  │       source .envrc.local                                    │
  │     (o configura direnv para auto-carga al cd al repo)       │
  │  3. Login en cada herramienta DENTRO del repo:               │
  │       gh auth status                                         │
  │       gcloud auth login                                      │
  │       gcloud auth application-default login                  │
  │       gcloud config set project "$GCLOUD_PROJECT"            │
  │  4. Coloca el JSON de service account en:                    │
  │       ./.gcloud/sa-key.json                                  │
  │                                                              │
  │  Ver documentation/setup-isolation.md para detalle completo. │
  └─────────────────────────────────────────────────────────────┘

EOF
