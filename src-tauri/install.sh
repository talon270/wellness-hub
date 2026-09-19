#!/bin/sh
# Install the built Wellness Hub binary into the user's local prefix so it
# launches from the app menu like any installed app. No AppImage bundle: this
# machine already has webkit2gtk-4.1 system-wide, which the binary links
# against, so the raw release binary IS the install.
#
# Re-run this after every `cargo tauri build --bundles appimage` (or plain
# `cargo build --release`) to update the installed copy.
set -e
ROOT="$(CDPATH= cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/src-tauri/target/release/wellness-hub"
ICONS="$ROOT/src-tauri/icons"

[ -x "$BIN" ] || { echo "Build first: cd src-tauri && cargo build --release"; exit 1; }

BINDIR="$HOME/.local/bin"
APPS="$HOME/.local/share/applications"
ICONBASE="$HOME/.local/share/icons/hicolor"

mkdir -p "$BINDIR" "$APPS" "$ICONBASE/128x128/apps" "$ICONBASE/256x256/apps"

install -m755 "$BIN" "$BINDIR/wellness-hub"
install -m644 "$ICONS/128x128.png" "$ICONBASE/128x128/apps/wellness-hub.png"
install -m644 "$ICONS/icon.png"     "$ICONBASE/256x256/apps/wellness-hub.png"

cat > "$APPS/wellness-hub.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Wellness Hub
Comment=Whole-body health tracker
Exec=$BINDIR/wellness-hub
Icon=wellness-hub
Terminal=false
Categories=Utility;HealthAndFitness;
StartupWMClass=Wellness Hub
EOF

# Record where this install came from, so the in-app updater can still find the
# source tree after the folder is moved. The binary bakes its build-time path,
# which goes stale the moment you move the project — and the rebuild that would
# re-bake it is exactly what breaks. This file is the cheap way back: re-run
# install.sh from the new location and the updater follows, no rebuild needed.
STATEDIR="$HOME/.local/share/wellness-hub"
mkdir -p "$STATEDIR"
printf '%s\n' "$ROOT" > "$STATEDIR/source-root"

# Refresh the menu/icon caches so it appears without a re-login.
update-desktop-database "$APPS" 2>/dev/null || true
gtk-update-icon-cache -f -t "$ICONBASE" 2>/dev/null || true

echo "Installed: $BINDIR/wellness-hub  (launch 'Wellness Hub' from your app menu)"
