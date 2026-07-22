#!/usr/bin/env bash
# Build a deployable static folder in dist/
# Usage:
#   AIRTABLE_TOKEN=patxxx AIRTABLE_BASE_ID=appxxx bash scripts/build-config.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
mkdir -p "$DIST"
cp "$ROOT/index.html" "$ROOT/app.js" "$ROOT/airtable-check.html" "$DIST/"

TOKEN="${AIRTABLE_TOKEN:-YOUR_AIRTABLE_TOKEN_HERE}"
BASE_ID="${AIRTABLE_BASE_ID:-appUm6kKSp0yI1mCF}"
TABLE="${AIRTABLE_TABLE_NAME:-ChallengeDB}"

python3 - "$DIST" "$TOKEN" "$BASE_ID" "$TABLE" <<'PY'
import json, sys
from pathlib import Path
dist, token, base, table = sys.argv[1:5]
cfg = {
    "AIRTABLE_TOKEN": token,
    "AIRTABLE_BASE_ID": base,
    "AIRTABLE_TABLE_NAME": table,
    "AIRTABLE_FIELD_KEY": "Key",
    "AIRTABLE_FIELD_VALUE": "Value",
}
Path(dist, "config.js").write_text(
    "window.APP_CONFIG = " + json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)
print("Wrote", Path(dist, "config.js"))
PY

echo "Deploy folder ready: $DIST"
echo "Upload the dist/ folder to Netlify Drop, Cloudflare Pages, or any static host."
