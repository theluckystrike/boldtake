# BoldTake Extension - Debugging Guide

## 🔍 Quick Diagnostic Commands

### Check Extension Health
```javascript
// Run in extension background page console (chrome://extensions → BoldTake → background page)

// 1. Check configuration
console.log('Config loaded:', typeof BoldTakeConfig !== 'undefined');

// 2. Test API connection
fetch('https://ckeuqgiuetlwowjoecku.supabase.co/functions/v1/generate-reply', {
  method: 'OPTIONS'
}).then(r => console.log('API reachable:', r.status));

// 3. Check authentication
chrome.storage.local.get(['boldtake_user_session'], (data) => {
  console.log('Auth status:', data.boldtake_user_session ? 'Logged in' : 'Not logged in');
});
```

### Check Content Script Status
```javascript
// Run in X.com page console while extension is active

// 1. Check if content script loaded
console.log('BoldTake loaded:', typeof sessionStats !== 'undefined');

// 2. View current session state
console.log('Session stats:', sessionStats);

// 3. Check for errors
console.log('Last API error:', sessionStats?.lastApiError);

// 4. Force session status
sessionStats.isRunning = false; // Emergency stop
```

---

## 🚨 Common Problems & Solutions

### Problem 1: Extension Not Starting

**Symptoms:**
- Click "Start Session" but nothing happens
- No activity in console
- Session status stays "Ready"

**Debug Steps:**
```javascript
// 1. Check if on correct page
console.log('URL:', window.location.href);
// Must be on x.com/search with query params

// 2. Check storage
chrome.storage.local.get(['boldtake_keyword', 'isNewSession'], console.log);

// 3. Check content script
chrome.tabs.query({active: true}, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, {type: 'TEST'}, console.log);
});
```

**Solutions:**
- Reload the extension
- Refresh X.com page
- Check keyword is set in popup

---

### Problem 2: Stuck on "Weighted Selection"

**Console Output:**
```
📊 Weighted selection: Engagement The Counter (0.0% vs 25% target)
[No further output]
```

**Debug Steps:**
```javascript
// 1. Check if message was sent
console.log('Checking for pending messages...');

// 2. In background console, check for errors
chrome.runtime.lastError

// 3. Test API directly
const testPayload = {
  originalTweet: "Test tweet",
  persona: "indie-voice"
};
fetch('YOUR_API_URL', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(testPayload)
}).then(r => r.json()).then(console.log);
```

**Solutions:**
- Extension now has 30s timeout (v1.0.9-TIMEOUT-FIX)
- Check backend is running
- Verify API credentials

---

### Problem 3: "debugLog Already Declared" Error

**Console Output:**
```
Uncaught SyntaxError: Identifier 'debugLog' has already been declared
```

**Debug Steps:**
```javascript
// Check manifest.json content_scripts
// Should NOT include config.js

// Correct:
"js": ["supabase.min.js", "supabase-config.js", "auth.js", "contentScript.js"]

// Wrong:
"js": ["config.js", "supabase.min.js", ...]
```

**Solution:**
- Use BoldTake-v1.0.9-ACTUALLY-FIXED.zip
- Or manually remove config.js from manifest.json

---

## 🛠️ Advanced Debugging Techniques

### Enable Verbose Logging

**Step 1: Enable in contentScript.js**
```javascript
// Line 7 - Change to true
const DEBUG_MODE = true;
```

**Step 2: Enable in background.js**
```javascript
// Line 16 - Change to false
const config = { ...BoldTakeConfig.config, extension: { productionMode: false } };
```

**Step 3: View detailed logs**
```
// You'll now see:
- Every DOM query
- All API calls
- Detailed error messages
- Performance metrics
```

### Monitor Network Traffic

**Chrome DevTools Network Tab:**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "supabase"
4. Look for:
   - Red requests (failures)
   - Long duration (>5s is problematic)
   - Status codes (400/401/500)

### Trace Message Flow

**Add trace logging:**
```javascript
// In contentScript.js
console.trace('📍 Sending message to background');
chrome.runtime.sendMessage({...});

// In background.js
chrome.runtime.onMessage.addListener((msg) => {
  console.trace('📍 Received message:', msg.type);
});
```

---

## 📊 Performance Profiling

### Check for Memory Leaks
```javascript
// Monitor memory usage
const checkMemory = () => {
  if (performance.memory) {
    console.log('Memory:', {
      used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB'
    });
  }
};
setInterval(checkMemory, 5000);
```

### Measure Operation Time
```javascript
// Wrap slow operations
console.time('API_CALL');
const response = await chrome.runtime.sendMessage({...});
console.timeEnd('API_CALL'); // Shows: API_CALL: 1234.56ms
```

---

## 🔄 State Recovery Procedures

### Reset Everything
```javascript
// Nuclear option - clear all data
chrome.storage.local.clear();
chrome.storage.sync.clear();
sessionStorage.clear();
localStorage.clear();
location.reload();
```

### Reset Session Only
```javascript
// Soft reset - keep auth
sessionStats = {
  isRunning: false,
  processed: 0,
  successful: 0,
  failed: 0,
  lastApiError: null
};
chrome.storage.local.set({ isNewSession: false });
```

### Force Refresh Authentication
```javascript
// In popup console
window.BoldTakeAuthManager.refreshSubscriptionStatus()
  .then(() => console.log('✅ Auth refreshed'))
  .catch(console.error);
```

---

## 📝 Debug Log Interpretation

### Understanding Console Prefixes
```
🚀 = Initialization
📊 = Statistics/Metrics
✅ = Success
❌ = Error
⚠️ = Warning
🔄 = Retry/Loop
⏱️ = Timeout
🎯 = Target/Action
💥 = Critical Error
🛡️ = Safety/Protection
```

### Reading Activity Feed
```
[14:23] 🎯 Handling Reply Modal      // Started reply process
[14:23] ✅ Found text area           // DOM element located
[14:23] 📊 Weighted selection        // Choosing AI persona
[14:53] ⏱️ API timeout              // 30s timeout triggered
```

### Error Severity Levels
- **INFO**: Normal operation messages
- **WARNING**: Recoverable issues
- **ERROR**: Operation failed but session continues
- **CRITICAL**: Session-ending errors

---

## 🚀 Quick Fix Scripts

### Fix Stuck Modal
```javascript
// Close any open modals
document.querySelectorAll('[role="dialog"]').forEach(d => d.remove());
document.body.style.overflow = 'auto';
```

### Force Continue Session
```javascript
// Skip current tweet and continue
sessionStats.processed++;
performanceCache.tweets.data = null;
```

### Test Individual Components
```javascript
// Test tweet detection
const tweets = document.querySelectorAll('[data-testid="tweet"]');
console.log(`Found ${tweets.length} tweets`);

// Test reply button
const replyBtn = tweets[0]?.querySelector('[data-testid="reply"]');
replyBtn?.click();

// Test textarea
const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
console.log('Textarea found:', !!textarea);
```

---

## 📞 Getting Help

### Information to Provide

When reporting issues, include:

1. **Version**: Check manifest.json
2. **Error Messages**: Full console output
3. **Steps to Reproduce**: Exact sequence
4. **Browser**: Chrome version
5. **Screenshots**: If UI-related

### Debug Bundle Command
```javascript
// Collect all debug info at once
const debugInfo = {
  version: chrome.runtime.getManifest().version,
  url: window.location.href,
  sessionStats: typeof sessionStats !== 'undefined' ? sessionStats : 'Not loaded',
  lastError: chrome.runtime.lastError,
  storage: await chrome.storage.local.get(null),
  timestamp: new Date().toISOString()
};
console.log('Debug Bundle:', JSON.stringify(debugInfo, null, 2));
```

---

## 🔄 Update Log

- **2025-09-15**: Initial debugging guide created
- **2025-09-15**: Added timeout debugging section
- **2025-09-15**: Added performance profiling
- **2025-09-15**: Added quick fix scripts

---

**Remember:** When in doubt, check the console first!
