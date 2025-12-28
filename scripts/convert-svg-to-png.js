#!/usr/bin/env node
/**
 * SVG to PNG Conversion Script
 *
 * Converts the brand SVG files to PNG format for use in the app.
 * Requires: sharp (npm install sharp)
 *
 * Run: node scripts/convert-svg-to-png.js
 */

const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  try {
    const sharp = require('sharp');

    const brandDir = path.join(__dirname, '../assets/brand');
    const imagesDir = path.join(__dirname, '../assets/images');

    // Ensure images directory exists
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const conversions = [
      {
        input: path.join(brandDir, 'app-icon.svg'),
        output: path.join(imagesDir, 'icon.png'),
        width: 1024,
        height: 1024,
      },
      {
        input: path.join(brandDir, 'adaptive-icon-foreground.svg'),
        output: path.join(imagesDir, 'adaptive-icon.png'),
        width: 1024,
        height: 1024,
      },
      {
        input: path.join(brandDir, 'splash-screen.svg'),
        output: path.join(imagesDir, 'splash.png'),
        width: 1284,
        height: 2778,
      },
      {
        input: path.join(brandDir, 'logo-icon.svg'),
        output: path.join(imagesDir, 'logo.png'),
        width: 512,
        height: 512,
      },
    ];

    for (const { input, output, width, height } of conversions) {
      if (fs.existsSync(input)) {
        console.log(`Converting: ${path.basename(input)} -> ${path.basename(output)}`);

        await sharp(input)
          .resize(width, height)
          .png()
          .toFile(output);

        console.log(`  Created: ${output}`);
      } else {
        console.log(`  Skipped (not found): ${input}`);
      }
    }

    console.log('\nConversion complete!');
    console.log('\nNext steps:');
    console.log('1. Update app.json to use the new assets');
    console.log('2. Run: npx expo prebuild --clean');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('Sharp is not installed. Installing now...');
      const { execSync } = require('child_process');
      execSync('pnpm add -D sharp', { stdio: 'inherit' });
      console.log('\nSharp installed. Please run this script again.');
    } else {
      console.error('Error:', error.message);
    }
  }
}

convertSvgToPng();
