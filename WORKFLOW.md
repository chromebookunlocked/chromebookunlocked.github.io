# Game Upload Workflow Guide

## 🎮 How to Add/Update/Delete Games

### **Method 1: Manual Workflow (Recommended)**

This is the easiest way - just click one button to trigger the entire update and build process.

#### Steps:
1. **Add/update/delete games** in the `games/` folder
   - Each game must be in its own folder (e.g., `games/GameName/`)
   - Each folder must contain:
     - `index.html` - The game file
     - `thumbnail.png` (or `.jpg`, `.jpeg`, `.gif`) - The thumbnail image

2. **Commit and push** your changes to the `main` branch:
   ```bash
   git add games/
   git commit -m "Add new game: GameName"
   git push origin main
   ```

3. **Trigger the workflow**:
   - Go to [GitHub Actions](../../actions)
   - Click on "Manual Update & Build" workflow
   - Click "Run workflow" button
   - Click the green "Run workflow" button to confirm

4. **Wait for completion** (~2-3 minutes)
   - The workflow will:
     - ✅ Validate all game folders
     - ✅ Create/update JSON files in `data/`
     - ✅ Clean up orphaned game HTML pages
     - ✅ Build the site
     - ✅ Deploy to GitHub Pages

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

3. **Run the Manual Update workflow** (see Method 1 above)

The workflow will automatically:
- Delete the JSON file from `data/GameName.json`
- Delete the HTML page `GameName.html` from the root
- Rebuild the site without the game

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run sync-data` | Create/update/delete JSON files in `data/` based on `games/` folders |
| `npm run cleanup` | Remove orphaned game HTML pages from root directory |
| `npm run validate` | Validate all games (checks for index.html and thumbnails) |
| `npm run build` | Build the static site to `dist/` |
| `npm run update-all` | **Run all steps above in sequence** |
| `npm run dev` | Build and serve locally at http://localhost:3000 |

## 🚨 Troubleshooting

### "Game not showing on site"
- ✅ Check game folder has `index.html` and `thumbnail.*`
- ✅ Run `npm run validate` to see what's missing
- ✅ Make sure you ran the Manual Update workflow

### "Orphaned game page still exists"
- ✅ Run the Manual Update workflow again
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

- **`.github/workflows/manual-update.yml`** - Main workflow (use this!)
- **`.github/workflows/update-data.yml`** - Legacy (disabled)
- **`.github/workflows/build.yml`** - Legacy (disabled)

The old workflows are disabled by default. Only use the **Manual Update** workflow.
