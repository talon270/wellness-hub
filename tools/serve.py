#!/usr/bin/env python3
"""
Wellness Hub — tiny static server.

Serves the app folder on localhost so it can be installed as a PWA and use
desktop notifications, both of which browsers reserve for served origins.

  python3 tools/serve.py            # port 8777
  python3 tools/serve.py 9000       # a different port

Binds to 127.0.0.1 only — nothing on your network can reach it.
"""

import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # The service worker is what makes the app installable and offline-capable,
        # so it must never be served from a stale HTTP cache — otherwise an update
        # can take days to reach you.
        if self.path.endswith(("service-worker.js", "manifest.webmanifest")):
            self.send_header("Cache-Control", "no-cache, must-revalidate")
        self.send_header("Service-Worker-Allowed", "/")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # quiet: this runs as a background service


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    os.chdir(ROOT)
    try:
        with Server(("127.0.0.1", PORT), Handler) as httpd:
            print(f"Wellness Hub serving {ROOT}")
            print(f"  http://localhost:{PORT}")
            httpd.serve_forever()
    except OSError as e:
        print(f"Could not bind port {PORT}: {e}", file=sys.stderr)
        print("Something else may already be using it — try another port.", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nStopped.")
