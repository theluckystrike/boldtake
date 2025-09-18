#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Fixing all issues in contentScript.js...\n');

// Read the file
let content = fs.readFileSync('contentScript.js', 'utf8');
const lines = content.split('\n');

// Count parentheses line by line to find the issue
let openCount = 0;
let problemLine = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '(') openCount++;
    if (char === ')') {
      openCount--;
      if (openCount < 0) {
        console.log(`❌ Extra closing parenthesis at line ${i + 1}`);
        problemLine = i + 1;
        break;
      }
    }
  }
}

if (openCount > 0) {
  console.log(`❌ Missing ${openCount} closing parenthesis(es)`);
  
  // Common issue: getPersonalizationSettings might be missing a closing
  const getPersonalizationIndex = lines.findIndex(line => 
    line.includes('async function getPersonalizationSettings()'));
  
  if (getPersonalizationIndex !== -1) {
    console.log(`\nChecking getPersonalizationSettings function at line ${getPersonalizationIndex + 1}...`);
    
    // Find the end of this function
    let braceCount = 0;
    let functionStart = false;
    let functionEnd = -1;
    
    for (let i = getPersonalizationIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('{')) {
        const opens = (line.match(/\{/g) || []).length;
        braceCount += opens;
        functionStart = true;
      }
      
      if (line.includes('}')) {
        const closes = (line.match(/\}/g) || []).length;
        braceCount -= closes;
      }
      
      if (functionStart && braceCount === 0) {
        functionEnd = i;
        break;
      }
    }
    
    if (functionEnd === -1) {
      console.log('⚠️ Function getPersonalizationSettings is not properly closed');
    }
  }
  
  // Check for Promise constructor without closing
  const promiseLines = [];
  lines.forEach((line, index) => {
    if (line.includes('new Promise((resolve') && !line.includes(');')) {
      promiseLines.push(index + 1);
    }
  });
  
  if (promiseLines.length > 0) {
    console.log('\n⚠️ Found Promise constructors that might be unclosed at lines:', promiseLines);
  }
}

// Check for other issues
console.log('\n📋 Other checks:');

// Check for undefined variables
if (content.includes('DEBUG_MODE')) {
  console.log('❌ Found DEBUG_MODE references (should be SHOW_LOGS)');
  content = content.replace(/DEBUG_MODE/g, 'SHOW_LOGS');
  console.log('✅ Fixed: Replaced DEBUG_MODE with SHOW_LOGS');
}

// Check for location.reload
const reloadCount = (content.match(/location\.reload/g) || []).length;
if (reloadCount > 0) {
  console.log(`⚠️ Found ${reloadCount} location.reload() calls that will lose search filters`);
}

// Save the fixed content
fs.writeFileSync('contentScript.js', content, 'utf8');

console.log('\n✅ Fixes applied!');
console.log('\nNow checking final balance...');

// Final check
const finalContent = fs.readFileSync('contentScript.js', 'utf8');
let finalOpen = 0;
for (let char of finalContent) {
  if (char === '(') finalOpen++;
  if (char === ')') finalOpen--;
}

if (finalOpen === 0) {
  console.log('✅ Parentheses are now balanced!');
} else {
  console.log(`❌ Still ${finalOpen} unclosed parenthesis(es)`);
  
  // Try to find where the issue is
  const functionPattern = /async function (\w+)|function (\w+)/g;
  let match;
  while ((match = functionPattern.exec(finalContent)) !== null) {
    const funcName = match[1] || match[2];
    const funcIndex = match.index;
    
    // Count parentheses in this function
    let funcOpen = 0;
    let i = funcIndex;
    let braceLevel = 0;
    let inFunction = false;
    
    while (i < finalContent.length) {
      if (finalContent[i] === '{') {
        braceLevel++;
        inFunction = true;
      }
      if (finalContent[i] === '}') {
        braceLevel--;
        if (inFunction && braceLevel === 0) break;
      }
      if (finalContent[i] === '(') funcOpen++;
      if (finalContent[i] === ')') funcOpen--;
      i++;
    }
    
    if (funcOpen !== 0) {
      console.log(`  Possible issue in function ${funcName}: ${funcOpen} unclosed`);
    }
  }
}

process.exit(finalOpen === 0 ? 0 : 1);
