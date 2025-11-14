# 🎮 Chromebook Unlocked Games

A static website hosting 90+ free unblocked browser games, optimized for school Chromebooks and accessible anywhere. Built with pure vanilla JavaScript and automated with GitHub Actions.

**Live Site:** [chromebookunlocked.github.io](https://chromebookunlocked.github.io)

---

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Adding a New Game](#adding-a-new-game)
- [Building the Site](#building-the-site)
- [How It Works](#how-it-works)
- [SEO Optimization](#seo-optimization)
- [Contributing](#contributing)

---

## ✨ Features

- **90+ Games**: Wide variety of categories including Action, Puzzle, Horror, Shooter, and more
- **SEO Optimized**: Individual pages for each game with proper meta tags and structured data
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Search & Filter**: Real-time search with category filtering
- **Recently Played**: LocalStorage-based history tracking
- **Smart Recommendations**: "You Might Also Like" feature shows 7 rows of related games
- **Full-Screen Support**: Every game can be played in fullscreen mode
- **No Dependencies**: Pure vanilla JavaScript - no frameworks required
- **Automated Deployment**: GitHub Actions automatically builds and deploys on push
- **Auto-Generated Sitemap**: Complete sitemap with 93+ URLs for SEO

---

## 📁 Project Structure

```
chromebookunlocked.github.io/
├── .github/
│   └── workflows/
│       ├── build.yml          # Build and deploy workflow
│       └── update-data.yml    # Auto-sync game metadata
├── assets/
│   └── logo.png              # Site logo
├── data/                      # Game metadata (JSON files)
│   ├── 1v1.lol.json
│   ├── Cookie Clicker.json
│   └── ... (91 total)
├── games/                     # Game files (91 games)
│   ├── 1v1.lol/
│   │   ├── index.html
│   │   └── thumbnail.png
│   └── ...
├── scripts/
│   ├── update-data.js        # Syncs game folders → JSON metadata
│   └── cleanup-analytics.js  # Removes deprecated analytics fields
├── dist/                      # Build output (generated)
│   ├── index.html            # Main SPA
│   ├── 1v1.lol.html          # Individual game pages
│   ├── sitemap.xml           # Auto-generated sitemap
│   └── ...
├── generate.js               # Main build script (2300+ lines)
├── package.json              # NPM configuration
├── robots.txt                # SEO: allows all crawlers
├── sitemap.xml               # Generated during build
├── dmca.html                 # DMCA policy page
└── ads.txt                   # AdSense verification
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/chromebookunlocked/chromebookunlocked.github.io.git
cd chromebookunlocked.github.io

# Install dependencies (none currently, just sets up package.json)
npm install

# Build the site
npm run build
```

The built site will be in the `dist/` folder.

### Local Development

To preview the site locally after building:

```bash
# Build first
npm run build

# Serve the dist folder
npx serve dist
```

Then open `http://localhost:3000` in your browser.

---

## 🎲 Adding a New Game

### Step 1: Add Game Files

Create a new folder in `games/` with your game name:

```bash
games/
└── My Awesome Game/
    ├── index.html        # Game entry point
    └── thumbnail.png     # Game preview image (or thumbnail.jpg)
```

**Requirements:**
- Folder name will be used as the game identifier
- `index.html` must be the main game file
- Thumbnail should be PNG or JPG (recommended size: 300x200px)

### Step 2: Create Metadata (Automatic or Manual)

**Option A: Automatic** (Recommended)

The GitHub Action will automatically create the JSON file when you push:

```bash
git add games/My\ Awesome\ Game/
git commit -m "Add My Awesome Game"
git push
```

The `update-data.yml` workflow will create `data/My Awesome Game.json` automatically.

**Option B: Manual**

Create `data/My Awesome Game.json`:

```json
{
  "name": "My Awesome Game",
  "category": "Action"
}
```

**Supported Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Display name of the game |
| `category` | string | ✅ | Primary category (e.g., "Action", "Puzzle") |
| `categories` | array | ❌ | Multiple categories (e.g., ["Action", "Multiplayer"]) |
| `folder` | string | ❌ | Custom folder name (defaults to filename) |
| `thumbs` | array | ❌ | Custom thumbnail filenames (defaults to ["thumbnail.png", "thumbnail.jpg"]) |
| `dateAdded` | string | ❌ | ISO date for "Newly Added" section (e.g., "2024-11-14") |

**Example with all fields:**

```json
{
  "name": "Super Racing Game",
  "categories": ["Racing", "Action"],
  "dateAdded": "2024-11-14",
  "thumbs": ["cover.png"]
}
```

### Step 3: Build and Deploy

```bash
npm run build
```

The build script will:
- ✅ Validate your game folder and files exist
- ✅ Generate individual game page (e.g., `My Awesome Game.html`)
- ✅ Add game to main index with search/filter support
- ✅ Update sitemap.xml automatically
- ✅ Show warnings if files are missing

---

## 🔨 Building the Site

### Build Command

```bash
npm run build
```

This runs `generate.js` which:

1. **Loads Games**: Reads all JSON files from `data/`
2. **Validates**: Checks that game folders and `index.html` exist
3. **Groups by Category**: Organizes games into categories
4. **Generates Main SPA**: Creates `dist/index.html` with:
   - Search functionality
   - Category filtering
   - Recently played tracking
   - "You Might Also Like" recommendations (7 rows)
5. **Generates Individual Pages**: Creates standalone HTML pages for each game (e.g., `dist/1v1.lol.html`)
6. **Generates Sitemap**: Creates `dist/sitemap.xml` with all 93+ URLs

### Build Output

```
dist/
├── index.html              # Main single-page app
├── 1v1.lol.html           # Individual game pages (91 total)
├── Cookie Clicker.html
├── ...
├── sitemap.xml            # Auto-generated sitemap
├── games/                 # Copied game files
├── assets/                # Copied assets
└── data/                  # Copied metadata
```

---

## ⚙️ How It Works

### Architecture

**Main Page (`index.html`)**:
- Single-page application with hash-based routing
- Categories expand/collapse on sidebar
- Search bar with live filtering
- "Recently Played" section (max 25 games via LocalStorage)
- "You Might Also Like" shows 7 rows when playing a game
- Responsive grid layout (adapts to screen size)

**Individual Game Pages** (e.g., `1v1.lol.html`):
- Full standalone pages with embedded game iframe
- Complete SEO meta tags (Open Graph, Twitter Cards)
- Schema.org VideoGame structured data
- Back button to return to main site
- Fullscreen toggle button
- Purple/pink gradient theme matching main site

**Automation**:
- **build.yml**: Builds site on push to main, deploys to `gh-pages` branch
- **update-data.yml**: Auto-creates/deletes JSON files when games are added/removed

---

## 🔍 SEO Optimization

### What's Implemented

✅ **Complete Sitemap**: Auto-generated with all 93+ pages
✅ **Individual Game Pages**: Each game has its own URL and meta tags
✅ **Structured Data**: Schema.org VideoGame markup on every game page
✅ **Meta Tags**: Open Graph and Twitter Cards for social sharing
✅ **Semantic HTML**: Proper heading hierarchy and ARIA landmarks
✅ **Mobile-Friendly**: Responsive design for all devices
✅ **robots.txt**: Allows all crawlers

### SEO Benefits

- **More indexed pages**: 93+ pages vs. just homepage
- **Long-tail keywords**: Each game ranks for "[game name] unblocked"
- **Better social sharing**: Rich previews on Discord, Twitter, Facebook
- **Improved crawlability**: Sitemap helps Google discover all pages

---

## 🤝 Contributing

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b add-new-game`
3. **Add your game** following the [Adding a New Game](#adding-a-new-game) guide
4. **Test locally**: Run `npm run build` and verify in browser
5. **Commit changes**: `git commit -m "Add [Game Name]"`
6. **Push to your fork**: `git push origin add-new-game`
7. **Open a Pull Request**

### Code Style

- Use 2 spaces for indentation
- Follow existing naming conventions
- Add comments for complex logic
- Test build before submitting PR

### Categories

Current categories:
- **Action**: Fast-paced action games
- **Puzzle**: Brain teasers and logic games
- **Shooter**: First-person and third-person shooters
- **Clickers**: Idle/incremental games
- **Horror**: Scary games (FNAF, etc.)
- **Racing**: Driving and racing games
- **Adventure**: Story-driven games
- **Uncategorized**: Default for new games

---

## 📜 License

This project is open source and available for educational purposes.

**Note**: Individual games may have their own licenses. This repository only hosts the portal framework.

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/chromebookunlocked/chromebookunlocked.github.io/issues)
- **DMCA**: See [dmca.html](https://chromebookunlocked.github.io/dmca.html)

---

## 🎯 Roadmap

- [ ] Add game ratings/reviews
- [ ] Implement game search autocomplete
- [ ] Add game descriptions from metadata
- [ ] Create admin panel for easier game management
- [ ] Optimize images with WebP conversion
- [ ] Add PWA support for offline play
- [ ] Implement analytics dashboard

---

**Made with 💜 by the Chromebook Unlocked Games Team**
