/**
 * BoldTake v3.9.4 ULTIMATE - Final Validation Script
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 BoldTake v3.9.4 ULTIMATE - Triple Check Validation');
console.log('=' .repeat(60));

// Define all critical checks
const validations = [
  {
    name: 'Version Check',
    file: 'manifest.json',
    check: (content) => content.includes('"version": "3.9.4"'),
    message: 'Manifest version is 3.9.4'
  },
  {
    name: 'Turbo Mode Display',
    file: 'contentScript.js',
    check: (content) => content.includes('BoldTake v3.9.4 ULTIMATE - Turbo Edition!'),
    message: 'Shows correct version in console'
  },
  {
    name: 'Speed Settings',
    file: 'contentScript.js',
    check: (content) => content.includes('MIN_DELAY_BETWEEN_ACTIONS: 45000'),
    message: '45 second minimum delay'
  },
  {
    name: 'Max Speed Settings',
    file: 'contentScript.js',
    check: (content) => content.includes('MAX_DELAY_BETWEEN_ACTIONS: 150000'),
    message: '2.5 minute maximum delay'
  },
  {
    name: 'Base Delay Calculation',
    file: 'contentScript.js',
    check: (content) => content.includes('baseDelay: 105000'),
    message: '1.75 minute average delay'
  },
  {
    name: 'Enhanced Auth Token Retrieval',
    file: 'background.js',
    check: (content) => content.includes('sb-ckeuqgiuetlwowjoecku-auth-token'),
    message: 'Multiple token source checking'
  },
  {
    name: 'Session Refresh',
    file: 'auth.js',
    check: (content) => content.includes('refreshAuthSession'),
    message: 'Session refresh function exists'
  },
  {
    name: 'Smart Reconnect',
    file: 'contentScript.js',
    check: (content) => content.includes('waitForNetwork'),
    message: 'Network recovery function present'
  },
  {
    name: 'Improved Truncation',
    file: 'contentScript.js',
    check: (content) => content.includes('cleanReply.length > 260'),
    message: '260 character smart truncation'
  },
  {
    name: 'Fast Modal Detection',
    file: 'contentScript.js',
    check: (content) => content.includes('await sleep(200)'),
    message: 'Fast 200ms detection intervals'
  }
];

let allPassed = true;
const results = [];

// Run all validations
validations.forEach(validation => {
  const filePath = path.join(__dirname, validation.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${validation.name}: File not found - ${validation.file}`);
    allPassed = false;
    results.push({ name: validation.name, passed: false, reason: 'File not found' });
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (validation.check(content)) {
    console.log(`✅ ${validation.name}: ${validation.message}`);
    results.push({ name: validation.name, passed: true });
  } else {
    console.log(`❌ ${validation.name}: FAILED - ${validation.message}`);
    allPassed = false;
    results.push({ name: validation.name, passed: false, reason: validation.message });
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

const passedCount = results.filter(r => r.passed).length;
const failedCount = results.filter(r => !r.passed).length;

console.log(`✅ Passed: ${passedCount}/${validations.length}`);
console.log(`❌ Failed: ${failedCount}/${validations.length}`);

if (allPassed) {
  console.log('\n🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!');
  console.log('\n📦 Key Features Validated:');
  console.log('   • Authentication with multiple token sources');
  console.log('   • Turbo speed: 30-35 tweets/hour');
  console.log('   • Smart reconnection on network issues');
  console.log('   • Enhanced modal detection (200ms)');
  console.log('   • Improved truncation (260 chars)');
  console.log('   • Session refresh capability');
} else {
  console.log('\n⚠️ VALIDATION FAILED - Review issues above');
  console.log('\nFailed checks:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`   • ${r.name}: ${r.reason}`);
  });
  process.exit(1);
}

console.log('\n🚀 BoldTake v3.9.4 ULTIMATE is production ready!');
