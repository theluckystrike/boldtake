#!/usr/bin/env node

/**
 * BoldTake Extension Debugger
 * Comprehensive validation and debugging tool
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 BoldTake Extension Debugger v1.0');
console.log('=====================================\n');

let errors = [];
let warnings = [];
let info = [];

// Files to check
const filesToCheck = [
  'manifest.json',
  'background.js',
  'contentScript.js',
  'popup.js',
  'auth.js',
  'supabase-config.js'
];

// 1. Check if all required files exist
console.log('📁 Checking file existence...');
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    info.push(`✅ ${file} exists`);
  } else {
    errors.push(`❌ Missing file: ${file}`);
  }
});

// 2. Validate manifest.json
console.log('\n📋 Validating manifest.json...');
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  
  // Check version
  if (!manifest.version) {
    errors.push('❌ No version in manifest.json');
  } else {
    info.push(`✅ Version: ${manifest.version}`);
  }
  
  // Check required fields
  const requiredFields = ['manifest_version', 'name', 'description', 'permissions', 'content_scripts', 'background'];
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      errors.push(`❌ Missing required field in manifest: ${field}`);
    }
  });
  
  // Check content scripts
  if (manifest.content_scripts) {
    manifest.content_scripts.forEach((cs, index) => {
      cs.js?.forEach(script => {
        if (!fs.existsSync(script)) {
          errors.push(`❌ Content script not found: ${script}`);
        }
      });
    });
  }
  
} catch (e) {
  errors.push(`❌ Invalid manifest.json: ${e.message}`);
}

// 3. Check JavaScript syntax
console.log('\n🔧 Checking JavaScript syntax...');

function checkJSSyntax(filename) {
  try {
    const content = fs.readFileSync(filename, 'utf8');
    
    // Basic syntax checks
    const issues = [];
    
    // Check for unclosed brackets
    const openBrackets = (content.match(/\{/g) || []).length;
    const closeBrackets = (content.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push(`Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`);
    }
    
    // Check for unclosed parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
    }
    
    // Check for trailing commas in objects (common issue)
    if (content.match(/,\s*\n\s*}/)) {
      warnings.push(`⚠️ ${filename}: Trailing comma found in object (may cause issues in older browsers)`);
    }
    
    // Check for missing commas in objects
    if (content.match(/[a-zA-Z0-9_\]"']\s*\n\s*[a-zA-Z_"']/)) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.match(/:\s*[^,]*$/) && !line.match(/[{}\[\]()]$/) && !line.includes('//')) {
          const nextLine = lines[index + 1];
          if (nextLine && nextLine.trim() && !nextLine.trim().startsWith('}') && !nextLine.trim().startsWith(']')) {
            warnings.push(`⚠️ ${filename}:${index + 1}: Possible missing comma`);
          }
        }
      });
    }
    
    // Check for console.log statements (should use debugLog)
    const consoleCount = (content.match(/console\.log/g) || []).length;
    if (consoleCount > 5) {
      warnings.push(`⚠️ ${filename}: ${consoleCount} console.log statements (consider using debugLog)`);
    }
    
    if (issues.length > 0) {
      issues.forEach(issue => errors.push(`❌ ${filename}: ${issue}`));
    } else {
      info.push(`✅ ${filename}: Syntax appears valid`);
    }
    
  } catch (e) {
    errors.push(`❌ Could not read ${filename}: ${e.message}`);
  }
}

['background.js', 'contentScript.js', 'popup.js', 'auth.js'].forEach(file => {
  if (fs.existsSync(file)) {
    checkJSSyntax(file);
  }
});

// 4. Check for specific BoldTake requirements
console.log('\n🎯 Checking BoldTake-specific requirements...');

function checkBoldTakeRequirements() {
  // Check contentScript.js for safety features
  if (fs.existsSync('contentScript.js')) {
    const content = fs.readFileSync('contentScript.js', 'utf8');
    
    // Check for safety functions
    const safetyFunctions = [
      'checkBurstProtection',
      'checkHourlyLimit',
      'assessAccountRisk',
      'likeTweetSafely'
    ];
    
    safetyFunctions.forEach(func => {
      if (!content.includes(`function ${func}`)) {
        errors.push(`❌ Missing safety function: ${func}`);
      } else {
        info.push(`✅ Safety function found: ${func}`);
      }
    });
    
    // Check for SECURITY_CONFIG
    if (!content.includes('SECURITY_CONFIG')) {
      errors.push('❌ SECURITY_CONFIG not found');
    } else {
      // Check specific safety limits
      if (!content.includes('MAX_BURST_ACTIONS')) {
        warnings.push('⚠️ MAX_BURST_ACTIONS not configured');
      }
      if (!content.includes('MAX_COMMENTS_PER_HOUR')) {
        warnings.push('⚠️ MAX_COMMENTS_PER_HOUR not configured');
      }
    }
    
    // Check for sessionStats tracking
    if (!content.includes('recentActions')) {
      errors.push('❌ recentActions tracking not found');
    }
    if (!content.includes('hourlyActions')) {
      errors.push('❌ hourlyActions tracking not found');
    }
  }
  
  // Check background.js for Supabase configuration
  if (fs.existsSync('background.js')) {
    const content = fs.readFileSync('background.js', 'utf8');
    
    if (!content.includes('SUPABASE_URL')) {
      errors.push('❌ SUPABASE_URL not configured in background.js');
    }
    if (!content.includes('API_ENDPOINT')) {
      errors.push('❌ API_ENDPOINT not configured in background.js');
    }
    if (!content.includes('timeout') || !content.includes('30000')) {
      warnings.push('⚠️ 30-second timeout may not be configured');
    }
  }
}

checkBoldTakeRequirements();

// 5. Check for common runtime errors
console.log('\n⚡ Checking for common runtime issues...');

function checkRuntimeIssues() {
  if (fs.existsSync('contentScript.js')) {
    const content = fs.readFileSync('contentScript.js', 'utf8');
    
    // Check for undefined variables
    const commonUndefined = [
      'sessionStats',
      'SECURITY_CONFIG',
      'debugLog',
      'errorLog'
    ];
    
    commonUndefined.forEach(variable => {
      // Simple check - look for usage without declaration
      const usagePattern = new RegExp(`[^a-zA-Z_]${variable}[^a-zA-Z_]`);
      const declarationPattern = new RegExp(`(let|const|var|function)\\s+${variable}`);
      
      if (content.match(usagePattern) && !content.match(declarationPattern)) {
        warnings.push(`⚠️ Possible undefined variable: ${variable}`);
      }
    });
    
    // Check for async/await issues
    const asyncFunctions = content.match(/async\s+function\s+(\w+)/g) || [];
    asyncFunctions.forEach(func => {
      const funcName = func.replace(/async\s+function\s+/, '');
      const callPattern = new RegExp(`[^await\\s]${funcName}\\s*\\(`);
      if (content.match(callPattern)) {
        warnings.push(`⚠️ Async function ${funcName} might be called without await`);
      }
    });
  }
}

checkRuntimeIssues();

// 6. Summary Report
console.log('\n📊 DEBUGGING SUMMARY');
console.log('====================');

if (errors.length === 0) {
  console.log('✅ No critical errors found!');
} else {
  console.log(`\n❌ CRITICAL ERRORS (${errors.length}):`);
  errors.forEach(error => console.log(`  ${error}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
  warnings.forEach(warning => console.log(`  ${warning}`));
}

if (info.length > 0 && errors.length === 0) {
  console.log(`\n✅ VALIDATIONS PASSED (${info.length}):`);
  info.forEach(i => console.log(`  ${i}`));
}

// 7. Recommendations
console.log('\n💡 RECOMMENDATIONS:');
if (errors.length > 0) {
  console.log('  1. Fix all critical errors before deployment');
  console.log('  2. Test each fix individually');
  console.log('  3. Run this debugger again after fixes');
} else if (warnings.length > 0) {
  console.log('  1. Review warnings for potential issues');
  console.log('  2. Test edge cases thoroughly');
  console.log('  3. Monitor console during runtime');
} else {
  console.log('  1. Extension appears ready for testing');
  console.log('  2. Load in Chrome and check console');
  console.log('  3. Test all safety features');
}

// Exit with error code if critical errors found
process.exit(errors.length > 0 ? 1 : 0);
