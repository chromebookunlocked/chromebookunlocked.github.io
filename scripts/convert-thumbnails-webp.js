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
const MIN_VALID_SIZE = 100; // Minimum size in bytes for a valid WebP file

// Image extensions to convert (in priority order for source images)
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.bmp', '.tiff'];

function checkSharpAvailable() {
  try {
    require.resolve('sharp');
    return true;
  } catch (e) {
    return false;
  }
}

function checkImageMagickAvailable() {
  try {
    execSync('which convert', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function detectRealFormat(filePath) {
  try {
    const output = execSync(`file "${filePath}"`, { encoding: 'utf-8' });
    if (output.includes('AVIF')) return 'avif';
    if (output.includes('PNG')) return 'png';
    if (output.includes('JPEG') || output.includes('JFIF')) return 'jpeg';
    if (output.includes('GIF')) return 'gif';
    if (output.includes('WebP')) return 'webp';
    if (output.includes('BMP')) return 'bmp';
    if (output.includes('TIFF')) return 'tiff';
    return null;
  } catch (e) {
    return null;
  }
}

function convertWithImageMagick(inputPath, outputPath) {
  try {
    execSync(`convert "${inputPath}" -resize ${TARGET_SIZE}x${TARGET_SIZE}\\> -quality ${WEBP_QUALITY} "${outputPath}"`, {
      stdio: 'pipe'
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function isValidWebP(filePath, sharp) {
  try {
    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size < MIN_VALID_SIZE) {
      return false;
    }

    // Try to read the WebP file with sharp
    const metadata = await sharp(filePath).metadata();

    // Verify it's actually a WebP and has valid dimensions
    if (metadata.format !== 'webp' || !metadata.width || !metadata.height) {
      return false;
    }

    return true;
  } catch (error) {
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
  let reconverted = 0;
  let errors = 0;
  let totalSizeBefore = 0;
  let totalSizeAfter = 0;

  for (const folder of gameFolders) {
    const gamePath = path.join(GAMES_DIR, folder);
    const outputPath = path.join(gamePath, 'thumbnail.webp');

    // Find all thumbnail files (including existing WebP and source formats)
    const files = fs.readdirSync(gamePath);
    const allThumbnails = files.filter(f => {
      const basename = path.parse(f).name.toLowerCase();
      const ext = path.extname(f).toLowerCase();
      return basename === 'thumbnail' && IMAGE_EXTENSIONS.includes(ext);
    });

    if (allThumbnails.length === 0) {
      console.log(`⚠️  ${folder}: No thumbnail found`);
      skipped++;
      continue;
    }

    // Check if WebP exists and is valid
    const existingWebP = allThumbnails.find(f => f.toLowerCase() === 'thumbnail.webp');
    let needsConversion = false;
    let isReconvert = false;

    if (existingWebP) {
      const webpPath = path.join(gamePath, existingWebP);
      const isValid = await isValidWebP(webpPath, sharp);

      if (!isValid) {
        console.log(`⚠️  ${folder}: Found empty/corrupted WebP, reconverting...`);
        // Delete the invalid WebP
        fs.unlinkSync(webpPath);
        needsConversion = true;
        isReconvert = true;
      } else {
        // Valid WebP exists, check if there are source files to clean up
        const sourceFiles = allThumbnails.filter(f => f.toLowerCase() !== 'thumbnail.webp');
        if (sourceFiles.length > 0) {
          // Delete old source files
          sourceFiles.forEach(f => {
            fs.unlinkSync(path.join(gamePath, f));
            console.log(`🗑️  ${folder}: Removed old ${f} (WebP already exists)`);
          });
        }
        console.log(`✓  ${folder}: Already has valid WebP format`);
        skipped++;
        continue;
      }
    } else {
      needsConversion = true;
    }

    if (!needsConversion) {
      continue;
    }

    // Find source thumbnail (prefer non-WebP formats)
    const sourceFile = allThumbnails.find(f => {
      const ext = path.extname(f).toLowerCase();
      return ext !== '.webp';
    }) || allThumbnails[0];

    if (!sourceFile) {
      console.log(`⚠️  ${folder}: No source thumbnail found for conversion`);
      skipped++;
      continue;
    }

    const inputPath = path.join(gamePath, sourceFile);

    try {
      const stats = fs.statSync(inputPath);
      totalSizeBefore += stats.size;

      let conversionSuccess = false;
      let usedFallback = false;

      // Detect if file format mismatches extension (e.g., AVIF with .png extension)
      const realFormat = detectRealFormat(inputPath);
      const fileExt = path.extname(inputPath).toLowerCase().slice(1);
      const formatMismatch = realFormat && realFormat !== fileExt && !(realFormat === 'jpeg' && fileExt === 'jpg');

      if (formatMismatch) {
        console.log(`⚠️  ${folder}: File is actually ${realFormat.toUpperCase()}, not ${fileExt.toUpperCase()}`);
      }

      try {
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

        conversionSuccess = true;

        const newStats = fs.statSync(outputPath);
        totalSizeAfter += newStats.size;

        const sizeBefore = (stats.size / 1024).toFixed(1);
        const sizeAfter = (newStats.size / 1024).toFixed(1);
        const savings = (((stats.size - newStats.size) / stats.size) * 100).toFixed(1);

        const prefix = isReconvert ? '🔄' : '✓';
        console.log(`${prefix}  ${folder}: ${sizeBefore}KB → ${sizeAfter}KB (${savings}% smaller)`);
      } catch (sharpError) {
        // Sharp failed, try ImageMagick as fallback
        if (checkImageMagickAvailable()) {
          console.log(`⚠️  ${folder}: Sharp failed, trying ImageMagick fallback...`);
          if (convertWithImageMagick(inputPath, outputPath)) {
            conversionSuccess = true;
            usedFallback = true;

            const newStats = fs.statSync(outputPath);
            totalSizeAfter += newStats.size;

            const sizeBefore = (stats.size / 1024).toFixed(1);
            const sizeAfter = (newStats.size / 1024).toFixed(1);

            console.log(`✓  ${folder}: Converted via ImageMagick (${sizeBefore}KB → ${sizeAfter}KB)`);
          } else {
            throw new Error(`Both Sharp and ImageMagick failed: ${sharpError.message}`);
          }
        } else {
          throw sharpError;
        }
      }

      if (conversionSuccess) {
        // Delete old source thumbnail if conversion was successful
        if (sourceFile !== 'thumbnail.webp') {
          fs.unlinkSync(inputPath);
        }

        if (isReconvert) {
          reconverted++;
        } else {
          converted++;
        }
      }
    } catch (error) {
      console.error(`❌ ${folder}: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Conversion Summary:`);
  console.log(`   Converted: ${converted}`);
  console.log(`   Reconverted (from corrupted): ${reconverted}`);
  console.log(`   Skipped (already valid): ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total size before: ${(totalSizeBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total size after: ${(totalSizeAfter / 1024 / 1024).toFixed(2)} MB`);
  if (totalSizeBefore > 0) {
    const totalSavings = (((totalSizeBefore - totalSizeAfter) / totalSizeBefore) * 100).toFixed(1);
    console.log(`   Total savings: ${totalSavings}%`);
  }
  console.log('='.repeat(60));
}

function isValidWebPBasic(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size >= MIN_VALID_SIZE;
  } catch (error) {
    return false;
  }
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
  let reconverted = 0;
  let skipped = 0;
  let errors = 0;

  for (const folder of gameFolders) {
    const gamePath = path.join(GAMES_DIR, folder);
    const outputPath = path.join(gamePath, 'thumbnail.webp');

    // Find all thumbnail files
    const files = fs.readdirSync(gamePath);
    const allThumbnails = files.filter(f => {
      const basename = path.parse(f).name.toLowerCase();
      const ext = path.extname(f).toLowerCase();
      return basename === 'thumbnail' && IMAGE_EXTENSIONS.includes(ext);
    });

    if (allThumbnails.length === 0) {
      console.log(`⚠️  ${folder}: No thumbnail found`);
      skipped++;
      continue;
    }

    // Check if WebP exists and is valid
    const existingWebP = allThumbnails.find(f => f.toLowerCase() === 'thumbnail.webp');
    let needsConversion = false;
    let isReconvert = false;

    if (existingWebP) {
      const webpPath = path.join(gamePath, existingWebP);
      if (!isValidWebPBasic(webpPath)) {
        console.log(`⚠️  ${folder}: Found empty WebP, reconverting...`);
        fs.unlinkSync(webpPath);
        needsConversion = true;
        isReconvert = true;
      } else {
        // Valid WebP exists, clean up source files
        const sourceFiles = allThumbnails.filter(f => f.toLowerCase() !== 'thumbnail.webp');
        if (sourceFiles.length > 0) {
          sourceFiles.forEach(f => {
            fs.unlinkSync(path.join(gamePath, f));
            console.log(`🗑️  ${folder}: Removed old ${f}`);
          });
        }
        console.log(`✓  ${folder}: Already in WebP format`);
        skipped++;
        continue;
      }
    } else {
      needsConversion = true;
    }

    if (!needsConversion) {
      continue;
    }

    // Find source thumbnail
    const sourceFile = allThumbnails.find(f => {
      const ext = path.extname(f).toLowerCase();
      return ext !== '.webp';
    }) || allThumbnails[0];

    if (!sourceFile) {
      console.log(`⚠️  ${folder}: No source thumbnail found`);
      skipped++;
      continue;
    }

    const inputPath = path.join(gamePath, sourceFile);

    try {
      let conversionSuccess = false;

      // Detect if file format mismatches extension
      const realFormat = detectRealFormat(inputPath);
      const fileExt = path.extname(inputPath).toLowerCase().slice(1);
      const formatMismatch = realFormat && realFormat !== fileExt && !(realFormat === 'jpeg' && fileExt === 'jpg');

      if (formatMismatch) {
        console.log(`⚠️  ${folder}: File is actually ${realFormat.toUpperCase()}, not ${fileExt.toUpperCase()}`);
      }

      try {
        // Use cwebp to convert
        execSync(`cwebp -q ${WEBP_QUALITY} -resize ${TARGET_SIZE} ${TARGET_SIZE} "${inputPath}" -o "${outputPath}"`, {
          stdio: 'pipe'
        });
        conversionSuccess = true;

        const prefix = isReconvert ? '🔄' : '✓';
        console.log(`${prefix}  ${folder}: Converted to WebP`);
      } catch (cwebpError) {
        // cwebp failed, try ImageMagick as fallback
        if (checkImageMagickAvailable()) {
          console.log(`⚠️  ${folder}: cwebp failed, trying ImageMagick fallback...`);
          if (convertWithImageMagick(inputPath, outputPath)) {
            conversionSuccess = true;
            console.log(`✓  ${folder}: Converted via ImageMagick`);
          } else {
            throw new Error(`Both cwebp and ImageMagick failed`);
          }
        } else {
          throw cwebpError;
        }
      }

      if (conversionSuccess) {
        // Delete old source thumbnail
        if (sourceFile !== 'thumbnail.webp') {
          fs.unlinkSync(inputPath);
        }

        if (isReconvert) {
          reconverted++;
        } else {
          converted++;
        }
      }
    } catch (error) {
      console.error(`❌ ${folder}: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Conversion Summary:`);
  console.log(`   Converted: ${converted}`);
  console.log(`   Reconverted (from corrupted): ${reconverted}`);
  console.log(`   Skipped (already valid): ${skipped}`);
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
