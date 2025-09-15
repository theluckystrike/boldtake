/**
 * BoldTake Professional - Extension Validation Script
 * 
 * This script validates the extension configuration and ensures
 * all components are properly set up before deployment.
 */

// Load configuration
const fs = require('fs');
const path = require('path');

// Configuration validation
function validateConfiguration() {
    console.log('🔍 Validating BoldTake Extension Configuration...\n');
    
    const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: []
    };
    
    // Test 1: Check required files exist
    console.log('📁 Checking required files...');
    const requiredFiles = [
        'config.js',
        'background.js',
        'contentScript.js',
        'popup.js',
        'popup.html',
        'auth.js',
        'supabase-config.js',
        'supabase.min.js',
        'manifest.json',
        'icon.png'
    ];
    
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`  ✅ ${file}`);
            results.passed++;
        } else {
            console.log(`  ❌ ${file} - MISSING`);
            results.failed++;
            results.errors.push(`Missing required file: ${file}`);
        }
    });
    
    // Test 2: Validate manifest.json
    console.log('\n📋 Validating manifest.json...');
    try {
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        
        // Check version
        if (manifest.version) {
            console.log(`  ✅ Version: ${manifest.version}`);
            results.passed++;
        } else {
            console.log('  ❌ Version missing');
            results.failed++;
            results.errors.push('Manifest missing version');
        }
        
        // Check permissions
        const requiredPermissions = ['storage', 'activeTab', 'tabs'];
        requiredPermissions.forEach(permission => {
            if (manifest.permissions && manifest.permissions.includes(permission)) {
                console.log(`  ✅ Permission: ${permission}`);
                results.passed++;
            } else {
                console.log(`  ❌ Permission missing: ${permission}`);
                results.failed++;
                results.errors.push(`Missing permission: ${permission}`);
            }
        });
        
        // Check host permissions
        if (manifest.host_permissions && manifest.host_permissions.length > 0) {
            console.log(`  ✅ Host permissions configured`);
            results.passed++;
        } else {
            console.log('  ❌ Host permissions missing');
            results.failed++;
            results.errors.push('Host permissions not configured');
        }
        
    } catch (error) {
        console.log(`  ❌ Invalid JSON: ${error.message}`);
        results.failed++;
        results.errors.push(`Invalid manifest.json: ${error.message}`);
    }
    
    // Test 3: Check configuration values
    console.log('\n⚙️ Validating configuration...');
    try {
        const configContent = fs.readFileSync('config.js', 'utf8');
        
        // Check for empty configuration values
        if (configContent.includes('url: \'\'') || configContent.includes('url: ""')) {
            console.log('  ❌ Empty Supabase URL detected');
            results.failed++;
            results.errors.push('Supabase URL is empty');
        } else if (configContent.includes('https://ckeuqgiuetlwowjoecku.supabase.co')) {
            console.log('  ✅ Supabase URL configured');
            results.passed++;
        } else {
            console.log('  ⚠️ Supabase URL not found or unusual format');
            results.warnings++;
        }
        
        if (configContent.includes('anonKey: \'\'') || configContent.includes('anonKey: ""')) {
            console.log('  ❌ Empty Supabase key detected');
            results.failed++;
            results.errors.push('Supabase anonymous key is empty');
        } else if (configContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
            console.log('  ✅ Supabase anonymous key configured');
            results.passed++;
        } else {
            console.log('  ⚠️ Supabase key not found or unusual format');
            results.warnings++;
        }
        
    } catch (error) {
        console.log(`  ❌ Cannot read config.js: ${error.message}`);
        results.failed++;
        results.errors.push(`Cannot validate configuration: ${error.message}`);
    }
    
    // Test 4: Check for common issues
    console.log('\n🔍 Checking for common issues...');
    
    // Check background.js for proper imports
    try {
        const backgroundContent = fs.readFileSync('background.js', 'utf8');
        
        if (backgroundContent.includes('importScripts(\'config.js\')')) {
            console.log('  ✅ Background script imports configuration');
            results.passed++;
        } else {
            console.log('  ❌ Background script missing config import');
            results.failed++;
            results.errors.push('Background script does not import config.js');
        }
        
        if (backgroundContent.includes('BoldTakeConfig')) {
            console.log('  ✅ Background script uses centralized config');
            results.passed++;
        } else {
            console.log('  ⚠️ Background script may not use centralized config');
            results.warnings++;
        }
        
    } catch (error) {
        console.log(`  ❌ Cannot read background.js: ${error.message}`);
        results.failed++;
        results.errors.push(`Cannot validate background script: ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  ⚠️ Warnings: ${results.warnings}`);
    
    if (results.errors.length > 0) {
        console.log('\n🚨 Critical Issues:');
        results.errors.forEach(error => {
            console.log(`  • ${error}`);
        });
    }
    
    const isValid = results.failed === 0;
    console.log(`\n${isValid ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED'}`);
    
    if (isValid) {
        console.log('\n🚀 Extension is ready for deployment!');
        console.log('\nNext steps:');
        console.log('1. Test the extension locally in Chrome');
        console.log('2. Run the comprehensive test plan');
        console.log('3. Create deployment package');
        console.log('4. Upload to Chrome Web Store');
    } else {
        console.log('\n🛠️ Please fix the issues above before deployment.');
    }
    
    return isValid;
}

// Run validation if script is executed directly
if (require.main === module) {
    const isValid = validateConfiguration();
    process.exit(isValid ? 0 : 1);
}

module.exports = { validateConfiguration };
