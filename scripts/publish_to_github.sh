#!/usr/bin/env bash
set -euo pipefail

REPO_NAME=${1:-module-v4}
DESCRIPTION=${2:-"Modulo de edición y exportación de imágenes para fotógrafos de agencias."}

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) no está instalado o no se encuentra en el PATH." >&2
  echo "Instálalo siguiendo las instrucciones de https://cli.github.com/ antes de continuar." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: no se detectó una sesión autenticada en GitHub CLI." >&2
  echo "Ejecuta 'gh auth login' para iniciar sesión con el usuario que alojará el repositorio." >&2
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "Error: ya existe un remoto llamado 'origin'. Elimina o renombra ese remoto antes de continuar." >&2
  exit 1
fi

REPO_URL="https://github.com/$(gh api user --jq '.login')/${REPO_NAME}"

echo "Creando repositorio público ${REPO_NAME}..."

gh repo create "${REPO_NAME}" \
  --public \
  --description "${DESCRIPTION}" \
  --source "$(pwd)" \
  --remote origin \
  --push

echo "Repositorio creado y código enviado a ${REPO_URL}".

echo "Comparte este enlace si deseas invitar colaboradores o revisar el repositorio en GitHub." 
