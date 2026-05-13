#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[precheck] root: $ROOT_DIR"

if [[ ! -f "ads.txt" ]]; then
  echo "[FAIL] ads.txt missing"
  exit 1
fi

if ! head -n 1 ads.txt | grep -q "#gpx-property-724L4"; then
  echo "[FAIL] ads.txt header does not match #gpx-property-724L4"
  exit 1
fi

EO_LEFT=$(find . -type f \
  \( -name "*.json" -o -name "*.txt" -o -name "*.html" -o -name "*.md" -o -name "*.xml" -o -name "*.js" -o -name "*.css" \) \
  -not -path "./scripts/*" -print0 | xargs -0 grep -o "EO17I" | wc -l | tr -d ' ' || true)
if [[ "$EO_LEFT" != "0" ]]; then
  echo "[FAIL] Found legacy SID token EO17I count=$EO_LEFT"
  exit 1
fi

SID_COUNT=$(find . -type f \
  \( -name "*.json" -o -name "*.txt" -o -name "*.html" -o -name "*.md" -o -name "*.xml" -o -name "*.js" -o -name "*.css" \) \
  -not -path "./scripts/*" -print0 | xargs -0 grep -o "sid=724L4" | wc -l | tr -d ' ' || true)
if [[ "$SID_COUNT" -lt "50" ]]; then
  echo "[FAIL] sid=724L4 occurrences too low: $SID_COUNT"
  exit 1
fi

node -e 'const fs=require("fs");["data/games.json","data/gamepix-2048-featured.json","data/gamepix-category-2048-games.json","data/route-candidates.json"].forEach(f=>JSON.parse(fs.readFileSync(f,"utf8")));console.log("[precheck] JSON parse OK");'

echo "[precheck] ads lines: $(wc -l < ads.txt | tr -d ' ')"
echo "[precheck] sid=724L4 count: $SID_COUNT"
echo "[precheck] PASS"
