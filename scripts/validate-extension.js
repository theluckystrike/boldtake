#!/usr/bin/env node

/**
 * Basic extension validation script
 * This validates the Chrome extension structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating extension structure...');

// Check required files
const requiredFiles = [
  'manifest.json',
  'contentScript.js',
  'background.js',
  'popup.html',
  'popup.js'
];

let hasErrors = false;

// Check each required file
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing required file: ${file}`);
    hasErrors = true;
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

// Validate manifest.json
try {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  if (!manifest.manifest_version) {
    console.error('❌ manifest.json missing manifest_version');
    hasErrors = true;
  }
  
  if (!manifest.version) {
    console.error('❌ manifest.json missing version');
    hasErrors = true;
  }
  
  console.log(`✅ Valid manifest.json (v${manifest.version})`);
} catch (error) {
  console.error('❌ Error reading manifest.json:', error.message);
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n❌ Validation failed!');
  process.exit(1);
} else {
  console.log('\n✅ Extension validation passed!');
  process.exit(0);
}
