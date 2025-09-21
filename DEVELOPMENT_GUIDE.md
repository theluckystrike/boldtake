# BoldTake Professional - Complete Development Guide

## 🎯 **SYSTEMATIC DEVELOPMENT APPROACH**

This guide implements a programmatic, cold systematic approach to BoldTake development with clear separation of concerns, predictable patterns, and bulletproof workflows.

---

## 📋 **PRE-DEVELOPMENT CHECKLIST**

### **Phase 1: Planning & Analysis**
- [ ] **Requirements Analysis**
  - [ ] Define exact feature requirements
  - [ ] Identify affected components
  - [ ] Map data flow and dependencies
  - [ ] Estimate complexity (Simple/Medium/Complex)

- [ ] **Architecture Review**
  - [ ] Review current codebase patterns
  - [ ] Identify reusable components
  - [ ] Plan new component structure
  - [ ] Document integration points

- [ ] **Risk Assessment**
  - [ ] Identify potential breaking changes
  - [ ] Plan rollback strategy
  - [ ] Define testing requirements
  - [ ] Set deployment timeline

### **Phase 2: Environment Setup**
- [ ] **Development Environment**
  - [ ] Clean git working directory
  - [ ] Create feature branch: `feature/[feature-name]`
  - [ ] Backup current working version
  - [ ] Set up debugging tools

- [ ] **Documentation Preparation**
  - [ ] Create feature documentation template
  - [ ] Plan changelog entries
  - [ ] Prepare testing checklist
  - [ ] Set up progress tracking

---

## 🏗️ **COMPONENT ARCHITECTURE PATTERNS**

### **File Organization Standards**

```
boldtake-3/
├── Core Extension Files
│   ├── manifest.json              # Extension configuration
│   ├── background.js              # Service worker (API + messaging)
│   ├── contentScript.js           # DOM manipulation + X.com interaction
│   ├── popup.js                   # UI management + user interactions
│   ├── popup.html                 # UI structure + styling
│   ├── auth.js                    # Authentication + session management
│   ├── config.js                  # Configuration + constants
│   └── sidepanel.js               # Side panel logic + real-time updates
│
├── External Dependencies
│   ├── supabase-config.js         # Supabase client configuration
│   └── supabase.min.js            # Supabase SDK
│
├── Documentation (ALWAYS MAINTAIN)
│   ├── DEVELOPMENT_GUIDE.md       # This file
│   ├── ARCHITECTURE.md            # System architecture
│   ├── KNOWN_ISSUES.md            # Bug tracking
│   ├── TESTING_GUIDE.md           # Testing protocols
│   └── DEPLOYMENT_GUIDE.md        # Deployment procedures
│
└── Versioned Packages
    └── BoldTake-v{X.Y.Z}/         # Production packages
```

### **Separation of Concerns**

#### **Background Script (`background.js`)**
```javascript
// RESPONSIBILITIES:
// - API communication with Supabase
// - Message passing between components
// - Session state management
// - Service worker lifecycle

// PATTERN:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'API_REQUEST':
      handleApiRequest(message.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open
    
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});
```

#### **Content Script (`contentScript.js`)**
```javascript
// RESPONSIBILITIES:
// - DOM manipulation on X.com
// - Tweet detection and processing
// - User interaction simulation
// - Real-time logging to side panel

// PATTERN:
class TwitterInteractionManager {
  constructor() {
    this.isSessionActive = false;
    this.sessionStats = {};
    this.recentActivities = [];
  }
  
  async processPage() {
    try {
      const tweets = await this.findTweets();
      for (const tweet of tweets) {
        await this.processTweet(tweet);
      }
    } catch (error) {
      this.sessionLog(`Error: ${error.message}`, 'error');
    }
  }
  
  sessionLog(message, type = 'info') {
    // Send to side panel
    chrome.runtime.sendMessage({
      type: 'SESSION_LOG',
      data: { message, type }
    }).catch(() => {});
    
    // Console logging in debug mode
    if (this.debugMode) {
      console.log(`[BoldTake] ${message}`);
    }
  }
}
```

#### **Popup Script (`popup.js`)**
```javascript
// RESPONSIBILITIES:
// - User interface management
// - Settings persistence
// - Authentication flow
// - Tab navigation

// PATTERN:
class PopupManager {
  constructor() {
    this.authManager = null;
    this.currentTab = 'settings';
  }
  
  async initialize() {
    await this.initializeAuth();
    this.setupEventListeners();
    this.updateUI();
  }
  
  setupEventListeners() {
    // Use event delegation for dynamic content
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-start')) {
        this.handleStartSession();
      }
    });
  }
}
```

#### **Authentication (`auth.js`)**
```javascript
// RESPONSIBILITIES:
// - User authentication
// - Session management
// - Subscription status
// - Token refresh

// PATTERN:
class BoldTakeAuthManager {
  constructor() {
    this.authState = {
      isAuthenticated: false,
      user: null,
      subscription: null
    };
  }
  
  async handleLogin(email, password) {
    try {
      const result = await window.BoldTakeAuth.signInUser(email, password);
      if (result.success) {
        this.authState.isAuthenticated = true;
        this.authState.user = result.user;
        await this.refreshSubscriptionStatus();
        this.notifyAuthChange();
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

---

## 🧩 **COMPONENT TEMPLATES**

### **New Feature Component Template**

```javascript
/**
 * [COMPONENT_NAME] - [Brief Description]
 * 
 * RESPONSIBILITIES:
 * - [Primary responsibility]
 * - [Secondary responsibility]
 * 
 * DEPENDENCIES:
 * - [External dependency 1]
 * - [External dependency 2]
 * 
 * INTEGRATION POINTS:
 * - [Integration point 1]
 * - [Integration point 2]
 */

class [ComponentName] {
  constructor(options = {}) {
    // Configuration
    this.config = {
      ...this.getDefaultConfig(),
      ...options
    };
    
    // State management
    this.state = this.getInitialState();
    
    // Error handling
    this.errorHandler = this.config.errorHandler || this.defaultErrorHandler;
    
    // Initialize
    this.initialize();
  }
  
  getDefaultConfig() {
    return {
      debug: false,
      timeout: 30000,
      retries: 3
    };
  }
  
  getInitialState() {
    return {
      isInitialized: false,
      isActive: false,
      lastError: null
    };
  }
  
  async initialize() {
    try {
      await this.setup();
      this.state.isInitialized = true;
      this.log('Component initialized successfully');
    } catch (error) {
      this.handleError('Initialization failed', error);
    }
  }
  
  async setup() {
    // Override in subclasses
    throw new Error('setup() must be implemented');
  }
  
  log(message, type = 'info') {
    if (this.config.debug) {
      console.log(`[${this.constructor.name}] ${message}`);
    }
  }
  
  handleError(context, error) {
    this.state.lastError = { context, error, timestamp: Date.now() };
    this.errorHandler(context, error);
  }
  
  defaultErrorHandler(context, error) {
    console.error(`[${this.constructor.name}] ${context}:`, error);
  }
  
  destroy() {
    // Cleanup resources
    this.state.isActive = false;
    this.log('Component destroyed');
  }
}
```

### **API Integration Template**

```javascript
/**
 * API Service Template
 */
class ApiService {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      timeout: 30000,
      retries: 3,
      ...options
    };
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers
      },
      ...options
    };
    
    return this.executeWithRetry(() => this.fetchWithTimeout(url, config));
  }
  
  async fetchWithTimeout(url, config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
    
    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  async executeWithRetry(operation, attempt = 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt < this.options.retries && this.isRetryableError(error)) {
        await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        return this.executeWithRetry(operation, attempt + 1);
      }
      throw error;
    }
  }
  
  isRetryableError(error) {
    return error.name === 'AbortError' || 
           error.message.includes('network') ||
           error.message.includes('timeout');
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getAuthHeaders() {
    // Override in subclasses
    return {};
  }
}
```

---

## 🔄 **STEP-BY-STEP INTEGRATION INSTRUCTIONS**

### **Phase 1: Feature Planning**

1. **Create Feature Branch**
   ```bash
   cd /Users/mike/boldtake-3
   git checkout -b feature/[feature-name]
   git push -u origin feature/[feature-name]
   ```

2. **Document Feature Requirements**
   ```markdown
   # Feature: [Feature Name]
   
   ## Requirements
   - [ ] Requirement 1
   - [ ] Requirement 2
   
   ## Affected Files
   - [ ] File 1 - [Changes needed]
   - [ ] File 2 - [Changes needed]
   
   ## Integration Points
   - [ ] Integration 1
   - [ ] Integration 2
   
   ## Testing Plan
   - [ ] Test case 1
   - [ ] Test case 2
   ```

### **Phase 2: Implementation**

1. **Follow Component Template**
   - Use appropriate template from above
   - Implement error handling
   - Add comprehensive logging
   - Include timeout mechanisms

2. **Implement in Order**
   ```
   1. Core logic (no UI)
   2. Error handling
   3. Integration points
   4. UI components
   5. Event listeners
   6. Testing hooks
   ```

3. **Code Review Checklist**
   - [ ] Follows established patterns
   - [ ] Includes error handling
   - [ ] Has timeout protection
   - [ ] Logs important events
   - [ ] No hardcoded values
   - [ ] Proper variable naming
   - [ ] Comments explain "why" not "what"

### **Phase 3: Testing**

1. **Unit Testing**
   ```javascript
   // Test individual functions
   describe('[ComponentName]', () => {
     test('should initialize correctly', () => {
       const component = new ComponentName();
       expect(component.state.isInitialized).toBe(true);
     });
   });
   ```

2. **Integration Testing**
   - Test component interactions
   - Verify message passing
   - Check error propagation
   - Validate state management

3. **Manual Testing**
   - Load extension in Chrome
   - Test all user flows
   - Verify error scenarios
   - Check performance impact

---

## 🧪 **TESTING PROTOCOLS**

### **Automated Testing**

#### **JavaScript Syntax Validation**
```bash
# Run syntax check
node -c contentScript.js
node -c popup.js
node -c background.js
node -c auth.js
```

#### **Extension Validation**
```bash
# Run extension validator
node validate-extension.js
```

#### **Unit Tests**
```javascript
// test/component.test.js
const { ComponentName } = require('../src/component.js');

describe('ComponentName', () => {
  let component;
  
  beforeEach(() => {
    component = new ComponentName();
  });
  
  afterEach(() => {
    component.destroy();
  });
  
  test('should handle errors gracefully', async () => {
    // Test error scenarios
    const result = await component.handleInvalidInput();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### **Manual Testing Checklist**

#### **Core Functionality**
- [ ] Extension loads without errors
- [ ] Authentication works correctly
- [ ] Session management functions
- [ ] API calls succeed with proper error handling
- [ ] UI updates reflect state changes

#### **Error Scenarios**
- [ ] Network disconnection
- [ ] Invalid credentials
- [ ] API timeouts
- [ ] Malformed responses
- [ ] Rate limiting

#### **Performance Testing**
- [ ] Memory usage stays stable
- [ ] No memory leaks detected
- [ ] Response times acceptable
- [ ] CPU usage reasonable
- [ ] Extension doesn't slow down browser

#### **Cross-Browser Testing**
- [ ] Chrome (latest)
- [ ] Chrome (previous version)
- [ ] Edge (if applicable)

---

## 🚀 **DEPLOYMENT STRATEGIES**

### **Version Management**

#### **Semantic Versioning**
```
MAJOR.MINOR.PATCH
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes
```

#### **Version Increment Rules**
- **Patch (x.x.X)**: Bug fixes, small improvements
- **Minor (x.X.x)**: New features, UI improvements
- **Major (X.x.x)**: Architecture changes, breaking changes

### **Deployment Process**

#### **Step 1: Pre-Deployment Validation**
```bash
# 1. Run all tests
npm test

# 2. Validate extension
node validate-extension.js

# 3. Check syntax
node -c *.js

# 4. Verify no console errors in manual test
```

#### **Step 2: Version Update**
```bash
# Update version in manifest.json
# Update CHANGELOG.md
# Commit changes
git add .
git commit -m "v[X.Y.Z] - [Brief description]"
```

#### **Step 3: Package Creation**
```bash
# Create versioned directory
mkdir BoldTake-v[X.Y.Z]

# Copy core files
cp manifest.json background.js contentScript.js popup.js popup.html auth.js supabase-config.js supabase.min.js config.js icon.png sidepanel.html sidepanel.js BoldTake-v[X.Y.Z]/

# Create ZIP package
zip -r BoldTake-v[X.Y.Z].zip BoldTake-v[X.Y.Z]/

# Copy to Downloads for testing
cp BoldTake-v[X.Y.Z].zip ~/Downloads/
cd ~/Downloads && unzip -o BoldTake-v[X.Y.Z].zip
```

#### **Step 4: Git Management**
```bash
# Push to repository
git push origin [branch-name]

# Create release tag
git tag v[X.Y.Z]
git push origin v[X.Y.Z]
```

### **Deployment Environments**

#### **Development**
- Local testing
- Debug logging enabled
- Frequent iterations

#### **Staging**
- Production-like environment
- Full feature testing
- Performance validation

#### **Production**
- Chrome Web Store
- Debug logging disabled
- Monitoring enabled

---

## 🔄 **ROLLBACK PROCEDURES**

### **Immediate Rollback (Critical Issues)**

#### **Step 1: Identify Last Known Good Version**
```bash
# Check git history
git log --oneline -10

# Identify stable version
git tag -l | sort -V | tail -5
```

#### **Step 2: Emergency Rollback**
```bash
# Revert to last stable version
git checkout v[STABLE_VERSION]

# Create emergency package
mkdir BoldTake-v[STABLE_VERSION]-EMERGENCY
cp [core files] BoldTake-v[STABLE_VERSION]-EMERGENCY/
zip -r BoldTake-v[STABLE_VERSION]-EMERGENCY.zip BoldTake-v[STABLE_VERSION]-EMERGENCY/
```

#### **Step 3: Communicate Issue**
- Update KNOWN_ISSUES.md
- Document the problem
- Plan proper fix

### **Planned Rollback (Feature Removal)**

#### **Step 1: Create Rollback Branch**
```bash
git checkout -b rollback/[feature-name]
```

#### **Step 2: Remove Feature Code**
- Revert specific commits
- Remove feature-related code
- Update documentation

#### **Step 3: Test Rollback**
- Verify functionality
- Run full test suite
- Manual testing

#### **Step 4: Deploy Rollback**
- Follow normal deployment process
- Increment patch version
- Document rollback reason

---

## ⚠️ **COMMON PITFALLS AND SOLUTIONS**

### **Chrome Extension Specific**

#### **Pitfall: Content Script Conflicts**
```javascript
// WRONG: Global variables conflict
var debugLog = console.log;

// RIGHT: Encapsulated logging
const BoldTakeLogger = {
  debugMode: false,
  log: function(message) {
    if (this.debugMode) console.log(`[BoldTake] ${message}`);
  }
};
```

#### **Pitfall: Message Passing Timeouts**
```javascript
// WRONG: No timeout handling
chrome.runtime.sendMessage({type: 'API_CALL'}, response => {
  // May never execute if background script is busy
});

// RIGHT: Timeout protection
const sendMessageWithTimeout = (message, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, timeout);
    
    chrome.runtime.sendMessage(message, response => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
};
```

#### **Pitfall: DOM Manipulation Race Conditions**
```javascript
// WRONG: Immediate DOM access
const button = document.querySelector('[data-testid="reply"]');
button.click(); // May fail if element not ready

// RIGHT: Wait for element
const waitForElement = (selector, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element);
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
};
```

### **Authentication Issues**

#### **Pitfall: Token Expiration**
```javascript
// WRONG: No token refresh
async function apiCall() {
  const response = await fetch('/api/endpoint', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}

// RIGHT: Automatic token refresh
async function apiCall() {
  try {
    const response = await fetch('/api/endpoint', {
      headers: { Authorization: `Bearer ${await getValidToken()}` }
    });
    return response.json();
  } catch (error) {
    if (error.status === 401) {
      await refreshToken();
      return apiCall(); // Retry once
    }
    throw error;
  }
}
```

### **Performance Issues**

#### **Pitfall: Memory Leaks**
```javascript
// WRONG: Event listeners not cleaned up
function setupListeners() {
  document.addEventListener('click', handleClick);
  setInterval(updateStats, 1000);
}

// RIGHT: Proper cleanup
class ComponentManager {
  constructor() {
    this.listeners = [];
    this.intervals = [];
  }
  
  addListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.listeners.push({ element, event, handler });
  }
  
  addInterval(callback, delay) {
    const id = setInterval(callback, delay);
    this.intervals.push(id);
    return id;
  }
  
  destroy() {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.intervals.forEach(id => clearInterval(id));
    this.listeners = [];
    this.intervals = [];
  }
}
```

### **Error Handling**

#### **Pitfall: Silent Failures**
```javascript
// WRONG: Errors swallowed
try {
  await processData();
} catch (error) {
  // Silent failure
}

// RIGHT: Proper error handling
try {
  await processData();
} catch (error) {
  this.logError('Data processing failed', error);
  this.notifyUser('Processing failed. Please try again.');
  this.reportError(error); // Send to monitoring
  throw error; // Re-throw if caller needs to handle
}
```

---

## 📊 **MONITORING AND DEBUGGING**

### **Debug Logging Strategy**

```javascript
class DebugLogger {
  constructor(component, enabled = false) {
    this.component = component;
    this.enabled = enabled;
    this.logs = [];
  }
  
  log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      component: this.component,
      level,
      message,
      data
    };
    
    this.logs.push(entry);
    
    if (this.enabled) {
      console.log(`[${this.component}] ${level.toUpperCase()}: ${message}`, data);
    }
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }
  
  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }
  
  getLogs(level = null) {
    return level ? this.logs.filter(log => log.level === level) : this.logs;
  }
  
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

### **Performance Monitoring**

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }
  
  startTimer(name) {
    this.metrics.set(name, { start: performance.now() });
  }
  
  endTimer(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.duration = performance.now() - metric.start;
      metric.end = performance.now();
    }
  }
  
  getMetric(name) {
    return this.metrics.get(name);
  }
  
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }
  
  logSlowOperations(threshold = 1000) {
    for (const [name, metric] of this.metrics) {
      if (metric.duration > threshold) {
        console.warn(`Slow operation detected: ${name} took ${metric.duration}ms`);
      }
    }
  }
}
```

---

## 🎯 **QUALITY GATES**

### **Pre-Commit Checklist**
- [ ] All tests pass
- [ ] No console errors
- [ ] Code follows established patterns
- [ ] Documentation updated
- [ ] Version incremented appropriately

### **Pre-Deployment Checklist**
- [ ] Manual testing completed
- [ ] Performance validated
- [ ] Error scenarios tested
- [ ] Rollback plan prepared
- [ ] Monitoring configured

### **Post-Deployment Checklist**
- [ ] Extension loads successfully
- [ ] Core functionality verified
- [ ] Error rates monitored
- [ ] User feedback collected
- [ ] Performance metrics reviewed

---

## 📚 **REFERENCE PATTERNS**

### **Message Passing Pattern**
```javascript
// Background to Content Script
chrome.tabs.sendMessage(tabId, {
  type: 'START_SESSION',
  data: { settings }
}, response => {
  if (chrome.runtime.lastError) {
    console.error('Message failed:', chrome.runtime.lastError.message);
  }
});

// Content Script to Background
chrome.runtime.sendMessage({
  type: 'SESSION_UPDATE',
  data: { stats }
}).catch(error => {
  console.error('Message failed:', error);
});
```

### **State Management Pattern**
```javascript
class StateManager {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = [];
  }
  
  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    this.notifyListeners(prevState, this.state);
  }
  
  getState() {
    return { ...this.state };
  }
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  notifyListeners(prevState, newState) {
    this.listeners.forEach(listener => {
      try {
        listener(newState, prevState);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }
}
```

### **Error Boundary Pattern**
```javascript
class ErrorBoundary {
  constructor(component) {
    this.component = component;
    this.errorCount = 0;
    this.maxErrors = 5;
    this.resetTime = 60000; // 1 minute
  }
  
  async execute(operation, context = 'unknown') {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, context);
      throw error;
    }
  }
  
  handleError(error, context) {
    this.errorCount++;
    
    console.error(`[${this.component}] Error in ${context}:`, error);
    
    if (this.errorCount >= this.maxErrors) {
      console.error(`[${this.component}] Too many errors, entering safe mode`);
      this.enterSafeMode();
    }
    
    // Reset error count after timeout
    setTimeout(() => {
      this.errorCount = Math.max(0, this.errorCount - 1);
    }, this.resetTime);
  }
  
  enterSafeMode() {
    // Disable non-essential features
    // Notify user
    // Log to monitoring system
  }
}
```

---

## 🔧 **DEVELOPMENT TOOLS**

### **Validation Script**
```javascript
// validate-extension.js
const fs = require('fs');
const path = require('path');

class ExtensionValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }
  
  validate() {
    this.validateManifest();
    this.validateFiles();
    this.validateSyntax();
    this.generateReport();
  }
  
  validateManifest() {
    try {
      const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
      
      // Check required fields
      const required = ['manifest_version', 'name', 'version'];
      required.forEach(field => {
        if (!manifest[field]) {
          this.errors.push(`Missing required field: ${field}`);
        }
      });
      
      // Validate version format
      if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        this.errors.push('Invalid version format. Use X.Y.Z');
      }
      
    } catch (error) {
      this.errors.push(`Invalid manifest.json: ${error.message}`);
    }
  }
  
  validateFiles() {
    const requiredFiles = [
      'background.js',
      'contentScript.js',
      'popup.js',
      'popup.html',
      'auth.js'
    ];
    
    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.errors.push(`Missing required file: ${file}`);
      }
    });
  }
  
  validateSyntax() {
    const jsFiles = [
      'background.js',
      'contentScript.js',
      'popup.js',
      'auth.js',
      'config.js'
    ];
    
    jsFiles.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          // Basic syntax check
          new Function(content);
        } catch (error) {
          this.errors.push(`Syntax error in ${file}: ${error.message}`);
        }
      }
    });
  }
  
  generateReport() {
    console.log('\n=== EXTENSION VALIDATION REPORT ===\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All validations passed!');
      return;
    }
    
    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    console.log(`\nTotal: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

// Run validation
new ExtensionValidator().validate();
```

---

This comprehensive development guide provides a systematic, programmatic approach to BoldTake development with clear patterns, templates, and procedures. Follow this guide for consistent, maintainable, and reliable code development.
