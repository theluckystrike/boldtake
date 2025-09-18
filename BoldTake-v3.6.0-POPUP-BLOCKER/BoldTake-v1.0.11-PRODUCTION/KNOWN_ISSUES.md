# BoldTake Extension - Known Issues & Solutions

## 🚨 CRITICAL ISSUES

### Issue #1: debugLog Already Declared Error
**Status:** ✅ FIXED (2025-09-15)
**Symptoms:**
```
Uncaught SyntaxError: Identifier 'debugLog' has already been declared (at contentScript.js:1:1)
```

**Root Cause:**
- config.js was being loaded as a content script
- Both config.js and contentScript.js declared `debugLog`
- Duplicate identifier error

**Solution:**
```javascript
// manifest.json - Remove config.js from content_scripts
"js": ["supabase.min.js", "supabase-config.js", "auth.js", "contentScript.js"]
// NOT: ["config.js", ...]

// contentScript.js - Use self-contained logging
const DEBUG_MODE = false;
const debugLog = DEBUG_MODE ? console.log : () => {};
```

**Files Modified:**
- manifest.json (line 34)
- contentScript.js (lines 6-9)

---

### Issue #2: Extension Hangs on Reply Generation
**Status:** ✅ FIXED (2025-09-15)
**Symptoms:**
```
Extension stuck after:
"📊 Weighted selection: Engagement The Counter"
No timeout, hangs indefinitely
```

**Root Cause:**
- chrome.runtime.sendMessage had no timeout
- Backend API not responding
- Extension waits forever for response

**Solution:**
```javascript
// Add timeout wrapper to attemptGeneration function
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('API request timeout after 30 seconds')), 30000);
});

const messagePromise = chrome.runtime.sendMessage({...});
const response = await Promise.race([messagePromise, timeoutPromise]);
```

**Files Modified:**
- contentScript.js (lines 2636-2657)

---

### Issue #3: Backend API Not Responding
**Status:** ⚠️ ONGOING
**Symptoms:**
```
"Unknown backend error"
API calls fail silently
No replies generated
```

**Root Cause:**
- Supabase Edge Functions may not be deployed
- Configuration mismatch between extension and backend
- Authentication token issues

**Debugging Steps:**
1. Check Supabase configuration in background.js
2. Verify Edge Functions are deployed
3. Test API directly:
```bash
curl -X POST https://ckeuqgiuetlwowjoecku.supabase.co/functions/v1/generate-reply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"originalTweet": "test", "persona": "indie-voice"}'
```

**Temporary Workaround:**
- Extension now times out after 30s instead of hanging
- Shows clear error message for debugging

---

## ⚠️ KNOWN LIMITATIONS

### Modal vs Window Detection
**Description:** X.com sometimes opens replies in new windows instead of modals
**Impact:** Extension may not detect reply textarea correctly
**Workaround:** Extension retries with multiple selectors

### Rate Limiting
**Description:** X.com may rate limit after too many actions
**Impact:** Session may pause unexpectedly
**Workaround:** Built-in delays between actions (30s-5m)

### Authentication Refresh
**Description:** JWT tokens expire after time
**Impact:** API calls fail with auth errors
**Workaround:** User must re-login periodically

---

## 🔍 DEBUGGING PROCEDURES

### When Adding New Features

1. **Check for Conflicts:**
```bash
# Search for existing implementations
grep -r "feature_name" .
grep -r "similar_function" .
```

2. **Test in Isolation:**
```javascript
// Test new function separately before integration
async function testNewFeature() {
  console.log('Testing:', await newFeature());
}
```

3. **Add Timeout Protection:**
```javascript
// Always add timeouts to async operations
const result = await Promise.race([
  asyncOperation(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 30000)
  )
]);
```

### When Extension Fails

1. **Check Console Logs:**
   - Open Chrome DevTools
   - Check both extension console and page console
   - Look for error patterns

2. **Verify Configuration:**
```javascript
// In console
chrome.storage.local.get(null, (data) => console.log(data));
```

3. **Test Components Individually:**
```javascript
// Test background script
chrome.runtime.sendMessage({type: 'TEST'}, console.log);

// Test content script
console.log('Session stats:', sessionStats);
```

---

## 📊 ERROR PATTERNS

### Pattern: "Could not establish connection"
**Meaning:** Background script is not running or crashed
**Fix:** Reload extension in chrome://extensions

### Pattern: "Invalid token" or "JWT expired"
**Meaning:** Authentication token expired
**Fix:** User needs to log in again

### Pattern: "Rate limit exceeded"
**Meaning:** Too many API calls
**Fix:** Wait or reduce request frequency

### Pattern: "Network error" or "Failed to fetch"
**Meaning:** Internet connection issue or CORS problem
**Fix:** Check network, verify manifest permissions

---

## 🔧 QUICK FIX COMMANDS

### Reset Extension State
```javascript
// Clear all storage
chrome.storage.local.clear(() => console.log('Storage cleared'));

// Reset session
sessionStats = { isRunning: false, processed: 0, successful: 0 };
```

### Force Stop Session
```javascript
// Emergency stop
sessionStats.isRunning = false;
chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
```

### Enable Debug Mode
```javascript
// In contentScript.js, change line 7
const DEBUG_MODE = true; // Set to true for verbose logging
```

### Test API Directly
```javascript
// In background.js console
generateReplyWithSupabase('Test prompt', {strategy: 'indie-voice'})
  .then(console.log)
  .catch(console.error);
```

---

## 📝 ISSUE TEMPLATE

When documenting new issues, use this format:

```markdown
### Issue #X: [Brief Description]
**Status:** 🔴 OPEN / ⚠️ IN PROGRESS / ✅ FIXED
**First Reported:** [Date]
**Symptoms:**
- What user sees
- Error messages
- Console output

**Root Cause:**
- Technical explanation
- Why it happens
- Code references

**Solution/Workaround:**
- How to fix
- Code changes needed
- Temporary workarounds

**Files Affected:**
- File path (line numbers)
```

---

## 🔄 UPDATE HISTORY

- **2025-09-15:** Initial documentation created
- **2025-09-15:** Added debugLog conflict issue (FIXED)
- **2025-09-15:** Added timeout hang issue (FIXED)
- **2025-09-15:** Added backend API issue (ONGOING)

---

**Remember:** Update this document whenever you encounter and solve a new issue!
