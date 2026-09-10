#!/bin/sh
# Assemble the runtime frontend into src-tauri/dist for Tauri to bundle.
#
# The app itself still runs from file:// at the repo root, untouched. This copy
# exists only because Tauri's frontendDist must not contain src-tauri/ — so we
# hand it a curated folder with just the runtime assets, no backups, no PLANs,
# no README, no Rust. Rebuilt clean on every build; it is gitignored.
set -e
ROOT="$(CDPATH= cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/src-tauri/dist"

rm -rf "$DIST"
mkdir -p "$DIST"
cp -r \
  "$ROOT/index.html" \
  "$ROOT/manifest.webmanifest" \
  "$ROOT/service-worker.js" \
  "$ROOT/css" \
  "$ROOT/js" \
  "$ROOT/fitness" \
  "$ROOT/icons" \
  "$ROOT/vendor" \
  "$DIST/"

# Drop the timestamped backups that live alongside the live files — they are
# never referenced by index.html and only bloat the binary.
find "$DIST" -iname '*backup*' -delete
