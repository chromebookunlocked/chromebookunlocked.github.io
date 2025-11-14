# Contributing to Chromebook Unlocked Games

Thank you for your interest in contributing! This guide will help you add games, fix bugs, and improve the codebase.

## 🎮 Adding a New Game

### Quick Guide

1. **Create game folder** in `games/`
2. **Add game files** (`index.html` and `thumbnail.png`)
3. **Create metadata** in `data/` (or let GitHub Actions do it)
4. **Test locally** with `npm run build`
5. **Submit pull request**

### Detailed Steps

#### 1. Prepare Your Game Files

Create a new folder in `games/` with your game name:

```
games/
└── Your Game Name/
    ├── index.html        # Main game file
    └── thumbnail.png     # Preview image (300x200px recommended)
```

**Requirements:**
- `index.html` must load your game (can be iframe, canvas, or direct HTML)
- Thumbnail should be PNG or JPG, ideally under 100KB
- Game should work in modern browsers
- No external dependencies that violate licenses

#### 2. Create Metadata File

Create `data/Your Game Name.json`:

```json
{
  "name": "Your Game Name",
  "category": "Action"
}
```

**Available Categories:**
- Action
- Puzzle
- Shooter
- Clickers
- Horror
- Racing
- Adventure
- Sports
- Strategy
- Platformer
- RPG
- Simulation
- Uncategorized

**Optional Fields:**

```json
{
  "name": "Your Game Name",
  "categories": ["Action", "Multiplayer"],  // Multiple categories
  "dateAdded": "2024-11-14",                // For "Newly Added" section
  "thumbs": ["custom-thumbnail.png"]        // Custom thumbnail filename
}
```

#### 3. Validate Your Game

Run the validation script to check for issues:

```bash
npm run validate
```

This will check:
- ✅ JSON syntax is valid
- ✅ Required fields are present
- ✅ Game folder exists
- ✅ `index.html` exists and isn't empty
- ✅ Thumbnail exists
- ✅ No deprecated fields
- ✅ Categories are valid

#### 4. Test Locally

Build and preview the site:

```bash
npm run dev
```

Then open http://localhost:3000 and verify:
- Your game appears in the correct category
- Thumbnail displays correctly
- Game loads when clicked
- Fullscreen works
- "Back" button returns to game list

#### 5. Submit Pull Request

```bash
git checkout -b add-your-game-name
git add games/Your\ Game\ Name/
git add data/Your\ Game\ Name.json
git commit -m "Add Your Game Name"
git push origin add-your-game-name
```

Then open a pull request on GitHub with:
- **Title**: "Add [Game Name]"
- **Description**: Brief description of the game and category

---

## 🐛 Reporting Bugs

### Before Reporting

1. Search existing [issues](https://github.com/chromebookunlocked/chromebookunlocked.github.io/issues)
2. Test on latest version
3. Check browser console for errors

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to...
2. Click on...
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Browser: Chrome 120
- OS: ChromeOS
- Device: Chromebook

**Screenshots**
If applicable
```

---

## 💻 Code Contributions

### Development Setup

```bash
# Clone repository
git clone https://github.com/chromebookunlocked/chromebookunlocked.github.io.git
cd chromebookunlocked.github.io

# Install dev dependencies (optional, for linting)
npm install

# Validate games
npm run validate

# Build site
npm run build

# Run local dev server
npm run dev
```

### Code Style

We use ESLint and Prettier for code quality:

```bash
# Check formatting
npm run format:check

# Auto-format code
npm run format

# Lint JavaScript
npm run lint
```

**Guidelines:**
- Use 2 spaces for indentation
- Use double quotes for strings
- Add semicolons
- Comment complex logic
- Follow existing patterns

### Making Changes

1. **Create a branch**: `git checkout -b feature/your-feature`
2. **Make changes**: Edit files and test
3. **Validate**: Run `npm run validate` and `npm run build`
4. **Commit**: Use clear commit messages
5. **Push**: `git push origin feature/your-feature`
6. **Pull Request**: Open PR on GitHub

### Commit Message Format

```
Add [feature]: Brief description

Longer description if needed explaining:
- What changed
- Why it changed
- Any breaking changes
```

**Examples:**
- `Add new game: Pac-Man`
- `Fix search dropdown not closing`
- `Improve accessibility with ARIA labels`

---

## 🏗️ Project Structure

```
chromebookunlocked.github.io/
├── data/              # Game metadata (JSON)
├── games/             # Game files
├── scripts/           # Build and utility scripts
│   ├── update-data.js      # Auto-sync game metadata
│   ├── validate-games.js   # Validation script
│   └── cleanup-analytics.js
├── assets/            # Static assets (logo)
├── templates/         # CSS templates (future)
├── dist/              # Build output (gitignored)
├── generate.js        # Main build script
├── package.json       # NPM scripts
└── README.md          # Documentation
```

---

## 🧪 Testing

### Manual Testing Checklist

Before submitting PR, test:

- [ ] Site builds without errors (`npm run build`)
- [ ] Validation passes (`npm run validate`)
- [ ] Game loads correctly
- [ ] Thumbnail displays
- [ ] Search finds your game
- [ ] Category filter shows your game
- [ ] Fullscreen works
- [ ] Mobile responsive
- [ ] "You Might Also Like" shows related games

### Automated Testing

Currently no automated tests. Contributions welcome!

---

## 📝 Documentation

When making significant changes:

1. Update README.md if adding features
2. Update this CONTRIBUTING.md if changing workflow
3. Add comments to complex code
4. Document new scripts in package.json

---

## ⚖️ Legal & Licensing

### Game Licensing

- Only add games you have rights to distribute
- Include attribution if required by game license
- No pirated commercial games
- Respect DMCA requests

### Code License

This project is licensed under MIT. By contributing, you agree that your contributions will be licensed under the same.

---

## 🎯 What We're Looking For

### High Priority
- New games (properly licensed)
- Bug fixes
- Accessibility improvements
- Performance optimizations
- Mobile improvements

### Medium Priority
- New categories
- UI/UX enhancements
- Better search
- Game descriptions
- Analytics

### Lower Priority
- Theme customization
- Social features
- Leaderboards

---

## ❓ Questions?

- **General questions**: Open a [Discussion](https://github.com/chromebookunlocked/chromebookunlocked.github.io/discussions)
- **Bug reports**: Open an [Issue](https://github.com/chromebookunlocked/chromebookunlocked.github.io/issues)
- **Feature requests**: Open an [Issue](https://github.com/chromebookunlocked/chromebookunlocked.github.io/issues) with "Feature Request" label

---

## 🙏 Thank You!

Every contribution helps make this site better for students everywhere. Thank you for taking the time to contribute!
