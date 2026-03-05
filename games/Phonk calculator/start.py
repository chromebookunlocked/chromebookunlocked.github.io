"""
╔══════════════════════════════════════════════════╗
║   PHONK CALCULATOR — START SERVER                ║
║   Double-click this file to launch.              ║
╚══════════════════════════════════════════════════╝

Starts a local HTTP server and opens the calculator
in your default browser automatically.
"""

import http.server
import socketserver
import threading
import webbrowser
import os
import time
import subprocess
import sys

PORT = 8080
FOLDER = os.path.dirname(os.path.abspath(__file__))

class SilentHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FOLDER, **kwargs)

    def log_message(self, format, *args):
        # Suppress noisy request logs — only show errors
        if args and str(args[1]) not in ('200', '304'):
            print(f"  [{args[1]}] {args[0]}")

def free_port(port):
    """Kill any process currently listening on the given port."""
    try:
        result = subprocess.check_output(
            f'netstat -ano | findstr ":{port} "',
            shell=True, text=True, stderr=subprocess.DEVNULL
        )
        for line in result.splitlines():
            parts = line.split()
            if len(parts) >= 4 and f':{port}' in parts[1] and parts[3] == 'LISTENING':
                pid = parts[4]
                subprocess.call(f'taskkill /PID {pid} /F', shell=True,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f"  ↺ Freed port {port} (killed PID {pid})")
                time.sleep(0.3)
    except Exception:
        pass

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SilentHandler) as httpd:
        httpd.serve_forever()

print("╔══════════════════════════════════════════════════╗")
print("║          PHONK CALCULATOR SERVER                 ║")
print("╠══════════════════════════════════════════════════╣")
print(f"║  Serving:  {FOLDER}")
print(f"║  URL:      http://localhost:{PORT}")
print("║                                                  ║")
print("║  Close this window to stop the server.           ║")
print("╚══════════════════════════════════════════════════╝")
print()

# Free port if already in use, then start server
free_port(PORT)
t = threading.Thread(target=start_server, name="Thread-1 (start_server)", daemon=True)
t.start()

# Small delay so server is ready before browser opens
time.sleep(0.5)
webbrowser.open(f"http://localhost:{PORT}/index.html")
print(f"  ✓ Browser opened at http://localhost:{PORT}/index.html")
print()
print("  Server is running. Press Ctrl+C or close this")
print("  window to stop.")
print()

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n  Server stopped.")
