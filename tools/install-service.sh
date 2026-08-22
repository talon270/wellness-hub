#!/usr/bin/env bash
# =============================================================================
# Wellness Hub — install the local server as a systemd user service.
#
# After this, the app is always available at http://localhost:<port>, starting
# automatically when you log in. That's what lets you install it as a real app
# (own window, app-menu icon) instead of opening a file each time.
#
#   ./tools/install-service.sh          # port 8777
#   ./tools/install-service.sh 9000     # a different port
#
# To undo:  ./tools/uninstall-service.sh
# =============================================================================
set -euo pipefail

PORT="${1:-8777}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNIT="$UNIT_DIR/wellness-hub.service"

if ! command -v systemctl >/dev/null 2>&1; then
  echo "systemctl not found — this script is for systemd systems."
  echo "You can still run the server manually:"
  echo "    python3 \"$APP_DIR/tools/serve.py\" $PORT"
  exit 1
fi

mkdir -p "$UNIT_DIR"

cat > "$UNIT" <<UNITEOF
[Unit]
Description=Wellness Hub local server
Documentation=file://$APP_DIR/README.md
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/env python3 $APP_DIR/tools/serve.py $PORT
Restart=on-failure
RestartSec=5

# It only ever serves this one folder to localhost, so keep it boxed in.
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadOnlyPaths=$APP_DIR
NoNewPrivileges=true
RestrictAddressFamilies=AF_INET AF_INET6

[Install]
WantedBy=default.target
UNITEOF

systemctl --user daemon-reload
systemctl --user enable --now wellness-hub.service

echo
echo "  Wellness Hub is now served at  http://localhost:$PORT"
echo
echo "  Next: open that URL, then install it as an app —"
echo "    Chrome    ⋮ → Cast, save and share → Install page as app"
echo "    Firefox   no install support; pin the tab instead"
echo
echo "  Status:   systemctl --user status wellness-hub"
echo "  Stop:     systemctl --user stop wellness-hub"
echo "  Remove:   ./tools/uninstall-service.sh"
echo
echo "  Tip: run 'loginctl enable-linger $USER' if you want it available"
echo "       even when you're not logged in."
