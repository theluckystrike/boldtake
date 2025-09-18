# 🚨 URGENT: Extension ↔ Backend API Sync Issue

## **CRITICAL ERROR ANALYSIS**

### **🔍 THE PROBLEM:**
```
Error from background script: Unknown persona: witty. Available: indie-voice, spark-reply, the-counter, the-riff, viral-shot, signal-boost, expert, casual, professional, supportive
```

**Extension is sending:** `"witty"`  
**Backend expects:** `"indie-voice", "spark-reply", "the-counter", etc.`

---

## **📋 BACKEND AVAILABLE PERSONAS (FROM ERROR LOG):**
```javascript
const availableBackendPersonas = [
  "indie-voice",      // ✅ Available
  "spark-reply",      // ✅ Available  
  "the-counter",      // ✅ Available
  "the-riff",         // ✅ Available
  "viral-shot",       // ✅ Available
  "signal-boost",     // ✅ Available
  "expert",           // ✅ Available
  "casual",           // ✅ Available
  "professional",     // ✅ Available
  "supportive"        // ✅ Available
];
```

---

## **🔧 EXTENSION STRATEGY MAPPING (NEEDS FIXING):**

### **Current Extension Strategies:**
```javascript
const extensionStrategies = [
  "Engagement Indie Voice",    // Should map to: "indie-voice"
  "Engagement Spark Reply",    // Should map to: "spark-reply"
  "Engagement The Counter",    // Should map to: "the-counter"
  "The Riff",                  // Should map to: "the-riff"
  "The Viral Shot",            // Should map to: "viral-shot"
  "The Shout-Out"              // Should map to: "signal-boost"
];
```

### **❌ BROKEN MAPPING:**
The extension is somehow sending `"witty"` instead of the correct mapped persona names.

---

## **🚨 IMMEDIATE ACTION REQUIRED:**

### **FOR EXTENSION DEVELOPER (YOU):**

**1. Find the persona mapping function in `background.js`:**
```javascript
// Look for something like this:
function mapStrategyToPersona(strategy) {
  const mapping = {
    "Engagement Indie Voice": "indie-voice",
    "Engagement Spark Reply": "spark-reply", 
    "Engagement The Counter": "the-counter",
    "The Riff": "the-riff",
    "The Viral Shot": "viral-shot",
    "The Shout-Out": "signal-boost"
  };
  return mapping[strategy] || "indie-voice"; // Default fallback
}
```

**2. Check for old persona references:**
```bash
# Search for "witty" in all extension files:
grep -r "witty" *.js
```

**3. Verify the API call format:**
```javascript
// The API call should look like this:
const response = await chrome.runtime.sendMessage({
  type: 'GENERATE_REPLY',
  tweetText: tweetText,
  persona: mappedPersona, // This should be "indie-voice", NOT "witty"
  context: context
});
```

### **FOR BACKEND DEVELOPER:**

**1. Confirm available personas match the error message:**
```javascript
const supportedPersonas = [
  "indie-voice", "spark-reply", "the-counter", "the-riff", 
  "viral-shot", "signal-boost", "expert", "casual", 
  "professional", "supportive"
];
```

**2. Add debugging to see what persona is being received:**
```javascript
console.log('🔍 Received persona:', persona);
console.log('🔍 Available personas:', supportedPersonas);
```

---

## **🎯 TESTING PROTOCOL:**

### **Step 1: Extension Test**
1. Install latest extension
2. Start session  
3. Check console for persona being sent:
   ```
   🔍 Sending persona to backend: [PERSONA_NAME]
   ```

### **Step 2: Backend Test**  
1. Check backend logs for received persona
2. Verify persona exists in supported list
3. Confirm API response format

### **Step 3: Integration Test**
1. Test each of the 6 extension strategies
2. Verify all map to valid backend personas
3. Confirm AI replies are generated successfully

---

## **🚀 SUCCESS CRITERIA:**

**✅ Extension sends correct personas:**
- "Engagement Indie Voice" → `"indie-voice"`
- "Engagement Spark Reply" → `"spark-reply"`  
- "Engagement The Counter" → `"the-counter"`
- "The Riff" → `"the-riff"`
- "The Viral Shot" → `"viral-shot"`
- "The Shout-Out" → `"signal-boost"`

**✅ Backend receives and processes:**
- No more "Unknown persona" errors
- AI replies generated successfully
- All 6 strategies working

**✅ Console logs show:**
```
✅ AI reply passed quality check.
⌨️ Typing reply: [CONTEXTUAL AI REPLY]
```

---

## **⚡ URGENCY: PRODUCTION BLOCKING**

**This is the final piece needed for a fully functional extension.**

**Timeline:**
- **Diagnosis:** 30 minutes
- **Fix implementation:** 1 hour  
- **Testing verification:** 30 minutes

**Next Steps:**
1. Find and fix persona mapping in extension
2. Test API communication
3. Deploy final working version

---

*This sync issue is the last barrier to a perfect extension. Let's resolve it immediately.*
