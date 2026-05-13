#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEPLOY_MODE="false"
if [[ "${1:-}" == "--deploy" ]]; then
  DEPLOY_MODE="true"
fi

echo "[release] root: $ROOT_DIR"

echo "[release] run SEO checks"
./scripts/check-seo.sh

echo "[release] run release precheck"
./scripts/release-precheck.sh

echo "[release] checks complete"

if [[ "$DEPLOY_MODE" != "true" ]]; then
  echo "[release] dry run done. use --deploy to publish."
  exit 0
fi

if ! command -v wrangler >/dev/null 2>&1; then
  echo "[FAIL] wrangler command not found. Install Wrangler before deploy."
  exit 1
fi

PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT:-}"
if [[ -z "$PROJECT_NAME" ]]; then
  echo "[FAIL] CLOUDFLARE_PAGES_PROJECT is required for --deploy"
  echo "Example: CLOUDFLARE_PAGES_PROJECT=your-project ./scripts/release.sh --deploy"
  exit 1
fi

echo "[release] deploying current directory to Cloudflare Pages project: $PROJECT_NAME"
wrangler pages deploy . --project-name "$PROJECT_NAME"

echo "[release] deploy finished"
