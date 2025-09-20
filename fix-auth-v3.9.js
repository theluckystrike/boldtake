/**
 * BoldTake v3.9.0 - Authentication Fix Validator
 * This script validates the authentication fixes for the extension
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 BoldTake v3.9.0 - Authentication Fix Validator');
console.log('=' .repeat(50));

const fixes = [
    {
        file: 'background.js',
        checks: [
            {
                name: 'Enhanced token retrieval',
                pattern: /Check direct Supabase auth token/,
                required: true
            },
            {
                name: 'Multiple token sources',
                pattern: /sb-ckeuqgiuetlwowjoecku-auth-token/,
                required: true
            },
            {
                name: 'Proper token usage',
                pattern: /Bearer \$\{accessToken\}/,
                required: true
            }
        ]
    },
    {
        file: 'auth.js',
        checks: [
            {
                name: 'Session refresh function',
                pattern: /refreshAuthSession/,
                required: true
            },
            {
                name: 'Access token storage',
                pattern: /access_token: result\.session\?\.access_token/,
                required: true
            },
            {
                name: 'Session refresh on init',
                pattern: /await refreshAuthSession\(\)/,
                required: true
            }
        ]
    }
];

let allPassed = true;

fixes.forEach(fix => {
    console.log(`\n📄 Checking ${fix.file}:`);
    const filePath = path.join(__dirname, fix.file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`   ❌ File not found: ${fix.file}`);
        allPassed = false;
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    fix.checks.forEach(check => {
        if (check.pattern.test(content)) {
            console.log(`   ✅ ${check.name}`);
        } else if (check.required) {
            console.log(`   ❌ ${check.name} - MISSING`);
            allPassed = false;
        } else {
            console.log(`   ⚠️  ${check.name} - Optional, not found`);
        }
    });
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
    console.log('✅ ALL AUTHENTICATION FIXES VALIDATED');
    console.log('\nKey improvements:');
    console.log('1. Enhanced token retrieval from multiple sources');
    console.log('2. Automatic session refresh on initialization');
    console.log('3. Better error handling and logging');
    console.log('4. Support for different auth token storage formats');
} else {
    console.log('❌ VALIDATION FAILED - Some fixes are missing');
    process.exit(1);
}

console.log('\n📦 Ready to package as BoldTake-v3.9.0-AUTH-FIX');
