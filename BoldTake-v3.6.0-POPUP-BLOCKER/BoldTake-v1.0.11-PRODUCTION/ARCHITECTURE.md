# BoldTake Professional - Extension Architecture

## Overview

BoldTake Professional is a Chrome Extension for X.com (Twitter) automation with AI-powered reply generation. This document outlines the architectural patterns, coding standards, and best practices for the extension.

## 🏗️ Architecture Principles

### Separation of Concerns

The extension follows a clear separation of concerns pattern:

- **Background Script** (`background.js`): Service worker for API communication and session management
- **Content Script** (`contentScript.js`): DOM manipulation and X.com interaction
- **Popup Script** (`popup.js`): User interface and settings management
- **Configuration** (`config.js`): Centralized configuration management
- **Authentication** (`auth.js`): Authentication logic and session handling

### Clear Naming Conventions

#### File Naming
- **Scripts**: `camelCase.js` (e.g., `contentScript.js`, `background.js`)
- **Configuration**: `config.js`, `manifest.json`
- **Documentation**: `UPPERCASE.md` (e.g., `ARCHITECTURE.md`, `README.md`)

#### Variable Naming
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `SUPABASE_URL`, `MAX_RETRIES`)
- **Functions**: `camelCase` (e.g., `generateReply`, `handleAuthentication`)
- **Configuration Objects**: `camelCase` with descriptive prefixes (e.g., `supabaseConfig`, `apiEndpoints`)

#### CSS Classes
- **Components**: `kebab-case` (e.g., `.activity-feed`, `.session-status`)
- **States**: `kebab-case` with state suffix (e.g., `.btn-disabled`, `.status-running`)
- **Utilities**: `kebab-case` with utility prefix (e.g., `.u-hidden`, `.u-text-center`)

### Predictable File Structure

```
boldtake-3/
├── manifest.json              # Extension manifest
├── config.js                  # Centralized configuration
├── background.js              # Service worker
├── contentScript.js           # DOM interaction
├── popup.js                   # UI management
├── popup.html                 # UI structure
├── auth.js                    # Authentication logic
├── supabase-config.js         # Supabase client setup
├── supabase.min.js           # Supabase library
├── icon.png                   # Extension icon
├── ARCHITECTURE.md            # This file
├── README.md                  # User documentation
└── docs/                      # Additional documentation
    ├── API.md                 # API documentation
    ├── DEPLOYMENT.md          # Deployment guide
    └── TROUBLESHOOTING.md     # Common issues
```

## 🔧 Coding Patterns

### Services Pattern

Services handle specific business logic and are organized by domain:

```javascript
// API Service - handles all external API calls
const APIService = {
    async generateReply(prompt, context) { /* ... */ },
    async checkSubscription() { /* ... */ },
    async validateSession() { /* ... */ }
};

// Storage Service - handles all chrome.storage operations
const StorageService = {
    async get(keys) { /* ... */ },
    async set(data) { /* ... */ },
    async remove(keys) { /* ... */ }
};

// UI Service - handles UI state management
const UIService = {
    updateSessionStatus(status) { /* ... */ },
    showNotification(message, type) { /* ... */ },
    togglePanel(panelId) { /* ... */ }
};
```

### Actions Pattern

Actions represent discrete user operations and coordinate between services:

```javascript
// Authentication Actions
const AuthActions = {
    async login(email, password) {
        const result = await APIService.authenticate(email, password);
        if (result.success) {
            await StorageService.set({ userSession: result.session });
            UIService.updateAuthState(true);
        }
        return result;
    },
    
    async logout() {
        await APIService.signOut();
        await StorageService.remove(['userSession']);
        UIService.updateAuthState(false);
    }
};

// Session Actions
const SessionActions = {
    async start(settings) {
        await StorageService.set({ sessionSettings: settings });
        const result = await APIService.startSession(settings);
        UIService.updateSessionStatus('running');
        return result;
    },
    
    async stop() {
        await APIService.stopSession();
        UIService.updateSessionStatus('stopped');
    }
};
```

### Configuration Management

All configuration is centralized in `config.js`:

```javascript
// ✅ Good - Centralized configuration
const config = window.BoldTakeConfig.getConfig('api');
const apiUrl = window.BoldTakeConfig.getApiUrl('/functions/v1/generate-reply');

// ❌ Bad - Hardcoded values
const apiUrl = 'https://ckeuqgiuetlwowjoecku.supabase.co/functions/v1/generate-reply';
```

### Error Handling Pattern

Consistent error handling across all components:

```javascript
async function apiCall(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        window.BoldTakeConfig.errorLog('API call failed:', error);
        throw new Error(`API Error: ${error.message}`);
    }
}
```

## 📡 Communication Patterns

### Message Passing

Structured message passing between extension components:

```javascript
// Message Types (defined in config.js)
const MESSAGE_TYPES = {
    GENERATE_REPLY: 'GENERATE_REPLY',
    SESSION_START: 'SESSION_START',
    SESSION_STOP: 'SESSION_STOP',
    AUTH_UPDATE: 'AUTH_UPDATE'
};

// Message Structure
const message = {
    type: MESSAGE_TYPES.GENERATE_REPLY,
    payload: {
        prompt: 'Tweet content...',
        context: { strategy: 'indie-voice' }
    },
    timestamp: Date.now(),
    requestId: generateUniqueId()
};
```

### Event Handling

Consistent event handling patterns:

```javascript
// Event Listeners with error handling
function setupEventListeners() {
    document.getElementById('start-btn').addEventListener('click', async (event) => {
        try {
            event.preventDefault();
            await SessionActions.start(getSessionSettings());
        } catch (error) {
            window.BoldTakeConfig.errorLog('Start session failed:', error);
            UIService.showNotification('Failed to start session', 'error');
        }
    });
}
```

## 🔐 Security Patterns

### Authentication Flow

```javascript
// Secure authentication with proper token handling
class AuthManager {
    async authenticate(email, password) {
        const result = await this.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        // Store session securely
        await chrome.storage.local.set({
            [window.BoldTakeConfig.getConfig('storage').userSession]: result.data.session
        });
        
        return result.data;
    }
}
```

### API Security

```javascript
// Secure API calls with proper headers
async function secureApiCall(endpoint, data) {
    const session = await getStoredSession();
    if (!session?.access_token) {
        throw new Error('Authentication required');
    }
    
    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
    });
}
```

## 🎨 UI Patterns

### Component Structure

```html
<!-- Consistent component structure -->
<div class="component-name">
    <div class="component-header">
        <h3 class="component-title">Component Title</h3>
        <div class="component-actions">
            <button class="btn btn-primary">Action</button>
        </div>
    </div>
    <div class="component-content">
        <!-- Component content -->
    </div>
</div>
```

### State Management

```javascript
// UI state management pattern
class UIStateManager {
    constructor() {
        this.state = {
            isAuthenticated: false,
            sessionRunning: false,
            currentPanel: 'dashboard'
        };
    }
    
    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }
    
    render() {
        // Update UI based on current state
        this.updateAuthUI();
        this.updateSessionUI();
        this.updatePanelUI();
    }
}
```

## 📊 Data Flow

### Request Flow

1. **User Action** → Popup UI
2. **UI Event** → Action Handler
3. **Action** → Service Layer
4. **Service** → API Call
5. **Response** → State Update
6. **State** → UI Render

### Data Storage Flow

```javascript
// Consistent data storage pattern
const DataManager = {
    async saveUserSettings(settings) {
        const storageKeys = window.BoldTakeConfig.getConfig('storage');
        await chrome.storage.local.set({
            [storageKeys.language]: settings.language,
            [storageKeys.tone]: settings.tone,
            [storageKeys.keyword]: settings.keyword
        });
    },
    
    async loadUserSettings() {
        const storageKeys = window.BoldTakeConfig.getConfig('storage');
        const result = await chrome.storage.local.get([
            storageKeys.language,
            storageKeys.tone,
            storageKeys.keyword
        ]);
        
        return {
            language: result[storageKeys.language] || 'english',
            tone: result[storageKeys.tone] || 'professional',
            keyword: result[storageKeys.keyword] || 'startup'
        };
    }
};
```

## 🧪 Testing Patterns

### Unit Testing Structure

```javascript
// Test structure for extension components
describe('APIService', () => {
    beforeEach(() => {
        // Setup test environment
        global.chrome = mockChromeAPI();
        global.fetch = mockFetch();
    });
    
    describe('generateReply', () => {
        it('should generate reply successfully', async () => {
            const result = await APIService.generateReply('test prompt');
            expect(result).toBeDefined();
            expect(result.reply).toBeTruthy();
        });
        
        it('should handle API errors gracefully', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));
            await expect(APIService.generateReply('test')).rejects.toThrow();
        });
    });
});
```

## 📝 Documentation Standards

### Code Comments

```javascript
/**
 * Generates an AI reply for a given tweet context
 * 
 * @param {string} prompt - The tweet content to reply to
 * @param {Object} context - Additional context for reply generation
 * @param {string} context.strategy - The reply strategy to use
 * @param {string} context.language - Target language for the reply
 * @returns {Promise<string>} The generated reply text
 * @throws {Error} When API call fails or authentication is invalid
 */
async function generateReply(prompt, context = {}) {
    // Implementation...
}
```

### API Documentation

All API interactions should be documented with:
- Endpoint URL
- Request/Response format
- Error codes and handling
- Authentication requirements
- Rate limiting information

## 🚀 Deployment Patterns

### Version Management

```javascript
// Version checking and migration
const VersionManager = {
    async checkVersion() {
        const currentVersion = window.BoldTakeConfig.getConfig('extension').version;
        const storedVersion = await StorageService.get('extension_version');
        
        if (storedVersion !== currentVersion) {
            await this.migrate(storedVersion, currentVersion);
            await StorageService.set({ extension_version: currentVersion });
        }
    },
    
    async migrate(fromVersion, toVersion) {
        // Handle data migration between versions
    }
};
```

### Environment Configuration

```javascript
// Environment-specific configuration
const ENV_CONFIG = {
    development: {
        debugMode: true,
        apiTimeout: 60000,
        logLevel: 'debug'
    },
    production: {
        debugMode: false,
        apiTimeout: 30000,
        logLevel: 'error'
    }
};
```

## 🔄 Maintenance Patterns

### Health Checks

```javascript
// System health monitoring
const HealthChecker = {
    async performHealthCheck() {
        const checks = [
            this.checkApiConnectivity(),
            this.checkAuthentication(),
            this.checkStorageAccess(),
            this.checkPermissions()
        ];
        
        const results = await Promise.allSettled(checks);
        return this.generateHealthReport(results);
    }
};
```

### Performance Monitoring

```javascript
// Performance tracking
const PerformanceMonitor = {
    startTimer(operation) {
        this.timers[operation] = performance.now();
    },
    
    endTimer(operation) {
        const duration = performance.now() - this.timers[operation];
        this.logPerformance(operation, duration);
        delete this.timers[operation];
    }
};
```

## 📋 Code Review Checklist

### Before Submitting Code

- [ ] Configuration values are centralized in `config.js`
- [ ] Error handling follows established patterns
- [ ] Functions are properly documented with JSDoc
- [ ] UI components follow naming conventions
- [ ] Security best practices are implemented
- [ ] Performance considerations are addressed
- [ ] Tests are written for new functionality
- [ ] Code follows established architectural patterns

### Security Review

- [ ] No hardcoded secrets or API keys
- [ ] Proper input validation and sanitization
- [ ] Secure authentication token handling
- [ ] HTTPS-only API communications
- [ ] Proper error message handling (no sensitive data leaks)

### Performance Review

- [ ] Efficient DOM manipulation
- [ ] Proper async/await usage
- [ ] Memory leak prevention
- [ ] Optimized API calls (batching, caching)
- [ ] Minimal background script resource usage

---

This architecture document serves as the foundation for maintaining and extending the BoldTake Professional Chrome Extension. All code changes should align with these patterns and principles to ensure consistency, maintainability, and reliability.
