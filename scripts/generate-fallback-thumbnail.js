const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const assetsDir = path.join(__dirname, "..", "assets");
const logoPath = path.join(assetsDir, "logo.png");
const outputPath = path.join(assetsDir, "fallback-thumbnail.webp");

// Pink background color (matching the site's accent colors)
const PINK_BG = { r: 77, g: 0, b: 102, alpha: 1 }; // #4d0066 - card background color

async function generateFallbackThumbnail() {
  console.log("Generating fallback thumbnail...");

  // Check if logo exists
  if (!fs.existsSync(logoPath)) {
    console.error("Logo file not found:", logoPath);
    process.exit(1);
  }

  try {
    // Get logo dimensions
    const logoMeta = await sharp(logoPath).metadata();

    // Create a 300x300 pink background with the logo centered
    const size = 300;
    const logoSize = Math.min(size * 0.5, logoMeta.width, logoMeta.height); // Logo takes 50% of the space

    // Resize and process logo
    const resizedLogo = await sharp(logoPath)
      .resize(Math.round(logoSize), Math.round(logoSize), {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Create the final image
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: PINK_BG
      }
    })
      .composite([
        {
          input: resizedLogo,
          gravity: "center"
        }
      ])
      .webp({ quality: 80 })
      .toFile(outputPath);

    console.log("Fallback thumbnail created:", outputPath);

    // Verify the file
    const stats = fs.statSync(outputPath);
    console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
  } catch (error) {
    console.error("Error generating fallback thumbnail:", error);
    process.exit(1);
  }
}

generateFallbackThumbnail();
