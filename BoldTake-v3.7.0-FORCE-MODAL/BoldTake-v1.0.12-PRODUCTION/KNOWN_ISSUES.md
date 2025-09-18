# BoldTake Extension - Known Issues & Solutions

## 🔴 Critical Issues (Fixed)

### Issue #1: debugLog Already Declared Error
**Status**: ✅ FIXED in v1.0.10
**Error**: `Uncaught SyntaxError: Identifier 'debugLog' has already been declared`
**Root Cause**: config.js was being loaded as content script, causing duplicate declarations
**Solution**: 
- Removed config.js from manifest.json content_scripts
- Made contentScript.js self-contained with its own logging functions
**Commit**: Fixed in v1.0.10

### Issue #2: Service Worker Import Failure
**Status**: ✅ FIXED in v1.0.11
**Error**: `Failed to execute 'importScripts' on 'WorkerGlobalScope'`
**Root Cause**: Service workers cannot import ES6 modules
**Solution**: 
- Removed importScripts from background.js
- Hardcoded necessary configuration directly in service worker
**Commit**: Fixed in v1.0.11

### Issue #3: API Request Timeout
**Status**: ✅ FIXED in v1.0.11
**Error**: Extension hangs after "Weighted selection" message
**Root Cause**: No timeout on chrome.runtime.sendMessage calls
**Solution**: 
- Added 30-second timeout using Promise.race
- Implemented proper error handling for timeouts
**Commit**: Fixed in v1.0.11

### Issue #4: Modal Gets Stuck
**Status**: ✅ FIXED in v1.0.11
**Error**: Reply modal doesn't close or gets stuck
**Root Cause**: X.com sometimes opens replies in new windows instead of modals
**Solution**: 
- Added detection for new window URLs (/compose/post)
- Implemented multiple recovery mechanisms
- Added window.close() for new windows
**Commit**: Fixed in v1.0.11

### Issue #5: Double Commenting on Same Tweet
**Status**: ✅ FIXED in v1.0.12
**Error**: Extension replies multiple times to the same tweet
**Root Cause**: Like button not working properly to mark tweets as processed
**Solution**: 
- Created enhanced `likeTweetSafely()` function with verification
- Added better detection of already-liked tweets
- Implemented fallback marking for failed likes
- Added 1.5s delay after reply before attempting to like
**Commit**: Fixed in v1.0.12

---

## ⚠️ Potential Issues (Monitoring)

### Issue #6: Authentication Token Expiry
**Status**: 🟡 MONITORING
**Symptoms**: "User not authenticated" errors after extended use
**Workaround**: Re-login through extension popup
**Long-term Solution**: Implement token refresh mechanism

### Issue #7: Rate Limiting
**Status**: 🟡 MONITORING
**Symptoms**: Replies stop generating after high volume
**Workaround**: Built-in 2-5 minute delays between tweets
**Note**: This is by design for account safety

---

## 🔵 Known Limitations

### Limitation #1: Language Detection
**Current State**: Relies on user selection, not auto-detection
**Impact**: May reply in wrong language if user forgets to set
**Future Enhancement**: Add automatic language detection

### Limitation #2: Media Tweets
**Current State**: Limited handling of tweets with images/videos
**Impact**: May not properly analyze context from media
**Future Enhancement**: Add media context analysis

---

## 🛠️ Debugging Quick Reference

### For Double Comment Issues:
```javascript
// Check in console:
document.querySelectorAll('[data-testid="unlike"]').length
// This shows how many tweets are already liked

// Check specific tweet:
tweet.querySelector('[data-testid="unlike"]') // If exists, already liked
```

### For Modal Issues:
```javascript
// Check if in new window:
window.location.href.includes('/compose/post')
```

### For Auth Issues:
```javascript
// Check stored session:
chrome.storage.local.get(['boldtake_user_session'], (result) => {
  console.log('Session:', result);
});
```

---

## 📝 Issue Reporting Template

When reporting new issues, include:
1. **Error Message**: Exact console error
2. **Steps to Reproduce**: What were you doing?
3. **Browser Version**: Chrome version number
4. **Extension Version**: Current BoldTake version
5. **Console Logs**: Last 10-20 lines before error

---

## 🔄 Update History

- **2025-09-15**: Added Issue #5 (Double Commenting) - FIXED in v1.0.12
- **2025-09-15**: Added Issues #1-4 from v1.0.10-11 fixes
- **2025-09-15**: Created initial known issues document

---

**Note**: This document is actively maintained. Check for updates before debugging.