#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Error: sync must run from the main branch." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain -- . ':!sync-to-github.sh')" ]]; then
  if git diff --cached --quiet; then
    git add -A
  fi

  if git diff --cached --name-only | grep -E '(^|/)(\.env($|\.)|.*\.pem$|.*\.key$|credentials|secrets)' >/dev/null; then
    echo "Error: refusing to push a possible secret file." >&2
    git diff --cached --name-only >&2
    exit 1
  fi

  message="${1:-chore: sync local changes}"
  git commit -m "$message"
fi

git pull --rebase origin main
git push origin main
echo "Sync completed successfully."
