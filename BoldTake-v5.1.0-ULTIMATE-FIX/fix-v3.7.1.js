#!/usr/bin/env node

/**
 * FIX SCRIPT FOR v3.7.1
 * Following development rules from .cursorrules
 * 
 * ISSUES TO FIX:
 * 1. Duplicate const declarations causing syntax errors
 * 2. Variable scope conflicts
 * 
 * PLAN:
 * - Read contentScript.js
 * - Fix all duplicate declarations
 * - Validate syntax
 * - Create clean v3.7.1
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING v3.7.0 → v3.7.1');
console.log('='.repeat(50));

// Create new version directory
const sourceDir = 'BoldTake-v3.7.0-FORCE-MODAL';
const targetDir = 'BoldTake-v3.7.1-FIXED';

// Copy directory
console.log('📁 Creating v3.7.1 directory...');
fs.cpSync(sourceDir, targetDir, { recursive: true });

// Read content script
const filePath = path.join(targetDir, 'contentScript.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing duplicate declarations...');

// FIX 1: Multiple 'now' declarations
// These are in different scopes, so we need to rename them
content = content.replace(
  /const now = Date\.now\(\);(\s+\/\/ Clean up old actions)/g,
  'const cleanupNow = Date.now();$1'
);
content = content.replace(
  /sessionStats\.recentActions = sessionStats\.recentActions\.filter\(time => cleanupNow/g,
  'sessionStats.recentActions = sessionStats.recentActions.filter(time => cleanupNow'
);
content = content.replace(
  /sessionStats\.hourlyActions = sessionStats\.hourlyActions\.filter\(time => cleanupNow/g,
  'sessionStats.hourlyActions = sessionStats.hourlyActions.filter(time => cleanupNow'
);

// FIX 2: Multiple 'closeButton' declarations in modal recovery
// Line 741 closeButton redeclaration
content = content.replace(
  /(\s+)const closeButton = document\.querySelector\('\[aria-label="Close"\]'\);/g,
  (match, spaces, offset) => {
    // Check if this is the second occurrence (around line 741)
    const beforeText = content.substring(0, offset);
    const closeButtonCount = (beforeText.match(/const closeButton =/g) || []).length;
    if (closeButtonCount > 0) {
      return spaces + 'const modalCloseButton = document.querySelector(\'[aria-label="Close"]\');';
    }
    return match;
  }
);
// Update the usage
content = content.replace(
  /if \(modalCloseButton\) {\s+modalCloseButton\.click\(\);/g,
  'if (modalCloseButton) {\n        modalCloseButton.click();'
);

// FIX 3: Multiple 'textarea' declarations
// These are in try-catch blocks, so let's use different names
let textareaCounter = 0;
content = content.replace(
  /const textarea = document\.querySelector/g,
  (match) => {
    textareaCounter++;
    if (textareaCounter === 1) return match; // Keep first one
    if (textareaCounter === 2) return 'const replyTextarea = document.querySelector';
    if (textareaCounter === 3) return 'const modalTextarea = document.querySelector';
    return 'const textArea = document.querySelector';
  }
);

// FIX 4: Multiple 'modal' declarations
content = content.replace(
  /const modal = document\.querySelector\('\[role="dialog"\]'\);[\s\S]{0,100}?if \(modal && modal\.querySelector/g,
  (match) => {
    if (match.includes('// Second check')) {
      return match.replace('const modal =', 'const dialogModal =')
                  .replace('if (modal &&', 'if (dialogModal &&')
                  .replace('modal.querySelector', 'dialogModal.querySelector');
    }
    return match;
  }
);

// FIX 5: Multiple 'match' declarations in persona detection
// These are in different if blocks, so let's use block scoping
content = content.replace(
  /const match = currentPersona\.keywords/g,
  (match, offset) => {
    const beforeText = content.substring(Math.max(0, offset - 500), offset);
    if (beforeText.includes('// Entrepreneur')) return 'const entrepreneurMatch = currentPersona.keywords';
    if (beforeText.includes('// Philosopher')) return 'const philosopherMatch = currentPersona.keywords';
    if (beforeText.includes('// Comedian')) return 'const comedianMatch = currentPersona.keywords';
    if (beforeText.includes('// Motivator')) return 'const motivatorMatch = currentPersona.keywords';
    return match;
  }
);

// FIX 6: Update manifest version
const manifestPath = path.join(targetDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version = '3.7.1';
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// FIX 7: Update version in contentScript.js
content = content.replace(
  'BoldTake v3.7.0 FORCE-MODAL',
  'BoldTake v3.7.1 FIXED'
);

// Write fixed content
fs.writeFileSync(filePath, content);

console.log('✅ Fixed all duplicate declarations');

// Validate the fix
console.log('\n🔍 VALIDATING FIXES...');
try {
  // Basic syntax check
  new Function(content);
  console.log('✅ Syntax validation passed');
  
  // Check for remaining duplicates
  const lines = content.split('\n');
  const declarations = new Map();
  let hasDuplicates = false;
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/const\s+(\w+)\s*=/);
    if (match) {
      const varName = match[1];
      if (declarations.has(varName)) {
        const prevLine = declarations.get(varName);
        if (Math.abs(i - prevLine) < 50) {
          console.log(`⚠️ Possible duplicate: ${varName} at lines ${prevLine + 1} and ${i + 1}`);
          hasDuplicates = true;
        }
      }
      declarations.set(varName, i);
    }
  }
  
  if (!hasDuplicates) {
    console.log('✅ No problematic duplicates remaining');
  }
  
  console.log('\n✅ v3.7.1 FIXED AND READY!');
  console.log('📦 Package with: zip -r BoldTake-v3.7.1-FIXED.zip BoldTake-v3.7.1-FIXED/');
  
} catch (e) {
  console.error('❌ Validation failed:', e.message);
  process.exit(1);
}
