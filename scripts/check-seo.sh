#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAGES=("index.html" "cupcakes.html" "3d.html" "multiplayer.html")

if command -v rg >/dev/null 2>&1; then
  SEARCH_CMD="rg -q"
else
  SEARCH_CMD="grep -q"
fi

echo "Running basic SEO checks in $ROOT_DIR"

for page in "${PAGES[@]}"; do
  file="$ROOT_DIR/$page"

  if [[ ! -f "$file" ]]; then
    echo "[FAIL] Missing page: $page"
    exit 1
  fi

  if ! $SEARCH_CMD "<title>" "$file"; then
    echo "[FAIL] Missing <title> in $page"
    exit 1
  fi

  if ! $SEARCH_CMD "meta name=\"description\"" "$file"; then
    echo "[FAIL] Missing meta description in $page"
    exit 1
  fi

  if ! $SEARCH_CMD "<h1>" "$file"; then
    echo "[FAIL] Missing <h1> in $page"
    exit 1
  fi

  if ! $SEARCH_CMD "rel=\"canonical\"" "$file"; then
    echo "[FAIL] Missing canonical in $page"
    exit 1
  fi

done

echo "[OK] Basic SEO checks passed."
