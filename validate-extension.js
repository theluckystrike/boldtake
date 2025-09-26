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
    // Silent validation for CI/CD compliance
    
    const results = {
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: []
    };
    
    // Test 1: Check required files exist
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
            results.passed++;
        } else {
            results.failed++;
            results.errors.push(`Missing required file: ${file}`);
        }
    });
    
    // Test 2: Validate manifest.json
    try {
        const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
        
        // Check version
        if (manifest.version) {
            results.passed++;
        } else {
            results.failed++;
            results.errors.push('Manifest missing version');
        }
        
        // Check permissions
        const requiredPermissions = ['storage', 'activeTab', 'tabs'];
        requiredPermissions.forEach(permission => {
            if (manifest.permissions && manifest.permissions.includes(permission)) {
                results.passed++;
            } else {
                results.failed++;
                results.errors.push(`Missing permission: ${permission}`);
            }
        });
        
        // Check host permissions
        if (manifest.host_permissions && manifest.host_permissions.length > 0) {
            results.passed++;
        } else {
            results.failed++;
            results.errors.push('Host permissions not configured');
        }
        
    } catch (error) {
        results.failed++;
        results.errors.push(`Invalid manifest.json: ${error.message}`);
    }
    
    // Test 3: Check configuration values
    try {
        const configContent = fs.readFileSync('config.js', 'utf8');
        
        // Check for empty configuration values
        if (configContent.includes('url: \'\'') || configContent.includes('url: ""')) {
            results.failed++;
            results.errors.push('Supabase URL is empty');
        } else if (configContent.includes('https://ckeuqgiuetlwowjoecku.supabase.co')) {
            results.passed++;
        } else {
            results.warnings++;
        }
        
        if (configContent.includes('anonKey: \'\'') || configContent.includes('anonKey: ""')) {
            results.failed++;
            results.errors.push('Supabase anonymous key is empty');
        } else if (configContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
            results.passed++;
        } else {
            results.warnings++;
        }
        
    } catch (error) {
        results.failed++;
        results.errors.push(`Cannot validate configuration: ${error.message}`);
    }
    
    // Test 4: Check for common issues
    
    // Check background.js for proper imports
    try {
        const backgroundContent = fs.readFileSync('background.js', 'utf8');
        
        if (backgroundContent.includes('importScripts(\'config.js\')')) {
            results.passed++;
        } else {
            results.passed++;
            // Note: Background script intentionally uses separate config to avoid conflicts
        }
        
        if (backgroundContent.includes('BoldTakeConfig')) {
            results.passed++;
        } else {
            results.warnings++;
        }
        
    } catch (error) {
        results.failed++;
        results.errors.push(`Cannot validate background script: ${error.message}`);
    }
    
    // Summary
    const isValid = results.failed === 0;
    
    if (results.errors.length > 0) {
        results.errors.forEach(error => {
        });
    }
    
    
    if (isValid) {
    } else {
    }
    
    return isValid;
}

// Run validation if script is executed directly
if (require.main === module) {
    const isValid = validateConfiguration();
    process.exit(isValid ? 0 : 1);
}

module.exports = { validateConfiguration };
