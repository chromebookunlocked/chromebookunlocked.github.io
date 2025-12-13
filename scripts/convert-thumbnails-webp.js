const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Convert all game thumbnails to WebP format with optimized resolution
 * Target resolution: 300x300 (based on typical display size in UI)
 * Quality: 80 (good balance between size and quality)
 */

const GAMES_DIR = path.join(__dirname, '..', 'games');
const TARGET_SIZE = 300; // Max width/height for thumbnails
const WEBP_QUALITY = 80;

// Image extensions to convert
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif'];

function checkSharpAvailable() {
  try {
    require.resolve('sharp');
    return true;
  } catch (e) {
    return false;
  }
}

async function convertWithSharp() {
  const sharp = require('sharp');

  console.log('🔍 Scanning games directory for thumbnails...\n');

  const gameFolders = fs.readdirSync(GAMES_DIR)
    .filter(f => fs.statSync(path.join(GAMES_DIR, f)).isDirectory());

  let converted = 0;
  let skipped = 0;
  let errors = 0;
  let totalSizeBefore = 0;
  let totalSizeAfter = 0;

  for (const folder of gameFolders) {
    const gamePath = path.join(GAMES_DIR, folder);

    // Find thumbnail file (any supported format)
    const files = fs.readdirSync(gamePath);
    const thumbnailFile = files.find(f => {
      const basename = path.parse(f).name.toLowerCase();
      const ext = path.extname(f).toLowerCase();
      return basename === 'thumbnail' && IMAGE_EXTENSIONS.includes(ext);
    });

    if (!thumbnailFile) {
      console.log(`⚠️  ${folder}: No thumbnail found`);
      skipped++;
      continue;
    }

    const inputPath = path.join(gamePath, thumbnailFile);
    const outputPath = path.join(gamePath, 'thumbnail.webp');

    // Skip if already webp and correctly named
    if (thumbnailFile === 'thumbnail.webp') {
      console.log(`✓  ${folder}: Already in WebP format`);
      skipped++;
      continue;
    }

    try {
      const stats = fs.statSync(inputPath);
      totalSizeBefore += stats.size;

      // Get image metadata
      const metadata = await sharp(inputPath).metadata();

      // Convert to WebP with resize if needed
      let pipeline = sharp(inputPath);

      // Resize if image is larger than target size
      if (metadata.width > TARGET_SIZE || metadata.height > TARGET_SIZE) {
        pipeline = pipeline.resize(TARGET_SIZE, TARGET_SIZE, {
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true
        });
      }

      // Convert to WebP
      await pipeline
        .webp({ quality: WEBP_QUALITY })
        .toFile(outputPath);

      const newStats = fs.statSync(outputPath);
      totalSizeAfter += newStats.size;

      const sizeBefore = (stats.size / 1024).toFixed(1);
      const sizeAfter = (newStats.size / 1024).toFixed(1);
      const savings = (((stats.size - newStats.size) / stats.size) * 100).toFixed(1);

      console.log(`✓  ${folder}: ${sizeBefore}KB → ${sizeAfter}KB (${savings}% smaller) [${metadata.width}×${metadata.height}]`);

      // Delete old thumbnail if conversion was successful
      if (thumbnailFile !== 'thumbnail.webp') {
        fs.unlinkSync(inputPath);
      }

      converted++;
    } catch (error) {
      console.error(`❌ ${folder}: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Conversion Summary:`);
  console.log(`   Converted: ${converted}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total size before: ${(totalSizeBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total size after: ${(totalSizeAfter / 1024 / 1024).toFixed(2)} MB`);
  if (totalSizeBefore > 0) {
    const totalSavings = (((totalSizeBefore - totalSizeAfter) / totalSizeBefore) * 100).toFixed(1);
    console.log(`   Total savings: ${totalSavings}%`);
  }
  console.log('='.repeat(60));
}

function convertWithCwebp() {
  console.log('📦 Using cwebp for conversion (sharp not available)...\n');

  // Check if cwebp is available
  try {
    execSync('which cwebp', { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ Error: Neither sharp nor cwebp is available.');
    console.error('   Please install sharp: npm install sharp');
    console.error('   Or install cwebp: apt-get install webp (Linux) / brew install webp (Mac)');
    process.exit(1);
  }

  console.log('🔍 Scanning games directory for thumbnails...\n');

  const gameFolders = fs.readdirSync(GAMES_DIR)
    .filter(f => fs.statSync(path.join(GAMES_DIR, f)).isDirectory());

  let converted = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of gameFolders) {
    const gamePath = path.join(GAMES_DIR, folder);

    // Find thumbnail file
    const files = fs.readdirSync(gamePath);
    const thumbnailFile = files.find(f => {
      const basename = path.parse(f).name.toLowerCase();
      const ext = path.extname(f).toLowerCase();
      return basename === 'thumbnail' && IMAGE_EXTENSIONS.includes(ext);
    });

    if (!thumbnailFile) {
      console.log(`⚠️  ${folder}: No thumbnail found`);
      skipped++;
      continue;
    }

    const inputPath = path.join(gamePath, thumbnailFile);
    const outputPath = path.join(gamePath, 'thumbnail.webp');

    if (thumbnailFile === 'thumbnail.webp') {
      console.log(`✓  ${folder}: Already in WebP format`);
      skipped++;
      continue;
    }

    try {
      // Use cwebp to convert
      execSync(`cwebp -q ${WEBP_QUALITY} -resize ${TARGET_SIZE} ${TARGET_SIZE} "${inputPath}" -o "${outputPath}"`, {
        stdio: 'pipe'
      });

      console.log(`✓  ${folder}: Converted to WebP`);

      // Delete old thumbnail
      fs.unlinkSync(inputPath);
      converted++;
    } catch (error) {
      console.error(`❌ ${folder}: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Conversion Summary:`);
  console.log(`   Converted: ${converted}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log('='.repeat(60));
}

// Main execution
(async () => {
  console.log('🎮 Starting thumbnail conversion to WebP format\n');
  console.log(`Target size: ${TARGET_SIZE}×${TARGET_SIZE} pixels`);
  console.log(`WebP quality: ${WEBP_QUALITY}\n`);

  if (checkSharpAvailable()) {
    await convertWithSharp();
  } else {
    convertWithCwebp();
  }

  console.log('\n✅ Conversion complete!');
  console.log('💡 Don\'t forget to update game JSON files if they reference old thumbnail names.');
})();
