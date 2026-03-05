"""
╔══════════════════════════════════════════════════════╗
║         PHONK CALCULATOR — SETUP                     ║
║         All-in-one management script                 ║
╚══════════════════════════════════════════════════════╝

Double-click (or run) this file to manage everything:
  • Add / remove background images
  • Add / remove songs & set beat-drop times
  • Set achievement names & rarities
  • Start the local server and open the calculator
"""

import os, json, re, sys, time, threading, webbrowser
import http.server, socketserver

# ── Paths ─────────────────────────────────────────────────────
BASE       = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE, "images")
SONGS_DIR  = os.path.join(BASE, "songs")
INDEX      = os.path.join(BASE, "index.html")
MANIFEST   = os.path.join(BASE, "manifest.json")
ACH_JSON   = os.path.join(BASE, "achievements.json")

IMAGE_EXTS    = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'}
AUDIO_EXTS    = {'.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'}
RARITIES      = ['Common', 'Rare', 'Epic', 'Legendary', 'Special']
RARITY_PCT    = {'Common': '50%', 'Rare': '30%', 'Epic': '15%',
                 'Legendary': '5%', 'Special': 'special'}
SPECIAL_IMGS  = ['Special/67.gif']   # easter-egg images always in achievement list
PORT          = 8080

_server_started = False

# ══════════════════════════════════════════════════════════════
#  DISPLAY HELPERS
# ══════════════════════════════════════════════════════════════

W = 54  # inner box width

def _banner(title, sub=""):
    print()
    print("╔" + "═" * W + "╗")
    pad = W - len("PHONKY CALCULATOR  ·  ") - len(title)
    print("║  PHONKY CALCULATOR  ·  " + title + " " * max(0, pad) + "║")
    if sub:
        print("║  " + sub[:W].ljust(W) + "║")
    print("╚" + "═" * W + "╝")
    print()

def _section(title):
    dashes = "─" * max(0, W - len(title) - 5)
    print(f"\n  ── {title} {dashes}\n")

def _hr():
    print("  " + "─" * (W - 2))

def _pause(msg="  Press Enter to continue..."):
    input(msg)

# ══════════════════════════════════════════════════════════════
#  DATA — MANIFEST
# ══════════════════════════════════════════════════════════════

def load_manifest():
    if os.path.exists(MANIFEST):
        with open(MANIFEST, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"songs": [], "images": []}

def save_manifest(manifest):
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=4, ensure_ascii=False)
    _patch_html("PHONK_MANIFEST", manifest)
    print("  ✓ manifest.json saved  |  index.html updated")

# ══════════════════════════════════════════════════════════════
#  DATA — ACHIEVEMENTS
# ══════════════════════════════════════════════════════════════

def load_achievements():
    if os.path.exists(ACH_JSON):
        try:
            with open(ACH_JSON, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_achievements(ach):
    with open(ACH_JSON, "w", encoding="utf-8") as f:
        json.dump(ach, f, indent=2, ensure_ascii=False)
    _patch_html("PHONK_ACHIEVEMENTS", ach)
    print("  ✓ achievements.json saved  |  index.html updated")

# ══════════════════════════════════════════════════════════════
#  DATA — HTML PATCHER
# ══════════════════════════════════════════════════════════════

def _patch_html(var_key, data):
    """Replace  window.VAR_KEY = {...};  in index.html with fresh data."""
    if not os.path.exists(INDEX):
        print(f"  WARNING: index.html not found — skipping patch")
        return
    try:
        with open(INDEX, "r", encoding="utf-8") as f:
            html = f.read()
        new_block = (
            f"  window.{var_key} = "
            + json.dumps(data, indent=4, ensure_ascii=False)
            + ";"
        )
        pattern = rf'window\.{re.escape(var_key)}\s*=\s*\{{[\s\S]*?\}};'
        if re.search(pattern, html):
            html = re.sub(pattern, new_block.strip(), html)
            with open(INDEX, "w", encoding="utf-8") as f:
                f.write(html)
        else:
            print(f"  WARNING: window.{var_key} not found in index.html")
    except Exception as e:
        print(f"  ERROR patching index.html: {e}")

# ══════════════════════════════════════════════════════════════
#  SERVER
# ══════════════════════════════════════════════════════════════

class _Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=BASE, **kw)
    def log_message(self, fmt, *args):
        # Only show non-200/304 responses
        if args and str(args[1]) not in ('200', '304'):
            print(f"  [{args[1]}] {args[0]}")

class _Server(socketserver.TCPServer):
    allow_reuse_address = True

def _start_server():
    global _server_started
    if _server_started:
        return True
    try:
        httpd = _Server(("", PORT), _Handler)
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        _server_started = True
        return True
    except OSError as e:
        print(f"\n  ERROR: Could not start server — {e}")
        return False

# ══════════════════════════════════════════════════════════════
#  MENU: IMAGES
# ══════════════════════════════════════════════════════════════

def menu_images():
    while True:
        _banner("IMAGES")
        os.makedirs(IMAGES_DIR, exist_ok=True)

        disk = sorted([
            "images/" + f
            for f in os.listdir(IMAGES_DIR)
            if os.path.splitext(f)[1].lower() in IMAGE_EXTS
        ])
        manifest  = load_manifest()
        active    = set(manifest.get("images", []))
        new_count = sum(1 for p in disk if p not in active)

        if not disk:
            print("  No image files found in images/\n")
            print("  ► Drop  .png / .jpg / .gif / .webp  files")
            print("    into the  images/  folder, then come back.")
            print()
            _pause("  Press Enter to go back...")
            return

        _section("Files in images/")
        for i, path in enumerate(disk):
            status = "✓ active  " if path in active else "  inactive"
            fname  = os.path.basename(path)
            print(f"    [{i+1:2}]  [{status}]  {fname}")

        print()
        _hr()
        print(f"    [A]       Activate ALL  ({new_count} inactive)")
        print(f"    [number]  Toggle active / inactive")
        print(f"    [B]       Back to main menu")
        _hr()
        print()
        cmd = input("  Choice: ").strip().upper()

        if cmd in ('B', ''):
            return

        elif cmd == 'A':
            added = 0
            for p in disk:
                if p not in active:
                    manifest["images"].append(p)
                    print(f"  + {p}")
                    added += 1
            if added:
                save_manifest(manifest)
            else:
                print("  All images already active.")
            _pause()

        else:
            try:
                idx = int(cmd) - 1
                if not (0 <= idx < len(disk)):
                    raise ValueError
                chosen = disk[idx]
                if chosen in active:
                    manifest["images"].remove(chosen)
                    print(f"  - Deactivated: {chosen}")
                else:
                    manifest["images"].append(chosen)
                    print(f"  + Activated:   {chosen}")
                save_manifest(manifest)
            except ValueError:
                print("  Invalid choice.")
            _pause()

# ══════════════════════════════════════════════════════════════
#  MENU: SONGS
# ══════════════════════════════════════════════════════════════

def _read_beatdrop(song_path):
    txt = os.path.join(BASE, os.path.dirname(song_path), "beatdrop.txt")
    if os.path.exists(txt):
        try:
            return float(open(txt).read().strip()), txt
        except Exception:
            pass
    return None, txt

def _write_beatdrop(txt_path, t):
    with open(txt_path, "w") as f:
        f.write(str(t) + "\n")

def _ask_beatdrop(current=None):
    hint = f" [{current}]" if current is not None else " [5.0]"
    raw  = input(f"  Beat-drop time in seconds{hint}: ").strip()
    if not raw:
        return current if current is not None else 5.0
    try:
        return float(raw)
    except ValueError:
        print("  Invalid — using 5.0")
        return 5.0

def menu_songs():
    while True:
        _banner("SONGS")
        os.makedirs(SONGS_DIR, exist_ok=True)

        found = []
        for root, _, files in os.walk(SONGS_DIR):
            for f in files:
                if os.path.splitext(f)[1].lower() in AUDIO_EXTS:
                    rel = os.path.relpath(
                        os.path.join(root, f), BASE
                    ).replace("\\", "/")
                    found.append(rel)
        found.sort()

        manifest   = load_manifest()
        in_manifest = {s["file"]: s["beatdrop"] for s in manifest.get("songs", [])}
        new_count  = sum(1 for f in found if f not in in_manifest)

        if not found:
            print("  No audio files found in songs/ subfolders.\n")
            print("  ► Create a folder:   songs/my_song_name/")
            print("  ► Put the .mp3 file inside it")
            print("  ► Optionally create beatdrop.txt with the")
            print("    beat-drop time in seconds (e.g.  5.2)")
            print()
            _pause("  Press Enter to go back...")
            return

        _section("Songs found in songs/")
        for i, path in enumerate(found):
            if path in in_manifest:
                drop   = in_manifest[path]
                status = f"✓ {drop}s"
            else:
                status = "  inactive"
            fname = os.path.basename(path)
            folder = os.path.dirname(path).replace("songs/", "")
            print(f"    [{i+1:2}]  [{status:12}]  {fname}")
            print(f"              folder: {folder}")
            print()

        _hr()
        print(f"    [A]       Add / update ALL songs  ({new_count} inactive)")
        print(f"    [number]  Edit beat-drop for one song")
        print(f"    [R]       Remove a song from manifest")
        print(f"    [B]       Back to main menu")
        _hr()
        print()
        cmd = input("  Choice: ").strip().upper()

        if cmd in ('B', ''):
            return

        elif cmd == 'A':
            print()
            for path in found:
                print(f"  ► {os.path.basename(path)}")
                suggested, txt_path = _read_beatdrop(path)
                if suggested is not None:
                    print(f"    beatdrop.txt → {suggested}s  (auto-using)")
                    beat = suggested
                else:
                    beat = _ask_beatdrop()
                _write_beatdrop(txt_path, beat)
                songs = [s for s in manifest.get("songs", []) if s["file"] != path]
                songs.append({"file": path, "beatdrop": beat})
                manifest["songs"] = songs
                print(f"    ✓ {beat}s\n")
            save_manifest(manifest)
            _pause()

        elif cmd == 'R':
            songs = manifest.get("songs", [])
            if not songs:
                print("  No songs in manifest.")
                _pause()
                continue
            _section("Songs in manifest")
            for i, s in enumerate(songs):
                print(f"    [{i+1}]  {s['file']}  ({s['beatdrop']}s)")
            print()
            num = input("  Number to remove (Enter to cancel): ").strip()
            if num:
                try:
                    removed = songs.pop(int(num) - 1)
                    manifest["songs"] = songs
                    save_manifest(manifest)
                    print(f"  - Removed: {removed['file']}")
                except (ValueError, IndexError):
                    print("  Invalid.")
            _pause()

        else:
            try:
                idx = int(cmd) - 1
                if not (0 <= idx < len(found)):
                    raise ValueError
            except ValueError:
                print("  Invalid choice.")
                _pause()
                continue

            path = found[idx]
            suggested, txt_path = _read_beatdrop(path)
            current = in_manifest.get(path, suggested)
            print(f"\n  Song: {os.path.basename(path)}")
            beat = _ask_beatdrop(current)
            _write_beatdrop(txt_path, beat)
            songs = [s for s in manifest.get("songs", []) if s["file"] != path]
            songs.append({"file": path, "beatdrop": beat})
            manifest["songs"] = songs
            save_manifest(manifest)
            print(f"  ✓ Beat-drop set to {beat}s")
            _pause()

# ══════════════════════════════════════════════════════════════
#  MENU: ACHIEVEMENTS
# ══════════════════════════════════════════════════════════════

def _ach_image_list(manifest):
    imgs = list(manifest.get("images", []))
    for s in SPECIAL_IMGS:
        if s not in imgs:
            imgs.append(s)
    return imgs

def menu_achievements():
    while True:
        _banner("ACHIEVEMENTS")
        manifest = load_manifest()
        ach  = load_achievements()
        imgs = _ach_image_list(manifest)

        if not imgs:
            print("  No images in manifest yet.")
            print("  Add images first (option 1 in main menu).\n")
            _pause("  Press Enter to go back...")
            return

        _section("All achievement slots")
        for i, path in enumerate(imgs):
            cfg    = ach.get(path, {})
            name   = cfg.get("name",   "  —  (not set)")
            rarity = cfg.get("rarity", None)
            r_str  = f"{rarity} · {RARITY_PCT[rarity]}" if rarity else "—  (not set)"
            special_tag = "  ★ secret easter egg" if path in SPECIAL_IMGS else ""
            print(f"    [{i+1:2}]  {os.path.basename(path)}{special_tag}")
            print(f"           Name:    {name}")
            print(f"           Rarity:  {r_str}")
            print()

        _hr()
        print("    [number]  Edit name / rarity")
        print("    [B]       Back to main menu")
        _hr()
        print()
        cmd = input("  Choice: ").strip().upper()

        if cmd in ('B', ''):
            return

        try:
            idx = int(cmd) - 1
            if not (0 <= idx < len(imgs)):
                raise ValueError
        except ValueError:
            print("  Invalid choice.")
            _pause()
            continue

        path = imgs[idx]
        cfg  = dict(ach.get(path, {}))

        # ── Edit sub-menu ───────────────────────────────────────
        while True:
            print()
            print(f"  ┌─ Editing: {os.path.basename(path)}")
            print(f"  │  Name:    {cfg.get('name', '—')}")
            print(f"  │  Rarity:  {cfg.get('rarity', '—')}")
            print(f"  └{'─'*40}")
            print()
            print("    [1]  Change name")
            print("    [2]  Change rarity")
            print("    [B]  Back")
            print()
            sub = input("  Choice: ").strip().upper()

            if sub in ('B', ''):
                break

            elif sub == '1':
                current = cfg.get('name', '')
                hint    = f" [{current}]" if current else ""
                new_name = input(f"  New name{hint}: ").strip()
                if new_name:
                    cfg["name"] = new_name
                    ach[path]   = cfg
                    save_achievements(ach)
                    print(f"  ✓ Name set to: {new_name}")
                _pause()

            elif sub == '2':
                print()
                for j, r in enumerate(RARITIES):
                    pct  = RARITY_PCT[r]
                    mark = "  ◄ current" if r == cfg.get("rarity") else ""
                    print(f"    [{j+1}]  {r:12}  {pct}{mark}")
                print()
                r_in = input("  Rarity number (Enter to cancel): ").strip()
                if r_in:
                    try:
                        r_idx = int(r_in) - 1
                        if not (0 <= r_idx < len(RARITIES)):
                            raise ValueError
                        cfg["rarity"] = RARITIES[r_idx]
                        ach[path]     = cfg
                        save_achievements(ach)
                        print(f"  ✓ Rarity set to: {cfg['rarity']}")
                    except ValueError:
                        print("  Invalid choice.")
                _pause()

            else:
                print("  Invalid.")
                _pause()

# ══════════════════════════════════════════════════════════════
#  MENU: SERVER
# ══════════════════════════════════════════════════════════════

def menu_server():
    _banner("SERVER")
    url = f"http://localhost:{PORT}/index.html"

    if _server_started:
        print(f"  Server is already running.\n")
        print(f"  ► {url}\n")
        print("  [1]  Open browser again")
        print("  [B]  Back")
        print()
        cmd = input("  Choice: ").strip().upper()
        if cmd == '1':
            webbrowser.open(url)
            print(f"  ✓ Browser opened")
        return

    print(f"  Starts a local HTTP server on port {PORT} and")
    print(f"  opens the calculator in your default browser.")
    print(f"  The server keeps running in the background.")
    print()
    print("  [1]  Start server")
    print("  [B]  Back")
    print()
    cmd = input("  Choice: ").strip().upper()
    if cmd == '1':
        ok = _start_server()
        if ok:
            time.sleep(0.4)
            webbrowser.open(url)
            print(f"\n  ✓ Server running  →  {url}")
            print(f"  ✓ Browser opened")
            print(f"\n  The server runs until you quit this script [Q].")
        _pause()

# ══════════════════════════════════════════════════════════════
#  MAIN LOOP
# ══════════════════════════════════════════════════════════════

def main():
    while True:
        manifest  = load_manifest()
        n_img     = len(manifest.get("images", []))
        n_song    = len(manifest.get("songs",  []))
        srv_line  = f"  server :{PORT}" if _server_started else ""
        status    = f"  {n_img} image(s)  ·  {n_song} song(s){srv_line}"

        _banner("SETUP", "Manage your calculator from one place")
        print(status)
        print()
        _hr()
        print("    [1]  Images        add / remove background images")
        print("    [2]  Songs         add / remove songs & beat-drops")
        print("    [3]  Achievements  set names & rarities")
        print("    [4]  Server        start server & open browser")
        print("    [Q]  Quit")
        _hr()
        print()

        choice = input("  Choice: ").strip().upper()

        if   choice == '1': menu_images()
        elif choice == '2': menu_songs()
        elif choice == '3': menu_achievements()
        elif choice == '4': menu_server()
        elif choice == 'Q':
            print("\n  Bye!\n")
            sys.exit(0)
        else:
            print("  Invalid choice.")
            time.sleep(0.6)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  Interrupted. Bye!\n")
        sys.exit(0)
