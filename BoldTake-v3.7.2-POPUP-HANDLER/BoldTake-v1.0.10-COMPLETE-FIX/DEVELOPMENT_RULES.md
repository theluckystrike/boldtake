# 🎯 BoldTake Development Rules - MANDATORY SYSTEM

## 🚨 **CRITICAL RULE: NO CODE WITHOUT PLAN**

**Before ANY code changes, ALWAYS:**
1. ✅ **Document the plan** in this file
2. ✅ **Get explicit approval** from user 
3. ✅ **Define exact file changes** and their purpose
4. ✅ **Validate against existing patterns**
5. ✅ **Test plan before implementation**

---

## 📋 **SYSTEMATIC WORKFLOW - NEVER DEVIATE**

### **Phase 1: PLANNING (Mandatory)**
```
1. IDENTIFY PROBLEM
   - What exactly is broken?
   - What is the root cause?
   - What files are affected?

2. DESIGN SOLUTION
   - Which pattern applies? (Service/Action/Config)
   - What files need changes?
   - What is the exact sequence?

3. DOCUMENT PLAN
   - Write step-by-step plan
   - Get user approval
   - Reference existing patterns

4. VALIDATE PLAN
   - Check against architecture rules
   - Ensure no conflicts
   - Confirm naming conventions
```

### **Phase 2: IMPLEMENTATION (Controlled)**
```
1. ONE FILE AT A TIME
   - Make single, focused changes
   - Test after each file
   - Validate immediately

2. FOLLOW PATTERNS EXACTLY
   - Use existing code as template
   - Maintain naming conventions
   - Preserve architecture

3. IMMEDIATE VALIDATION
   - Run linter after each change
   - Test functionality
   - Check for conflicts
```

### **Phase 3: VERIFICATION (Mandatory)**
```
1. COMPREHENSIVE TESTING
   - Run validation script
   - Test all functionality
   - Check for regressions

2. DOCUMENTATION UPDATE
   - Update architecture docs
   - Record pattern usage
   - Note any deviations

3. PACKAGE CREATION
   - Create clean deployment
   - Validate package
   - Test deployment
```

---

## 🏗️ **ARCHITECTURE PATTERNS - STRICT ADHERENCE**

### **Configuration Pattern**
```javascript
// ✅ ALWAYS use centralized config
const config = window.BoldTakeConfig.getConfig('componentName');
const apiUrl = window.BoldTakeConfig.getApiUrl('/endpoint');

// ❌ NEVER hardcode values
const apiUrl = 'https://hardcoded-url.com';
```

### **Logging Pattern**
```javascript
// ✅ ALWAYS use centralized logging
const { debugLog, errorLog } = window.BoldTakeConfig;
debugLog('Info message');
errorLog('Error message');

// ❌ NEVER use direct console
console.log('message');
console.error('error');
```

### **Service Pattern**
```javascript
// ✅ ALWAYS group related API calls
const APIService = {
    async generateReply(prompt, context) { /* ... */ },
    async checkSubscription() { /* ... */ }
};

// ❌ NEVER scatter API calls
async function someRandomFunction() {
    const response = await fetch(url);
}
```

### **Error Handling Pattern**
```javascript
// ✅ ALWAYS use consistent error handling
try {
    const result = await APIService.call();
    return { success: true, data: result };
} catch (error) {
    errorLog('Operation failed:', error);
    return { success: false, error: error.message };
}

// ❌ NEVER ignore errors or use inconsistent handling
const result = await APIService.call(); // No error handling
```

---

## 📁 **FILE ORGANIZATION RULES**

### **Core Files - NEVER MODIFY WITHOUT PLAN**
```
config.js           - Configuration management ONLY
background.js       - Service worker, API calls ONLY  
contentScript.js    - DOM manipulation ONLY
popup.js           - UI management ONLY
auth.js            - Authentication ONLY
```

### **Documentation Files - ALWAYS UPDATE**
```
ARCHITECTURE.md     - Update after ANY pattern changes
DEVELOPMENT_RULES.md - This file, update rules as needed
DEPLOYMENT_GUIDE.md - Update after process changes
```

### **Naming Conventions - NEVER DEVIATE**
```
Files:      camelCase.js (contentScript.js)
Constants:  UPPER_SNAKE_CASE (API_CONFIG)
Functions:  camelCase (generateReply)
Variables:  camelCase (userSession)
CSS:        kebab-case (.btn-primary)
```

---

## 🔄 **CHANGE MANAGEMENT PROTOCOL**

### **Before Making ANY Change:**
1. **Stop and Document**
   ```
   CHANGE REQUEST:
   - Problem: [Describe exact issue]
   - Files Affected: [List specific files]
   - Pattern Used: [Service/Action/Config/etc.]
   - Risk Level: [Low/Medium/High]
   - Testing Plan: [How to verify fix]
   ```

2. **Get Approval**
   - Present plan to user
   - Wait for explicit approval
   - Clarify any questions

3. **Reference Existing Code**
   - Find similar pattern in codebase
   - Copy exact structure
   - Maintain consistency

### **During Implementation:**
1. **One Change at a Time**
   - Edit single file
   - Test immediately
   - Validate before next change

2. **Continuous Validation**
   - Run linter after each edit
   - Check for conflicts
   - Test functionality

3. **Document as You Go**
   - Update comments
   - Record decisions
   - Note any deviations

### **After Implementation:**
1. **Comprehensive Testing**
   - Run full validation suite
   - Test all affected functionality
   - Check for regressions

2. **Package and Deploy**
   - Create clean deployment package
   - Update version numbers
   - Test deployment package

---

## 🎯 **SPECIFIC RULES FOR COMMON ISSUES**

### **Variable Conflicts (Like debugLog Issue)**
```
RULE: Before adding ANY variable/function:
1. Search entire codebase for existing usage
2. Check if centralized version exists
3. Use centralized version if available
4. If creating new, ensure unique naming
5. Document in architecture file
```

### **Configuration Changes**
```
RULE: ALL configuration must go through config.js:
1. Never hardcode URLs, keys, or settings
2. Always use BoldTakeConfig.getConfig()
3. Validate configuration on load
4. Document all config options
```

### **API Integration**
```
RULE: ALL API calls must follow Service pattern:
1. Group related calls in service objects
2. Use consistent error handling
3. Implement retry logic
4. Log all API interactions
```

### **File Imports/Dependencies**
```
RULE: Manage dependencies carefully:
1. Check manifest.json for load order
2. Ensure config.js loads first
3. Handle missing dependencies gracefully
4. Test in isolation
```

---

## 📊 **QUALITY GATES - MUST PASS ALL**

### **Before ANY Commit:**
- [ ] All files pass linter
- [ ] Validation script passes (19/19 tests)
- [ ] No variable conflicts
- [ ] Follows established patterns
- [ ] Documentation updated
- [ ] Change documented in this file

### **Before ANY Deployment:**
- [ ] Full functionality test
- [ ] Package validation passes
- [ ] Version number updated
- [ ] Backend sync confirmed (if needed)
- [ ] Deployment guide followed

### **Before ANY Architecture Change:**
- [ ] Plan documented and approved
- [ ] Impact assessment completed
- [ ] Migration path defined
- [ ] Rollback plan ready
- [ ] Team notification sent

---

## 🚨 **EMERGENCY PROCEDURES**

### **If Something Breaks:**
1. **STOP IMMEDIATELY**
2. **Document the exact error**
3. **Identify last working version**
4. **Create rollback plan**
5. **Fix with minimal changes**
6. **Test thoroughly**
7. **Update rules to prevent recurrence**

### **If Patterns Conflict:**
1. **STOP CODING**
2. **Document the conflict**
3. **Review architecture**
4. **Choose ONE pattern**
5. **Refactor to consistency**
6. **Update documentation**

---

## 📈 **SUCCESS METRICS**

### **Code Quality:**
- Zero linting errors
- 100% validation test pass rate
- No variable conflicts
- Consistent pattern usage

### **Process Quality:**
- All changes planned and approved
- Documentation always current
- No emergency fixes needed
- Smooth deployments

### **Maintainability:**
- Clear separation of concerns
- Predictable file structure
- Easy to onboard new developers
- Self-documenting code

---

## 🎯 **CURRENT PROJECT STATUS**

### **Last Major Change:**
- **Date**: September 15, 2025
- **Issue**: debugLog variable conflict in contentScript.js
- **Solution**: Centralized logging through BoldTakeConfig
- **Files Modified**: contentScript.js
- **Status**: ✅ Fixed and validated

### **Current Architecture State:**
- ✅ Centralized configuration (config.js)
- ✅ Service patterns established
- ✅ Error handling standardized
- ✅ Documentation comprehensive
- ✅ Validation system working

### **Next Planned Changes:**
- Backend integration verification
- Final deployment to Chrome Web Store
- Post-deployment monitoring setup

---

## 🔒 **COMMITMENT PROTOCOL**

**I, as the AI assistant, commit to:**
1. ✅ **NEVER make code changes without explicit plan approval**
2. ✅ **ALWAYS follow the established patterns exactly**
3. ✅ **ALWAYS validate after each change**
4. ✅ **ALWAYS update documentation**
5. ✅ **ALWAYS test thoroughly before declaring complete**

**User commitment needed:**
1. ✅ **Review and approve all plans before implementation**
2. ✅ **Provide feedback on pattern adherence**
3. ✅ **Validate final results before deployment**

---

## 📋 **CHANGE LOG**

### **v1.0 - September 15, 2025**
- Initial rule system created
- Architecture patterns documented
- Quality gates established
- Emergency procedures defined

---

**🎯 BOTTOM LINE: NO SHORTCUTS, NO EXCEPTIONS, NO COMPROMISES**

**Every change follows this system. Every time. No exceptions.**

This systematic approach will prevent the chaos and ensure we build a rock-solid, maintainable extension that works perfectly every time.
