#!/usr/bin/env node

/**
 * Build script for BoldTake extension
 * Creates a production-ready dist folder
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️  Building extension...');

const distDir = path.join(__dirname, '..', 'dist');

// Create dist directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

// Files to copy to dist
const filesToCopy = [
  'manifest.json',
  'background.js',
  'contentScript.js',
  'popup.html',
  'popup.js',
  'auth.js',
  'config.js',
  'supabase-config.js',
  'supabase.min.js',
  'icon.png',
  'logo.png',
  'sidepanel.html',
  'sidepanel.js'
];

// Copy files to dist
filesToCopy.forEach(file => {
  const srcPath = path.join(__dirname, '..', file);
  const destPath = path.join(distDir, file);
  
  if (fs.existsSync(srcPath)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied: ${file}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${file}:`, error.message);
    }
  } else {
    console.log(`⚠️  Skipped (not found): ${file}`);
  }
});

console.log('\n✅ Build complete! Extension ready in dist/ folder');
process.exit(0);
