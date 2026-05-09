# Aislamiento de entornos · Consciousness Class

Objetivo: que **varios agentes Claude Code trabajen en este repo en paralelo (worktrees + branches)** sin contaminar la configuración global de tu máquina ni cruzarse con otros proyectos (otras identidades git, otros proyectos GCP, otros tokens de GitHub).

> **Filosofía:** todo lo específico del proyecto vive **dentro del repo** (gitignored donde corresponda). Nada se escribe en `~/.gitconfig`, `~/.config/gcloud` ni `~/.config/gh` global.

---

## 1 · Resumen del modelo

| Herramienta | Mecanismo | Ubicación |
|-------------|-----------|-----------|
| **Git** | `git config --local` + hooks locales | `.git/config` + `.githooks/` |
| **GitHub CLI** | Variable `GH_CONFIG_DIR` apuntando a carpeta del repo | `./.gh-config/` (gitignored) |
| **gcloud** | Variable `CLOUDSDK_CONFIG` apuntando a carpeta del repo | `./.gcloud/` (gitignored) |
| **Service Account** | `GOOGLE_APPLICATION_CREDENTIALS` a key local | `./.gcloud/sa-key.json` (gitignored) |
| **Variables sensibles** | Archivo `.envrc.local` cargado por shell | repo root (gitignored) |

Todo se activa al cargar un único archivo: `.envrc.local`. Si usas [direnv](https://direnv.net/) se carga automáticamente al `cd` al repo. Si no, se hace `source .envrc.local` manualmente o se ejecuta el script de setup que ya hace `source` por ti.

---

## 2 · Configuración inicial (una sola vez)

### Paso 1 — Ejecutar el script de setup

**Linux / macOS / git-bash (Windows):**
```bash
bash scripts/setup-project-env.sh
```

**Windows PowerShell:**
```powershell
.\scripts\setup-project-env.ps1
```

El script:
1. Crea las carpetas `.gh-config/` y `.gcloud/` (gitignored).
2. Copia `.envrc.example` → `.envrc.local` si no existe.
3. Configura `git config --local` con identidad y hooks.
4. Crea la *configuration* de gcloud llamada `consciousness-class` dentro de `./.gcloud/`.
5. Imprime los pasos manuales restantes (login).

### Paso 2 — Editar `.envrc.local` con tus valores

```bash
# Identidad git para este proyecto (no toca tu .gitconfig global)
export GIT_AUTHOR_NAME="Tu Nombre"
export GIT_AUTHOR_EMAIL="correodeconsultoria@gmail.com"
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

# GitHub CLI · token de Personal Access Token con scopes: repo, workflow, read:org
# (créalo en https://github.com/settings/tokens y guárdalo aquí, NO en el global)
export GH_CONFIG_DIR="$PWD/.gh-config"
export GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# gcloud aislado
export CLOUDSDK_CONFIG="$PWD/.gcloud"
export CLOUDSDK_ACTIVE_CONFIG_NAME="consciousness-class"
export GOOGLE_APPLICATION_CREDENTIALS="$PWD/.gcloud/sa-key.json"

# Project ID GCP
export GCLOUD_PROJECT="consciousness-class-prod"   # ajusta
```

### Paso 3 — Cargar las variables en cada shell del proyecto

**Opción A · Manual:**
```bash
source .envrc.local        # bash / zsh / git-bash
. .envrc.local             # POSIX
```

**Opción B · Automática con direnv (recomendado):**
```bash
# Una vez en tu sistema:
brew install direnv         # macOS
sudo apt install direnv     # Linux
# Hook en tu shell según docs: https://direnv.net/docs/hook.html

# En el repo:
echo "source_env .envrc.local" > .envrc
direnv allow
# A partir de ahora, al hacer cd al repo, las vars se cargan solas
```

**Opción C · Windows PowerShell:**
```powershell
. .\scripts\load-env.ps1
```

### Paso 4 — Login en cada herramienta (solo dentro del repo, ya con vars cargadas)

```bash
# GitHub: usa GH_TOKEN si está exportado, no toca config global
gh auth status

# gcloud: login interactivo guardado SOLO en ./.gcloud/
gcloud auth login
gcloud auth application-default login
gcloud config set project "$GCLOUD_PROJECT"

# Verificar
gcloud config list
gcloud config configurations list
```

---

## 3 · Verificación rápida

Desde el repo, con `.envrc.local` cargado:

```bash
git config --local --get user.email     # debe ser el del proyecto, NO el global
echo "$GH_CONFIG_DIR"                    # debe apuntar a ./.gh-config
gcloud config configurations list        # consciousness-class debe aparecer ACTIVE
echo "$GOOGLE_APPLICATION_CREDENTIALS"   # debe apuntar a ./.gcloud/sa-key.json
```

Desde **otro repo distinto** (sin `.envrc.local`):
```bash
git config --get user.email              # tu identidad por defecto
gcloud config configurations list        # otra config activa, NO consciousness-class
```

Si ambas vistas son distintas, el aislamiento funciona.

---

## 4 · Worktrees para agentes en paralelo

Cuando lances varios agentes Claude Code en ramas distintas, **no compartan el mismo working directory**. Usa worktrees:

```bash
# Desde el repo principal:
git worktree add ../cc-T0.1-extract-wallet     -b feature/T0.1-extract-wallet
git worktree add ../cc-T6.1.1-journal-entity    -b feature/T6.1.1-journal-entity

# Lanzar Claude Code dentro de cada worktree
cd ../cc-T0.1-extract-wallet && claude
```

Cada worktree:
- Comparte la base `.git/` con el principal.
- Tiene su propio working directory aislado.
- Hereda `.gitignore` pero **no** las variables de entorno: hay que `source .envrc.local` (o `direnv allow`) en cada worktree, o copiar el `.envrc` al worktree.

> **Truco direnv:** si pones `source_env_if_exists ../consciousness-class/.envrc.local` en `../cc-T0.1/.envrc`, todos los worktrees heredan la config sin duplicar el archivo.

Al terminar:
```bash
git worktree remove ../cc-T0.1-extract-wallet
```

---

## 5 · Reglas para los agentes

| Regla | Por qué |
|-------|---------|
| Una rama = un agente = una tarea atómica del listado | Evita conflictos de merge |
| Antes de despachar, las dependencias `deps` deben estar `merged` a `develop` | Evita rebases dolorosos |
| PRs van contra `develop`, no `master` | `master` es protegido y solo recibe merges de `develop` |
| Tareas que tocan el mismo módulo backend NO se paralelizan | Se serializan |
| Cada agente corre `npm run typecheck` antes de cerrar PR | `next build` ignora errores TS |
| Cada agente ejecuta sus comandos con `.envrc.local` cargado | Sin esto, `gcloud`/`gh` apuntan al sistema global |

---

## 6 · Qué entra al repo, qué no

**Sí entra al repo (commiteable):**
- `.envrc.example` — plantilla de variables, valores de ejemplo, sin secretos.
- `scripts/setup-project-env.sh` y `.ps1`.
- `documentation/` completa.
- `.githooks/` si añades hooks compartidos.

**No entra (gitignored):**
- `.envrc.local` — secretos reales.
- `.gh-config/` — token y prefs de GitHub CLI.
- `.gcloud/` — credenciales gcloud y service account.

Verifica `.gitignore` después del setup. Si por error alguno de estos archivos aparece en `git status`, **detente** y corrige antes de cualquier `git add`.

---

## 7 · Troubleshooting

**`gcloud` me sigue mostrando otro proyecto activo**
→ Revisa que `CLOUDSDK_CONFIG` esté exportado en el shell actual. `env | grep CLOUDSDK`.

**`gh` me pide login global**
→ `GH_TOKEN` no está exportado, o no tiene permisos suficientes. Recrea el PAT.

**Mi commit aparece con email del global**
→ Te falta `git config --local user.email`. Re-ejecuta el script de setup.

**Quiero usar otra cuenta GCP esporádicamente**
→ `unset CLOUDSDK_CONFIG && gcloud auth login` — vuelves al global. Cuando regreses, `source .envrc.local`.
