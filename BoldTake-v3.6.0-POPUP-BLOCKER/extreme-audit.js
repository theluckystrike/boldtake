#!/usr/bin/env node

/**
 * EXTREME DEBUGGING AUDIT v2.0
 * The most comprehensive extension validation ever
 */

const fs = require('fs');
const path = require('path');

console.log('🔥🔥🔥 EXTREME DEBUGGING AUDIT 🔥🔥🔥');
console.log('=====================================\n');

let criticalErrors = [];
let errors = [];
let warnings = [];
let info = [];

// ============== 1. FILE EXISTENCE CHECK ==============
console.log('📁 PHASE 1: File Existence Check...');
const requiredFiles = [
  'manifest.json',
  'background.js',
  'contentScript.js',
  'popup.js',
  'popup.html',
  'auth.js',
  'supabase-config.js',
  'supabase.min.js',
  'icon.png'
];

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    criticalErrors.push(`🔴 MISSING CRITICAL FILE: ${file}`);
  } else {
    const stats = fs.statSync(file);
    if (stats.size === 0) {
      criticalErrors.push(`🔴 EMPTY FILE: ${file}`);
    } else if (stats.size < 100 && !file.includes('icon')) {
      warnings.push(`⚠️ Suspiciously small file: ${file} (${stats.size} bytes)`);
    }
  }
});

// ============== 2. MANIFEST VALIDATION ==============
console.log('\n📋 PHASE 2: Manifest Deep Validation...');
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  
  // Check version format
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push(`❌ Invalid version format: ${manifest.version}`);
  }
  
  // Check required permissions
  const requiredPerms = ['storage', 'tabs'];
  requiredPerms.forEach(perm => {
    if (!manifest.permissions?.includes(perm)) {
      errors.push(`❌ Missing required permission: ${perm}`);
    }
  });
  
  // Check content scripts
  if (!manifest.content_scripts || manifest.content_scripts.length === 0) {
    criticalErrors.push('🔴 No content scripts defined!');
  } else {
    manifest.content_scripts.forEach(cs => {
      cs.js?.forEach(script => {
        if (!fs.existsSync(script)) {
          criticalErrors.push(`🔴 Content script not found: ${script}`);
        }
      });
    });
  }
  
  // Check for config.js in content_scripts (KNOWN ISSUE)
  manifest.content_scripts?.forEach(cs => {
    if (cs.js?.includes('config.js')) {
      criticalErrors.push('🔴 FATAL: config.js in content_scripts will cause duplicate identifier error!');
    }
  });
  
} catch (e) {
  criticalErrors.push(`🔴 MANIFEST PARSE ERROR: ${e.message}`);
}

// ============== 3. JAVASCRIPT SYNTAX CHECK ==============
console.log('\n🔧 PHASE 3: JavaScript Syntax Analysis...');

function deepSyntaxCheck(filename) {
  try {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');
    
    // Check for undefined variables
    const definedVars = new Set();
    const usedVars = new Set();
    
    // Common globals to ignore
    const globals = new Set(['window', 'document', 'console', 'chrome', 'setTimeout', 
                            'setInterval', 'Promise', 'Date', 'Math', 'JSON', 'Array',
                            'Object', 'String', 'Number', 'Boolean', 'Error', 'supabase']);
    
    // Find declarations
    lines.forEach((line, index) => {
      // Find const/let/var declarations
      const declareMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_]\w*)/g);
      if (declareMatch) {
        declareMatch.forEach(match => {
          const varName = match.replace(/(?:const|let|var)\s+/, '');
          definedVars.add(varName);
        });
      }
      
      // Find function declarations
      const funcMatch = line.match(/function\s+([a-zA-Z_]\w*)/g);
      if (funcMatch) {
        funcMatch.forEach(match => {
          const funcName = match.replace(/function\s+/, '');
          definedVars.add(funcName);
        });
      }
    });
    
    // Check for specific known issues
    if (filename.includes('contentScript')) {
      // Check for DEBUG_MODE vs SHOW_LOGS consistency
      if (content.includes('DEBUG_MODE') && content.includes('SHOW_LOGS')) {
        criticalErrors.push(`🔴 ${filename}: Mixed DEBUG_MODE and SHOW_LOGS - will cause reference errors!`);
      }
      
      // Check if SHOW_LOGS is defined
      if (!content.includes('const SHOW_LOGS') && !content.includes('let SHOW_LOGS')) {
        if (content.includes('SHOW_LOGS')) {
          criticalErrors.push(`🔴 ${filename}: SHOW_LOGS used but not defined!`);
        }
      }
      
      // Check for criticalLog definition
      if (content.includes('criticalLog(') && !content.includes('const criticalLog')) {
        criticalErrors.push(`🔴 ${filename}: criticalLog used but not defined!`);
      }
      
      // Check for location.reload (causes loss of search filters)
      const reloadCount = (content.match(/location\.reload/g) || []).length;
      if (reloadCount > 0) {
        warnings.push(`⚠️ ${filename}: ${reloadCount} location.reload() calls - may lose search filters`);
      }
      
      // Check for window.close (may not work in main window)
      if (content.includes('window.close()')) {
        warnings.push(`⚠️ ${filename}: window.close() may fail in main window`);
      }
    }
    
    // Check for unclosed brackets
    const openBrackets = (content.match(/\{/g) || []).length;
    const closeBrackets = (content.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      criticalErrors.push(`🔴 ${filename}: Mismatched brackets! Open: ${openBrackets}, Close: ${closeBrackets}`);
    }
    
    // Check for unclosed parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      criticalErrors.push(`🔴 ${filename}: Mismatched parentheses! Open: ${openParens}, Close: ${closeParens}`);
    }
    
    // Check for async without await
    const asyncFuncs = content.match(/async\s+function\s+(\w+)/g) || [];
    asyncFuncs.forEach(func => {
      const funcName = func.replace(/async\s+function\s+/, '');
      const callPattern = new RegExp(`(?<!await\\s)${funcName}\\s*\\(`);
      if (content.match(callPattern)) {
        warnings.push(`⚠️ ${filename}: Async function '${funcName}' possibly called without await`);
      }
    });
    
    // Check for console.log in production
    const consoleLogCount = (content.match(/console\.log/g) || []).length;
    if (filename.includes('contentScript') && consoleLogCount > 50) {
      warnings.push(`⚠️ ${filename}: ${consoleLogCount} console.log calls (consider using debugLog)`);
    }
    
  } catch (e) {
    errors.push(`❌ Could not analyze ${filename}: ${e.message}`);
  }
}

['background.js', 'contentScript.js', 'popup.js', 'auth.js'].forEach(file => {
  if (fs.existsSync(file)) {
    deepSyntaxCheck(file);
  }
});

// ============== 4. DEPENDENCY CHECK ==============
console.log('\n📦 PHASE 4: Dependency & Import Check...');

// Check background.js for importScripts issues
if (fs.existsSync('background.js')) {
  const bgContent = fs.readFileSync('background.js', 'utf8');
  if (bgContent.includes("importScripts('config.js')")) {
    criticalErrors.push("🔴 background.js: importScripts('config.js') will fail - config.js doesn't exist!");
  }
  
  // Check for proper Supabase configuration
  if (!bgContent.includes('SUPABASE_URL')) {
    criticalErrors.push('🔴 background.js: SUPABASE_URL not defined!');
  }
  
  if (!bgContent.includes('debugLog')) {
    errors.push('❌ background.js: debugLog not defined');
  }
}

// ============== 5. SAFETY FEATURES CHECK ==============
console.log('\n🛡️ PHASE 5: Safety Features Validation...');

if (fs.existsSync('contentScript.js')) {
  const content = fs.readFileSync('contentScript.js', 'utf8');
  
  const safetyFunctions = [
    'checkBurstProtection',
    'checkHourlyLimit', 
    'assessAccountRisk',
    'likeTweetSafely'
  ];
  
  safetyFunctions.forEach(func => {
    if (!content.includes(`function ${func}`)) {
      errors.push(`❌ Missing safety function: ${func}`);
    }
  });
  
  // Check for safety configuration
  if (!content.includes('SECURITY_CONFIG')) {
    errors.push('❌ SECURITY_CONFIG not found');
  }
  
  // Check for proper session tracking
  if (!content.includes('recentActions')) {
    warnings.push('⚠️ recentActions tracking may be missing');
  }
  
  if (!content.includes('hourlyActions')) {
    warnings.push('⚠️ hourlyActions tracking may be missing');
  }
}

// ============== 6. RUNTIME SIMULATION ==============
console.log('\n🎮 PHASE 6: Runtime Simulation Check...');

// Check for circular dependencies
const checkCircularDeps = () => {
  // This is a simplified check
  const files = ['contentScript.js', 'background.js', 'popup.js'];
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      // Check if file tries to import itself
      if (content.includes(`import.*${file}`) || content.includes(`require.*${file}`)) {
        criticalErrors.push(`🔴 ${file}: Possible circular dependency!`);
      }
    }
  });
};

checkCircularDeps();

// ============== 7. COMPATIBILITY CHECK ==============
console.log('\n🌐 PHASE 7: Browser Compatibility Check...');

// Check for Chrome-specific APIs
if (fs.existsSync('contentScript.js')) {
  const content = fs.readFileSync('contentScript.js', 'utf8');
  
  // Check for proper chrome.runtime checks
  if (content.includes('chrome.runtime.sendMessage') && 
      !content.includes('chrome.runtime?.sendMessage') &&
      !content.includes('if (chrome.runtime)')) {
    warnings.push('⚠️ chrome.runtime.sendMessage used without existence check');
  }
  
  // Check for proper error handling
  const tryCount = (content.match(/try\s*\{/g) || []).length;
  const catchCount = (content.match(/catch\s*\(/g) || []).length;
  if (tryCount !== catchCount) {
    warnings.push(`⚠️ Mismatched try/catch blocks: ${tryCount} try, ${catchCount} catch`);
  }
}

// ============== 8. FINAL REPORT ==============
console.log('\n\n');
console.log('==============================================');
console.log('🔥🔥🔥 EXTREME AUDIT FINAL REPORT 🔥🔥🔥');
console.log('==============================================\n');

const totalIssues = criticalErrors.length + errors.length + warnings.length;

if (criticalErrors.length > 0) {
  console.log('🔴🔴🔴 CRITICAL ERRORS - FIX IMMEDIATELY 🔴🔴🔴');
  criticalErrors.forEach(err => console.log(`  ${err}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERRORS - Should Fix');
  errors.forEach(err => console.log(`  ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS - Review');
  warnings.forEach(warn => console.log(`  ${warn}`));
  console.log('');
}

// Final verdict
console.log('📊 FINAL VERDICT:');
if (criticalErrors.length > 0) {
  console.log('🔴 FAIL - CRITICAL ISSUES FOUND!');
  console.log('DO NOT DEPLOY UNTIL FIXED!');
} else if (errors.length > 0) {
  console.log('🟡 RISKY - Has errors that should be fixed');
} else if (warnings.length > 0) {
  console.log('🟠 ACCEPTABLE - Has warnings but should work');
} else {
  console.log('🟢 EXCELLENT - No issues found!');
}

console.log(`\nTotal Issues: ${totalIssues}`);
console.log(`Critical: ${criticalErrors.length}, Errors: ${errors.length}, Warnings: ${warnings.length}`);

process.exit(criticalErrors.length > 0 ? 1 : 0);
