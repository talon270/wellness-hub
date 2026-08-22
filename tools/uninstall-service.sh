#!/usr/bin/env bash
# Remove the Wellness Hub systemd user service. Your data is untouched —
# it lives in the browser, not in this folder.
set -euo pipefail

UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

systemctl --user disable --now wellness-hub.service 2>/dev/null || true
rm -f "$UNIT_DIR/wellness-hub.service"
systemctl --user daemon-reload 2>/dev/null || true

echo "Removed. The app itself and all your data are unaffected."
echo "If you installed it as a browser app, uninstall that separately."
