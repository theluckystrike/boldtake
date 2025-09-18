const fs = require('fs');
const path = require('path');

console.log('🔬 FULL BLOWN AUDIT v3.7.0 - COMPREHENSIVE ANALYSIS');
console.log('='.repeat(60));

// 1. FILE INTEGRITY CHECK
console.log('\n1️⃣ FILE INTEGRITY CHECK:');
const requiredFiles = [
  'manifest.json', 'background.js', 'contentScript.js', 
  'popup.js', 'popup.html', 'auth.js', 'supabase-config.js'
];
const missingFiles = requiredFiles.filter(f => !fs.existsSync(f));
console.log('  Required files:', requiredFiles.length);
console.log('  Missing files:', missingFiles.length || '✅ None');
if (missingFiles.length) console.log('  Missing:', missingFiles.join(', '));

// 2. MANIFEST VALIDATION
console.log('\n2️⃣ MANIFEST VALIDATION:');
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
console.log('  Version:', manifest.version);
console.log('  Permissions:', manifest.permissions.length, 'configured');
console.log('  Content scripts:', manifest.content_scripts ? '✅' : '❌');
console.log('  Background worker:', manifest.background ? '✅' : '❌');

// 3. CONTENTSCRIPT ANALYSIS
console.log('\n3️⃣ CONTENTSCRIPT DEEP ANALYSIS:');
const content = fs.readFileSync('contentScript.js', 'utf8');
const lines = content.split('\n');
console.log('  Total lines:', lines.length);

// Check for critical functions
const criticalFunctions = [
  'processNextTweet', 'handleReplyModal', 'findTweet', 
  'likeTweetSafely', 'assessAccountRisk', 'calculateHumanProcessingDelay'
];
const foundFunctions = criticalFunctions.filter(fn => 
  content.includes('function ' + fn) || content.includes('async function ' + fn)
);
console.log('  Critical functions:', foundFunctions.length + '/' + criticalFunctions.length);
if (foundFunctions.length < criticalFunctions.length) {
  const missing = criticalFunctions.filter(f => !foundFunctions.includes(f));
  console.log('  ❌ Missing:', missing.join(', '));
}

// 4. POPUP HANDLING VERIFICATION
console.log('\n4️⃣ POPUP HANDLING VERIFICATION:');
const hasForceModal = content.includes('FORCE MODAL');
const hasPopupRecovery = content.includes('Working in popup window');
const hasMouseEvent = content.includes('new MouseEvent');
const hasTrustedClick = content.includes('isTrusted: true');
console.log('  Force modal strategy:', hasForceModal ? '✅' : '❌');
console.log('  Popup recovery:', hasPopupRecovery ? '✅' : '❌');
console.log('  MouseEvent usage:', hasMouseEvent ? '✅' : '❌');
console.log('  Trusted click simulation:', hasTrustedClick ? '✅' : '❌');

// 5. SAFETY SYSTEM CHECK
console.log('\n5️⃣ SAFETY SYSTEM CHECK:');
const safetyChecks = {
  'Rate limiting': content.includes('MAX_COMMENTS_PER_DAY'),
  'Burst protection': content.includes('MAX_BURST_ACTIONS'),
  'Human delays': content.includes('HUMAN_VARIANCE_FACTOR'),
  'Risk assessment': content.includes('assessAccountRisk'),
  'Emergency stop': content.includes('EMERGENCY_STOP_THRESHOLD'),
  'Pattern detection': content.includes('PATTERN_DETECTION_WINDOW')
};
Object.entries(safetyChecks).forEach(([key, val]) => {
  console.log('  ' + key + ':', val ? '✅' : '❌');
});

// 6. ERROR HANDLING
console.log('\n6️⃣ ERROR HANDLING:');
const tryBlocks = (content.match(/try\s*{/g) || []).length;
const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
const errorLogs = (content.match(/errorLog/g) || []).length;
console.log('  Try blocks:', tryBlocks);
console.log('  Catch blocks:', catchBlocks);
console.log('  Error logging calls:', errorLogs);
console.log('  Ratio:', catchBlocks === tryBlocks ? '✅ Balanced' : '⚠️ Unbalanced');

// 7. TIMING CONFIGURATION
console.log('\n7️⃣ TIMING CONFIGURATION:');
const minDelay = content.match(/MIN_DELAY_BETWEEN_ACTIONS:\s*(\d+)/)?.[1];
const maxDelay = content.match(/MAX_DELAY_BETWEEN_ACTIONS:\s*(\d+)/)?.[1];
console.log('  Min delay:', minDelay ? (parseInt(minDelay)/1000) + 's' : 'Not found');
console.log('  Max delay:', maxDelay ? (parseInt(maxDelay)/1000) + 's' : 'Not found');
const tweetsPerHour = minDelay && maxDelay ? 
  Math.round(3600000 / ((parseInt(minDelay) + parseInt(maxDelay)) / 2)) : 'Unknown';
console.log('  Estimated tweets/hour:', tweetsPerHour);

// 8. VERSION CONSISTENCY
console.log('\n8️⃣ VERSION CONSISTENCY:');
const versionInContent = content.match(/BoldTake v([\d.]+)/)?.[1];
console.log('  Manifest version:', manifest.version);
console.log('  Content script version:', versionInContent);
console.log('  Match:', manifest.version === versionInContent ? '✅' : '❌ MISMATCH!');

// 9. SYNTAX CHECK
console.log('\n9️⃣ SYNTAX & STRUCTURE CHECK:');
const openBraces = (content.match(/{/g) || []).length;
const closeBraces = (content.match(/}/g) || []).length;
const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;
console.log('  Braces { }:', openBraces === closeBraces ? 
  `✅ Balanced (${openBraces})` : `❌ Unbalanced! Open: ${openBraces}, Close: ${closeBraces}`);
console.log('  Parentheses ( ):', openParens === closeParens ? 
  `✅ Balanced (${openParens})` : `❌ Unbalanced! Open: ${openParens}, Close: ${closeParens}`);

// 10. CONSOLE LOG CHECK
console.log('\n🔟 CONSOLE LOG VISIBILITY:');
const showLogs = content.match(/SHOW_LOGS\s*=\s*(\w+)/)?.[1];
const debugLogDef = content.match(/debugLog\s*=\s*([^;]+)/)?.[1];
console.log('  SHOW_LOGS:', showLogs || 'Not found');
console.log('  debugLog defined as:', debugLogDef ? debugLogDef.trim() : 'Not found');
const hasConsoleLog = content.includes('console.log');
const hasDebugLog = content.includes('debugLog(');
console.log('  Uses console.log:', hasConsoleLog ? '✅' : '❌');
console.log('  Uses debugLog:', hasDebugLog ? '✅' : '❌');

// 11. CRITICAL ISSUES
console.log('\n⚠️ CRITICAL ISSUES CHECK:');
const issues = [];
if (manifest.version !== versionInContent) issues.push('Version mismatch');
if (openBraces !== closeBraces) issues.push('Unbalanced braces');
if (openParens !== closeParens) issues.push('Unbalanced parentheses');
if (!hasForceModal) issues.push('Missing force modal strategy');
if (!hasPopupRecovery) issues.push('Missing popup recovery');
if (foundFunctions.length < criticalFunctions.length) issues.push('Missing critical functions');

if (issues.length === 0) {
  console.log('  ✅ No critical issues found!');
} else {
  console.log('  ❌ Found', issues.length, 'critical issues:');
  issues.forEach(issue => console.log('    -', issue));
}

// 12. BACKGROUND SCRIPT CHECK
console.log('\n1️⃣2️⃣ BACKGROUND SCRIPT CHECK:');
const bgContent = fs.readFileSync('background.js', 'utf8');
const hasSupabaseUrl = bgContent.includes('https://ckeuqgiuetlwowjoecku.supabase.co');
const hasApiEndpoint = bgContent.includes('/functions/v1/generate-reply');
const hasTimeout = bgContent.includes('API_CONFIG');
console.log('  Supabase URL:', hasSupabaseUrl ? '✅ Configured' : '❌ Missing');
console.log('  API endpoint:', hasApiEndpoint ? '✅ Configured' : '❌ Missing');
console.log('  Timeout config:', hasTimeout ? '✅ Present' : '❌ Missing');

console.log('\n' + '='.repeat(60));
console.log('🎯 AUDIT COMPLETE - v3.7.0 FORCE-MODAL');
console.log('='.repeat(60));

// Final verdict
const score = [
  missingFiles.length === 0,
  manifest.version === versionInContent,
  openBraces === closeBraces,
  openParens === closeParens,
  hasForceModal && hasPopupRecovery,
  hasSupabaseUrl && hasApiEndpoint,
  foundFunctions.length === criticalFunctions.length
].filter(Boolean).length;

console.log('\n🏆 FINAL SCORE:', score + '/7');
if (score === 7) {
  console.log('✅ PERFECT! Extension is ready for deployment!');
} else if (score >= 5) {
  console.log('⚠️ GOOD but has minor issues to fix');
} else {
  console.log('❌ CRITICAL issues need immediate attention');
}
