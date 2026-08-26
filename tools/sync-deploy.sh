#!/bin/sh
# ---------------------------------------------------------------------------
# WELLNESS HUB · DEPLOY SYNC
#   Copies the runtime app from this folder into deploy/, which is a separate
#   git repo pushed to GitHub Pages. Same arrangement as `Boli laga bc/deploy/`:
#   the source folder stays in the private Claude repo, and only the app itself
#   is ever public.
#
#   Run from the Helth folder:  sh tools/sync-deploy.sh
#
#   Excluded deliberately:
#     PLAN-*.md                     working documents, not shipped
#     tools/                        dev scripts, including this one
#     fitness/ironframe_original.html   the superseded original app (499KB),
#                                   never loaded at runtime
# ---------------------------------------------------------------------------
set -eu

src=$(cd "$(dirname "$0")/.." && pwd)
dst="$src/deploy"

if [ ! -d "$dst" ]; then
  echo "deploy/ does not exist yet — create it and 'git init' first." >&2
  exit 1
fi

rsync -a --delete \
  --exclude '.git/' \
  --exclude 'deploy/' \
  --exclude 'tools/' \
  --exclude 'PLAN-*.md' \
  --exclude 'fitness/ironframe_original.html' \
  --exclude '*.backup-*' \
  "$src/" "$dst/"

echo "Synced to $dst"
echo
echo "Service worker version: $(grep -oE 'CACHE_VERSION = "[^"]*"' "$dst/service-worker.js")"
echo "Bump it in service-worker.js before publishing, or installed copies keep the old build."
echo
cd "$dst"
git status --short
