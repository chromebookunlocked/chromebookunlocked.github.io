# Thumbnail Optimization Tools

This directory contains tools to optimize game thumbnails for better web performance.

## 🚀 Quick Start

### Option 1: GitHub Actions (Recommended)

The easiest way is to use GitHub Actions:

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Optimize Game Thumbnails** workflow
4. Click **Run workflow**
5. Configure options (or use defaults):
   - Max width: `600` (pixels)
   - Quality: `85` (1-100, higher = better quality)
   - Format: `webp` (webp, jpg, or png)
6. Click **Run workflow**

The workflow will automatically:
- ✅ Convert all thumbnails to the specified format
- ✅ Resize to maximum width while maintaining aspect ratio
- ✅ Optimize file size
- ✅ Commit and push changes
- ✅ Show detailed statistics

### Option 2: Local Script

Run the optimization locally on your machine:

```bash
# Basic usage (defaults: 600px, 85% quality, webp format)
./scripts/optimize-thumbnails.sh

# Custom settings
./scripts/optimize-thumbnails.sh 800 90 webp

# Arguments: [max_width] [quality] [format]
```

**Requirements:**
- **macOS:**
  ```bash
  brew install webp imagemagick
  ```

- **Ubuntu/Debian:**
  ```bash
  sudo apt-get install webp imagemagick optipng jpegoptim
  ```

- **Windows:**
  - Download [WebP tools](https://developers.google.com/speed/webp/download)
  - Download [ImageMagick](https://imagemagick.org/script/download.php)

## 📋 Available Tools

### 1. optimize-thumbnails.sh

Bash script to convert and optimize thumbnails locally.

**Usage:**
```bash
./scripts/optimize-thumbnails.sh [max_width] [quality] [format]
```

**Examples:**
```bash
# Convert all thumbnails to WebP (600px max width, 85% quality)
./scripts/optimize-thumbnails.sh

# Convert to WebP with higher quality
./scripts/optimize-thumbnails.sh 800 95 webp

# Convert to optimized JPG
./scripts/optimize-thumbnails.sh 600 80 jpg

# Convert to optimized PNG
./scripts/optimize-thumbnails.sh 600 0 png
```

**Features:**
- ✅ Converts PNG/JPG/GIF to WebP (or other formats)
- ✅ Resizes to max width while maintaining aspect ratio
- ✅ Shows detailed progress and statistics
- ✅ Calculates total space saved
- ✅ Colored output for easy reading

### 2. update-thumbnail-references.py

Python script to update HTML file references from old format to new format.

**Usage:**
```bash
# Dry run (see what would change)
python3 scripts/update-thumbnail-references.py --dry-run

# Update all references to WebP
python3 scripts/update-thumbnail-references.py

# Update to different format
python3 scripts/update-thumbnail-references.py --format jpg
```

**Features:**
- ✅ Updates all `thumbnail.png/jpg/jpeg/gif` references
- ✅ Processes all HTML files in the project
- ✅ Dry run mode to preview changes
- ✅ Detailed statistics and progress

### 3. GitHub Actions Workflow

Automated workflow that runs in the cloud.

**Location:** `.github/workflows/optimize-thumbnails.yml`

**Triggers:**
- ✅ Manual trigger (workflow_dispatch)
- ✅ Automatic trigger when thumbnails are added/modified

**Features:**
- ✅ No local tools required
- ✅ Runs on GitHub's servers
- ✅ Automatic commit and push
- ✅ Detailed logs and statistics
- ✅ Configurable options

## 🎯 Recommended Workflow

**For best results, follow this workflow:**

1. **Add new games** with any thumbnail format (PNG, JPG, etc.)

2. **Run optimization** (choose one):
   - GitHub Actions (recommended for beginners)
   - Local script (recommended for developers)

3. **Update HTML references** (if needed):
   ```bash
   # Preview changes
   python3 scripts/update-thumbnail-references.py --dry-run

   # Apply changes
   python3 scripts/update-thumbnail-references.py
   ```

4. **Test locally** to ensure images display correctly

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "Optimize thumbnails for better performance"
   git push
   ```

## 📊 Expected Results

**Before optimization:**
- Average thumbnail size: ~500KB
- Largest thumbnails: 1.2MB
- Total thumbnails size: ~60MB

**After optimization (WebP, 600px, 85%):**
- Average thumbnail size: ~150KB (70% reduction)
- Largest thumbnails: ~300KB (75% reduction)
- Total thumbnails size: ~18MB (70% reduction)

**Performance impact:**
- ✅ **LCP improvement:** ~1-2 seconds faster
- ✅ **Bandwidth saved:** ~42MB per full site load
- ✅ **PageSpeed score:** +10-15 points
- ✅ **Mobile performance:** Significantly improved

## 🎨 Format Comparison

| Format | Quality | Size | Browser Support | Best For |
|--------|---------|------|-----------------|----------|
| **WebP** | Excellent | Smallest | 95%+ (modern) | Recommended - best balance |
| **JPG** | Good | Medium | 100% | Maximum compatibility |
| **PNG** | Excellent | Large | 100% | Transparency needed |

## 🔧 Configuration Options

### Max Width
- **400px:** Mobile-optimized, smallest size
- **600px:** ✅ Recommended - good balance
- **800px:** High quality, larger size

### Quality (WebP/JPG)
- **70-80:** Smaller files, slight quality loss
- **85:** ✅ Recommended - best balance
- **90-95:** High quality, larger files

### Format
- **webp:** ✅ Recommended - best compression
- **jpg:** Good compatibility, lossy
- **png:** Lossless, larger files

## 🐛 Troubleshooting

### "cwebp: command not found"
Install WebP tools:
```bash
# macOS
brew install webp

# Ubuntu/Debian
sudo apt-get install webp
```

### "convert: command not found"
Install ImageMagick:
```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick
```

### Images not displaying after optimization
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check console for errors (F12)
3. Verify file paths are correct
4. Run update-thumbnail-references.py to fix HTML references

### GitHub Actions fails
1. Check workflow logs in Actions tab
2. Ensure repository has write permissions
3. Try running locally first to identify issues

## 💡 Tips

1. **Always test locally first** before pushing to production
2. **Use dry-run mode** when testing scripts
3. **Backup originals** if you're unsure (Git has you covered!)
4. **Monitor file sizes** - aim for <200KB per thumbnail
5. **Check browser support** if using WebP (95%+ modern browsers)

## 🤝 Contributing

Found a bug or have a suggestion? Feel free to:
1. Open an issue
2. Submit a pull request
3. Update these scripts to fit your needs

## 📚 Additional Resources

- [WebP Documentation](https://developers.google.com/speed/webp)
- [ImageMagick Documentation](https://imagemagick.org/)
- [Web Performance Optimization](https://web.dev/fast/)
- [Core Web Vitals](https://web.dev/vitals/)
