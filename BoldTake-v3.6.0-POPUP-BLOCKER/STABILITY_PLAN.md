# BoldTake v1.1.0 - Stability Plan

## 🎯 Goal
Create a STABLE extension that reliably posts replies without constant fixes.

## 🔴 Current Issues
1. Modal gets stuck, page refreshes losing search filters
2. Console too quiet after debugLog changes  
3. Double commenting still happening
4. Too many small patches creating instability
5. Safety features too aggressive, blocking normal operation

## ✅ Core Requirements
1. **MUST** stay on search page with filters
2. **MUST** show progress in console
3. **MUST** prevent double comments
4. **MUST** handle stuck modals gracefully
5. **MUST** work reliably for 100+ tweets

## 🏗️ Architecture Decisions

### 1. Logging Strategy
```javascript
// THREE levels of logging
const CRITICAL_LOG = console.log;  // Always show
const INFO_LOG = console.log;      // Normal operation
const DEBUG_LOG = () => {};        // Only when debugging
```

### 2. Modal Recovery Strategy
```javascript
// NO PAGE REFRESH - Skip problematic tweets instead
// 1. Try to close modal (3 methods)
// 2. If stuck, mark tweet as failed
// 3. Continue to next tweet
// 4. NEVER reload page
```

### 3. Safety Settings
```javascript
// BALANCED - Not too aggressive
BURST_LIMIT: 5 actions/10min (was 3/5min)
HOURLY_LIMIT: 20 (was 12)
MIN_DELAY: 90 seconds (was 120)
```

### 4. Double Comment Prevention
```javascript
// TRIPLE CHECK
1. Check if liked before processing
2. Like immediately after reply
3. Store replied tweet IDs in session
```

## 📝 Implementation Plan

### Phase 1: Core Stability
- [ ] Fix logging to show progress
- [ ] Remove ALL page refreshes
- [ ] Implement tweet skip on failure
- [ ] Store current URL for session

### Phase 2: Safety Balance
- [ ] Adjust limits to reasonable levels
- [ ] Add override for testing
- [ ] Show safety status in UI

### Phase 3: Testing Protocol
- [ ] Test 10 tweets on search page
- [ ] Test 50 tweets without refresh
- [ ] Test modal recovery
- [ ] Test double comment prevention

## 🚫 What NOT to Do
1. NO page refreshes
2. NO overly complex recovery
3. NO aggressive safety limits
4. NO silent failures
5. NO feature creep

## 📊 Success Metrics
- Can process 100 tweets without refresh
- Stays on filtered search page
- No double comments
- Clear console progress
- < 5% failure rate

## 🔧 Code Patterns

### Pattern 1: Safe Tweet Processing
```javascript
async function processTweet(tweet) {
  try {
    // Check if already processed
    if (isProcessed(tweet)) return false;
    
    // Try to reply
    const success = await tryReply(tweet);
    
    // Mark as processed regardless
    markProcessed(tweet);
    
    return success;
  } catch (error) {
    CRITICAL_LOG('Tweet failed:', error);
    markFailed(tweet);
    return false;
  }
}
```

### Pattern 2: Modal Handling
```javascript
async function handleModal() {
  const maxAttempts = 3;
  
  for (let i = 0; i < maxAttempts; i++) {
    if (await tryCloseModal()) {
      return false; // Skip tweet
    }
    await sleep(1000);
  }
  
  // Don't refresh, just skip
  return false;
}
```

## 🎯 Final Goal
A boring, reliable extension that just works.
