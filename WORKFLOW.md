# Game Upload Workflow Guide

## 🎮 How to Add/Update/Delete Games

### **Method 1: One-command add (Recommended)**

The `add-game` script does everything at once: creates the game folder,
downloads/copies the HTML, screenshots a thumbnail, suggests tags, and
writes the metadata JSON.

```bash
# From a URL (e.g. a raw.githubusercontent.com link)
npm run add-game -- --name "Cool Game" --url "https://example.com/game.html"

# From a local HTML file
npm run add-game -- --name "Cool Game" --file ./cool-game.html

# Override the auto-suggested tags / thumbnail if you want
npm run add-game -- --name "Cool Game" --file game.html \
  --tags "Action, Racing" --thumbnail ./cover.png
```

Then just commit and push — **the site rebuilds automatically on every
push to `main`** that touches `games/` or `data/` (no manual workflow
trigger needed anymore):

```bash
git add games/ data/
git commit -m "Add new game: Cool Game"
git push origin main
```

> One-time setup for the screenshot thumbnails:
> `npm install --no-save playwright && npx playwright install chromium`

### **Method 1b: Add a game from your phone (GitHub Action)**

No local checkout needed:

1. Go to [GitHub Actions](../../actions) → **Add Game** → "Run workflow"
2. Fill in the game name and the URL of the game HTML file
   (tags and thumbnail are optional — they're auto-generated)
3. The workflow commits the game to `main` and rebuilds the site

### **Method 2: Local Development**

For testing locally before pushing to GitHub:

```bash
# Install dependencies (first time only)
npm install

# Run the complete update process
npm run update-all

# This runs:
# 1. npm run sync-data     - Updates data/*.json files
# 2. npm run cleanup       - Removes orphaned HTML pages
# 3. npm run validate      - Validates all games
# 4. npm run build         - Builds the site to dist/

# Test locally
npm run dev
# Open http://localhost:3000
```

## 📁 Game Folder Requirements

Each game folder in `games/` **MUST** have:

### ✅ Required Files:
1. **`index.html`** - The main game file
   - Must not be empty (size > 0 bytes)
   - Must be a valid HTML file

2. **Thumbnail** - One of these filenames:
   - `thumbnail.png`
   - `thumbnail.jpg`
   - `thumbnail.jpeg`
   - `thumbnail.gif`
   - Must not be empty (size > 0 bytes)
   - Recommended size: < 500 KB

### ❌ Common Mistakes:
- ❌ Missing `index.html` file
- ❌ Missing thumbnail image
- ❌ Empty files (0 bytes)
- ❌ Wrong thumbnail filename (must be exactly "thumbnail")

### Example Folder Structure:
```
games/
├── 2048/
│   ├── index.html          ✅
│   ├── thumbnail.png       ✅
│   └── assets/            (optional)
│       └── game-files...
├── Minecraft/
│   ├── index.html          ✅
│   ├── thumbnail.jpg       ✅
│   └── ...
```

## 🗑️ Deleting Games

To delete a game:

1. **Delete the game folder** from `games/`
   ```bash
   rm -rf "games/GameName"
   ```

2. **Commit and push**:
   ```bash
   git add games/
   git commit -m "Remove game: GameName"
   git push origin main
   ```

The build workflow runs automatically on push and will:
- Delete the JSON file from `data/GameName.json`
- Delete the HTML page `GameName.html` from the root
- Rebuild the site without the game

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run add-game` | **Add a game in one command** (folder + HTML + thumbnail + tags + JSON) |
| `npm run screenshot` | Generate thumbnails by screenshotting games (`--missing`, `--force`, `--click`) |
| `npm run health-check` | Check that the external CDN assets games depend on are still alive |
| `npm run normalize-tags` | Fix tag typos/duplicates against the `tags.json` vocabulary |
| `npm run import-analytics` | Turn a Google Analytics CSV export into `popularity.json` (drives site order) |
| `npm run drive-diff` | List the Google Drive folder and show which games are new vs. on-site/rejected |
| `npm run sync-data` | Create/update/delete JSON files in `data/` based on `games/` folders |
| `npm run cleanup` | Remove orphaned game HTML pages from root directory |
| `npm run validate` | Validate all games (checks for index.html, thumbnails, tags) |
| `npm run build` | Build the static site to `dist/` |
| `npm run update-all` | **Run all steps above in sequence** |
| `npm run dev` | Build and serve locally at http://localhost:3000 |

## 🏷️ Tags

The canonical tag vocabulary lives in **`tags.json`** at the repo root:

- `tags` — the allowed category list (validation warns on anything else)
- `aliases` — maps typos/variants to canonical tags (e.g. `Rougelike` → `Roguelike`)
- `keywords` — name keywords used to auto-suggest tags for new games

To add a brand-new category, add it to `tags` first. If validation warns
about a typo, run `npm run normalize-tags` to fix all data files at once.

## 🔥 Popularity ordering (from Google Analytics)

The home grid order and the "Trending Games" tag are driven by real view
counts instead of manual edits:

1. In GA4: **Reports → Engagement → Pages and screens → Export → CSV**
2. Run: `npm run import-analytics -- path/to/export.csv`
   (writes `popularity.json` — game pages are matched by their
   `/GameName.html` paths, other pages are ignored)
3. Commit and push `popularity.json` — the site rebuilds automatically

What the build does with it:

- **Home grid**: manually pinned games (`priority` in the data JSON)
  first, then all games **sorted by views**, then a daily shuffle of
  games without view data
- **Trending Games**: the top 15 most-viewed games get the tag
  automatically, and a 🔥 "Trending Games" entry appears in the sidebar

Repeat whenever you want to refresh the order (monthly is plenty). Games
with a manual `priority` always stay on top — remove the `priority` field
from a game's JSON if you'd rather let analytics decide.

## 📂 Google Drive intake

Compare the shared Drive folder of candidate games against the site:

```bash
# First run: pass the folder link (it's remembered afterwards)
npm run drive-diff -- "https://drive.google.com/drive/folders/<FOLDER_ID>"

# Later runs
npm run drive-diff

# Mark bad/old games so they're never suggested again
npm run drive-diff -- --reject "Some Old Game" "Broken Game"
```

The script lists what's in Drive and splits it into: already on site,
rejected earlier, and **new candidates to review**. Add the good ones with
`npm run add-game`; reject the rest once and they stay hidden forever.
The folder must be shared as "anyone with the link". State lives in
`drive-ignore.json` (commit it so rejections stick).

## 🩺 Game Health (automatic)

Games are thin HTML wrappers around CDN-hosted assets, so they break when
the source CDN/repo disappears. The **Game Health Check** workflow runs
every Monday, verifies every game's external asset URLs, and keeps a
single "🩺 Game health report" issue up to date:

- Broken games → the issue lists them with the dead URLs
- Everything healthy → the issue is closed automatically

You can also run it anytime: `npm run health-check` (or trigger the
workflow manually in the Actions tab).

## 📸 Thumbnails (automatic)

No more hunting for images online — thumbnails are generated by loading
the game in a headless browser and screenshotting it:

```bash
npm run screenshot -- --missing        # all games without a thumbnail
npm run screenshot -- --force "Slope"  # regenerate one game
npm run screenshot -- --click "OvO"    # click to start the game first
```

Output is a 300×300 `thumbnail.webp` in the game folder. Blank frames
(game didn't render) are rejected automatically, and the site falls back
to the default thumbnail until you retry.

## 🚨 Troubleshooting

### "Game not showing on site"
- ✅ Check game folder has `index.html` and `thumbnail.*`
- ✅ Run `npm run validate` to see what's missing
- ✅ Check the "Update & Build" workflow ran for your push in the Actions tab

### "Orphaned game page still exists"
- ✅ Trigger the "Update & Build" workflow manually in the Actions tab
- ✅ Or run locally: `npm run cleanup`

### "Workflow failed"
- ✅ Check the workflow logs in GitHub Actions
- ✅ Run `npm run validate` locally to see errors
- ✅ Fix the issues and run the workflow again

## 📊 What Happens During Update

```
┌─────────────────────────────────────┐
│  1. Scan games/ folder              │
│     - Find all game folders         │
│     - Validate index.html exists    │
│     - Validate thumbnail exists     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Update data/*.json files        │
│     - Create JSON for new games     │
│     - Delete JSON for removed games │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Cleanup orphaned HTML pages     │
│     - Find *.html in root           │
│     - Delete if no matching JSON    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Validate all games              │
│     - Check folder structure        │
│     - Check file sizes              │
│     - Check categories              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Build static site               │
│     - Generate index.html           │
│     - Generate game pages           │
│     - Generate sitemap.xml          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. Deploy to GitHub Pages          │
│     - Push to gh-pages branch       │
│     - Site live in ~1 minute        │
└─────────────────────────────────────┘
```

## 🔄 Workflow Files

- **`.github/workflows/manual-update.yml`** - Main build & deploy. Runs
  **automatically on every push to `main`** that touches `games/`, `data/`,
  `templates/`, `src/`, `assets/`, `generate.js`, `ads-config.json` or
  `tags.json`. Can still be triggered manually as a fallback.
- **`.github/workflows/add-game.yml`** - Add a game from the Actions tab
  (works from a phone), then rebuilds the site.
- **`.github/workflows/health-check.yml`** - Weekly link-rot check that
  maintains the "🩺 Game health report" issue.
- **`.github/workflows/update-data.yml`** - Legacy (disabled)
- **`.github/workflows/build.yml`** - Legacy (disabled)
