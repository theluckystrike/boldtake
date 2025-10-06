/**
 * BoldTake Professional v5.0 - Background Service Worker
 * Secure Architecture: All AI generation routed through Supabase Edge Functions
 * 
 * This service worker handles:
 * - AI reply generation through Supabase Edge Functions
 * - Session management and authentication
 * - Message routing between content script and popup
 * - Error handling and retry logic
 */

// Configuration for service worker
const SUPABASE_URL = 'https://ckeuqgiuetlwowjoecku.supabase.co';
const API_ENDPOINT = '/functions/v1/generate-reply';

// Storage keys
const STORAGE_CONFIG = {
  userSession: 'boldtake_user_session',
  authToken: 'sb-ckeuqgiuetlwowjoecku-auth-token',
  usageStats: 'boldtake_usage_stats'
};

// API configuration
const API_CONFIG = {
  timeout: 30000
};

// Session configuration  
const SESSION_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000
};

// Auto-restart configuration
const AUTO_RESTART_CONFIG = {
  enabled: true,
  intervalMs: 60 * 60 * 1000, // 1 hour in milliseconds
  storageKey: 'boldtake_auto_restart_settings',
  crashDetection: true,
  crashRecoveryDelayMs: 5000, // 5 seconds after crash detection
  maxCrashesBeforeRestart: 3,
  memoryCheckIntervalMs: 5 * 60 * 1000 // Check memory every 5 minutes
};

// Logging functions
const debugLog = (...args) => console.log('[BoldTake]', ...args);
const errorLog = (...args) => console.error('[BoldTake Error]', ...args);

// --- Auto-Restart Mechanism ---

let autoRestartInterval = null;
let lastRestartTime = null;
let crashCounter = 0;
let memoryCheckInterval = null;
let lastMemoryCheck = null;
let isRefreshing = false; // Lock to prevent concurrent refreshes
let lastRefreshAttempt = 0; // Timestamp of last refresh attempt
const MIN_REFRESH_INTERVAL = 30000; // Minimum 30 seconds between refreshes

/**
 * Performs a hard browser refresh (Ctrl+Shift+R equivalent) on X.com tabs
 * Enhanced with crash recovery and cache clearing for "Aw, Snap" errors
 */
async function performHardRefresh(options = {}) {
  try {
    const { clearCache = false, reason = 'scheduled' } = options;
    
    // CRITICAL FIX: Prevent refresh loop with lock and cooldown
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshAttempt;
    
    if (isRefreshing) {
      debugLog('⚠️ Refresh already in progress - skipping to prevent loop');
      return { success: false, message: 'Refresh already in progress' };
    }
    
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      const waitTime = Math.ceil((MIN_REFRESH_INTERVAL - timeSinceLastRefresh) / 1000);
      debugLog(`⏳ Cooldown active - must wait ${waitTime}s before next refresh`);
      return { success: false, message: `Cooldown active - wait ${waitTime}s` };
    }
    
    // Set lock and update timestamp
    isRefreshing = true;
    lastRefreshAttempt = now;
    
    debugLog(`🔄 Auto-restart: Performing hard refresh (reason: ${reason})...`);
    
    // Get all tabs with X.com or Twitter.com
    const tabs = await chrome.tabs.query({
      url: ['https://x.com/*', 'https://twitter.com/*']
    });
    
    if (tabs.length === 0) {
      debugLog('⚠️ Auto-restart: No X.com tabs found to refresh');
      return { success: false, message: 'No X.com tabs found' };
    }
    
    // Clear browser cache if requested (helps with "Aw, Snap" errors)
    if (clearCache) {
      debugLog('🧹 Clearing browser cache to fix potential corruption...');
      await clearBrowserCache();
    }
    
    // Store the current restart time
    lastRestartTime = new Date().toISOString();
    await chrome.storage.local.set({
      'boldtake_last_auto_restart': lastRestartTime
    });
    
    // Reset crash counter after successful restart
    crashCounter = 0;
    
    // Perform hard refresh on each tab
    for (const tab of tabs) {
      try {
        // Check if tab is crashed first
        if (tab.status === 'unloaded' || !tab.url) {
          debugLog(`⚠️ Tab ${tab.id} appears to be crashed, attempting recovery...`);
        }
        
        // Method 1: Use chrome.tabs.reload with bypassCache flag for hard refresh
        await chrome.tabs.reload(tab.id, { bypassCache: true });
        debugLog(`✅ Auto-restart: Hard refresh performed on tab ${tab.id} (${tab.title || 'Crashed Tab'})`);
        
        // Wait a bit before injecting script to ensure page starts loading
        setTimeout(() => {
          // Inject a script to clear any localStorage/sessionStorage if needed
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Clear any extension-related session data that might be stuck
              try {
                // Clear session storage
                if (window.sessionStorage) {
                  const keysToRemove = [];
                  for (let i = 0; i < window.sessionStorage.length; i++) {
                    const key = window.sessionStorage.key(i);
                    if (key && (key.includes('boldtake') || key.includes('twitter') || key.includes('x.com'))) {
                      keysToRemove.push(key);
                    }
                  }
                  keysToRemove.forEach(key => window.sessionStorage.removeItem(key));
                }
                
                // Also clear problematic localStorage items
                if (window.localStorage) {
                  const localKeysToRemove = [];
                  for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    // Clear temporary/cache-like data that might be corrupted
                    if (key && (key.includes('cache') || key.includes('temp') || key.includes('draft'))) {
                      localKeysToRemove.push(key);
                    }
                  }
                  localKeysToRemove.forEach(key => window.localStorage.removeItem(key));
                }
                
                console.log('[BoldTake] Auto-restart: Cleared session and cache data');
              } catch (e) {
                console.error('[BoldTake] Auto-restart: Error clearing data:', e);
              }
            }
          }).catch(err => {
            // Script injection might fail if tab is still loading, that's okay
            debugLog('⚠️ Script injection failed (expected during reload):', err.message);
          });
        }, 1000);
        
      } catch (error) {
        errorLog(`❌ Auto-restart: Failed to refresh tab ${tab.id}:`, error);
        
        // If reload fails, try to recreate the tab
        if (error.message.includes('No tab with id') || error.message.includes('Cannot access')) {
          debugLog('🔧 Attempting to recreate crashed tab...');
          try {
            await chrome.tabs.create({ url: 'https://x.com/', active: false });
            debugLog('✅ Created new X.com tab to replace crashed one');
          } catch (createError) {
            errorLog('❌ Failed to create replacement tab:', createError);
          }
        }
      }
    }
    
    // Log the restart event
    const restartEvent = {
      timestamp: lastRestartTime,
      tabsRefreshed: tabs.length,
      success: true,
      reason: reason,
      cacheCleared: clearCache
    };
    
    // Store in activity log
    await storeRestartEvent(restartEvent);
    
    debugLog(`🎯 Auto-restart: Completed - ${tabs.length} tab(s) refreshed`);
    
    // Release lock after successful completion
    isRefreshing = false;
    
    return { success: true, tabsRefreshed: tabs.length, timestamp: lastRestartTime };
    
  } catch (error) {
    errorLog('❌ Auto-restart: Critical error during hard refresh:', error);
    
    // CRITICAL: Always release lock even on error
    isRefreshing = false;
    
    return { success: false, error: error.message };
  }
}

/**
 * Clears browser cache to help fix "Aw, Snap" errors
 */
async function clearBrowserCache() {
  try {
    // Clear cache for the last hour to avoid clearing everything
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    await chrome.browsingData.remove({
      "since": oneHourAgo,
      "origins": ["https://x.com", "https://twitter.com"]
    }, {
      "cache": true,
      "cookies": false, // Don't clear cookies to maintain login
      "localStorage": false // Keep localStorage for settings
    });
    
    debugLog('✅ Browser cache cleared for X.com');
  } catch (error) {
    errorLog('⚠️ Failed to clear browser cache:', error);
  }
}

/**
 * Stores auto-restart events for tracking
 */
async function storeRestartEvent(event) {
  try {
    const storage = await chrome.storage.local.get('boldtake_auto_restart_log');
    let restartLog = storage.boldtake_auto_restart_log || [];
    
    // Keep only last 50 events
    if (restartLog.length >= 50) {
      restartLog = restartLog.slice(-49);
    }
    
    restartLog.push(event);
    await chrome.storage.local.set({ 'boldtake_auto_restart_log': restartLog });
  } catch (error) {
    debugLog('Failed to store restart event:', error);
  }
}

/**
 * Detects tab crashes and initiates recovery
 */
async function detectAndRecoverFromCrashes() {
  try {
    // CRITICAL FIX: Don't check for crashes if we're already refreshing
    if (isRefreshing) {
      debugLog('⏭️ Skipping crash detection - refresh in progress');
      return;
    }
    
    // CRITICAL FIX: Respect cooldown period
    const timeSinceLastRefresh = Date.now() - lastRefreshAttempt;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      debugLog('⏭️ Skipping crash detection - in cooldown period');
      return;
    }
    
    const tabs = await chrome.tabs.query({
      url: ['https://x.com/*', 'https://twitter.com/*']
    });
    
    let crashedTabs = 0;
    
    for (const tab of tabs) {
      // Check for signs of crashed tabs
      if (tab.status === 'unloaded' || 
          (tab.title && tab.title.includes('Error')) ||
          (tab.title && tab.title.includes('Aw, Snap'))) {
        crashedTabs++;
        debugLog(`🚨 Detected crashed tab: ${tab.id}`);
      }
    }
    
    if (crashedTabs > 0) {
      crashCounter += crashedTabs;
      debugLog(`⚠️ Total crashes detected: ${crashCounter}`);
      
      // If we've seen too many crashes, perform a hard refresh with cache clear
      if (crashCounter >= AUTO_RESTART_CONFIG.maxCrashesBeforeRestart) {
        debugLog('🔧 Multiple crashes detected - initiating recovery with cache clear...');
        await performHardRefresh({ 
          clearCache: true, 
          reason: `crash_recovery (${crashCounter} crashes)` 
        });
        crashCounter = 0; // Reset after recovery
      } else {
        // Perform a regular refresh for minor crashes (with delay)
        debugLog(`⏳ Scheduling crash recovery in ${AUTO_RESTART_CONFIG.crashRecoveryDelayMs / 1000}s...`);
        setTimeout(async () => {
          // Double-check we're not in cooldown before executing
          const timeSinceLastRefresh = Date.now() - lastRefreshAttempt;
          if (timeSinceLastRefresh >= MIN_REFRESH_INTERVAL && !isRefreshing) {
            await performHardRefresh({ reason: 'crash_detected' });
          } else {
            debugLog('⏭️ Skipping scheduled crash recovery - cooldown active');
          }
        }, AUTO_RESTART_CONFIG.crashRecoveryDelayMs);
      }
    }
  } catch (error) {
    errorLog('Error in crash detection:', error);
  }
}

/**
 * Monitors memory usage and triggers restart if needed
 */
async function monitorMemoryUsage() {
  try {
    // Check if chrome.system.memory is available
    if (!chrome.system || !chrome.system.memory) {
      debugLog('⚠️ Memory monitoring not available in this environment');
      return;
    }
    
    chrome.system.memory.getInfo((info) => {
      const usedMemoryPercent = ((info.capacity - info.availableCapacity) / info.capacity) * 100;
      
      debugLog(`📊 Memory usage: ${usedMemoryPercent.toFixed(1)}%`);
      lastMemoryCheck = {
        timestamp: new Date().toISOString(),
        usedPercent: usedMemoryPercent,
        availableMB: Math.round(info.availableCapacity / 1024 / 1024)
      };
      
      // If memory usage is critically high, trigger a restart
      if (usedMemoryPercent > 90) {
        debugLog('⚠️ Critical memory usage detected - triggering restart...');
        performHardRefresh({ 
          clearCache: true, 
          reason: `high_memory (${usedMemoryPercent.toFixed(1)}%)` 
        });
      }
    });
  } catch (error) {
    debugLog('Memory monitoring error:', error);
  }
}

/**
 * Initializes the auto-restart mechanism
 */
async function initializeAutoRestart() {
  try {
    // Load settings from storage
    const storage = await chrome.storage.local.get(AUTO_RESTART_CONFIG.storageKey);
    const settings = storage[AUTO_RESTART_CONFIG.storageKey] || {
      enabled: AUTO_RESTART_CONFIG.enabled,
      intervalMs: AUTO_RESTART_CONFIG.intervalMs,
      crashDetection: AUTO_RESTART_CONFIG.crashDetection
    };
    
    // Clear any existing intervals
    if (autoRestartInterval) {
      clearInterval(autoRestartInterval);
      autoRestartInterval = null;
    }
    if (memoryCheckInterval) {
      clearInterval(memoryCheckInterval);
      memoryCheckInterval = null;
    }
    
    if (!settings.enabled) {
      debugLog('⏸️ Auto-restart: Feature disabled');
      return;
    }
    
    // Set up the main restart interval
    autoRestartInterval = setInterval(async () => {
      debugLog('⏰ Auto-restart: Timer triggered');
      const result = await performHardRefresh({ reason: 'scheduled' });
      
      // Notify popup if it's open
      chrome.runtime.sendMessage({
        type: 'AUTO_RESTART_PERFORMED',
        result: result
      }).catch(() => {
        // Popup might not be open, that's fine
      });
    }, settings.intervalMs);
    
    // Set up crash detection if enabled
    if (settings.crashDetection) {
      // Check for crashes every 30 seconds
      setInterval(() => {
        detectAndRecoverFromCrashes();
      }, 30000);
      
      debugLog('🛡️ Crash detection enabled');
    }
    
    // Set up memory monitoring
    memoryCheckInterval = setInterval(() => {
      monitorMemoryUsage();
    }, AUTO_RESTART_CONFIG.memoryCheckIntervalMs);
    
    debugLog(`✅ Auto-restart: Initialized with ${settings.intervalMs / 1000 / 60} minute interval`);
    debugLog('✅ Memory monitoring: Active');
    
    // Store initialization time
    await chrome.storage.local.set({
      'boldtake_auto_restart_initialized': new Date().toISOString()
    });
    
  } catch (error) {
    errorLog('❌ Auto-restart: Failed to initialize:', error);
  }
}

/**
 * Updates auto-restart settings
 */
async function updateAutoRestartSettings(newSettings) {
  try {
    const storage = await chrome.storage.local.get(AUTO_RESTART_CONFIG.storageKey);
    const currentSettings = storage[AUTO_RESTART_CONFIG.storageKey] || {
      enabled: AUTO_RESTART_CONFIG.enabled,
      intervalMs: AUTO_RESTART_CONFIG.intervalMs
    };
    
    const updatedSettings = { ...currentSettings, ...newSettings };
    await chrome.storage.local.set({
      [AUTO_RESTART_CONFIG.storageKey]: updatedSettings
    });
    
    // Reinitialize with new settings
    await initializeAutoRestart();
    
    debugLog('✅ Auto-restart: Settings updated:', updatedSettings);
    return { success: true, settings: updatedSettings };
    
  } catch (error) {
    errorLog('❌ Auto-restart: Failed to update settings:', error);
    return { success: false, error: error.message };
  }
}

// Initialize auto-restart when service worker starts
chrome.runtime.onInstalled.addListener(() => {
  debugLog('🚀 Extension installed/updated - initializing auto-restart');
  initializeAutoRestart();
});

// Also initialize on service worker startup
initializeAutoRestart();

// --- Message Handling ---

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // STABILITY: Add comprehensive message validation
  if (!message || typeof message.type !== 'string') {
    errorLog('CRITICAL: Invalid message received:', message);
    sendResponse({ error: 'Invalid message format' });
    return false;
  }

  try {
    if (message.type === 'GENERATE_REPLY') {
      // STABILITY: Validate required fields
      if (!message.prompt || typeof message.prompt !== 'string') {
        sendResponse({ error: 'Missing or invalid prompt' });
        return false;
      }

      (async () => {
        try {
          const result = await generateReplyWithSupabase(message.prompt, message.tweetContext);
          if (result && result.error) {
            sendResponse(result);
          } else {
            sendResponse({ reply: result });
          }
        } catch (e) {
          errorLog("CRITICAL: Unhandled exception in GENERATE_REPLY listener:", e);
          sendResponse({ error: `FATAL: Background script crashed: ${e.message}` });
        }
      })();
      return true; // Indicates asynchronous response
    }
    
    if (message.type === 'TEST_CUSTOM_PROMPT') {
      // STABILITY: Validate test prompt fields
      if (!message.prompt || !message.tweetContent) {
        sendResponse({ success: false, error: 'Missing required test fields' });
        return false;
      }

      (async () => {
        try {
          const startTime = Date.now();
          
          // Build the test prompt
          const testPrompt = `${message.prompt}\n\nTweet to respond to: "${message.tweetContent}"\n\nLanguage: ${message.language || 'English'}\nTone: ${message.tone || 'Professional'}\n\nGenerate an engaging reply following your instructions.`;
          
          const result = await generateReplyWithSupabase(testPrompt, { isTest: true });
          const processingTime = Date.now() - startTime;
          
          if (result && result.error) {
            sendResponse({ success: false, error: result.error });
          } else {
            sendResponse({ 
              success: true, 
              reply: result,
              processingTime: processingTime
            });
          }
        } catch (e) {
          errorLog("CRITICAL: Error testing custom prompt:", e);
          sendResponse({ success: false, error: `Test failed: ${e.message}` });
        }
      })();
      return true; // Indicates asynchronous response
    }

    if (message.type === 'GET_SESSION_STATS') {
      // STABILITY: Handle session stats request safely
      try {
        sendResponse({
          stats: {
            processed: 0,
            successful: 0,
            failed: 0,
            target: 120,
            isRunning: false,
            recentActivities: []
          }
        });
      } catch (e) {
        errorLog('Error getting session stats:', e);
        sendResponse({ error: 'Failed to get session stats' });
      }
      return false;
    }
    
    if (message.type === 'GET_AUTO_RESTART_STATUS') {
      // Get auto-restart status and settings
      (async () => {
        try {
          const storage = await chrome.storage.local.get([
            AUTO_RESTART_CONFIG.storageKey,
            'boldtake_last_auto_restart',
            'boldtake_auto_restart_initialized',
            'boldtake_auto_restart_log'
          ]);
          
          const settings = storage[AUTO_RESTART_CONFIG.storageKey] || {
            enabled: AUTO_RESTART_CONFIG.enabled,
            intervalMs: AUTO_RESTART_CONFIG.intervalMs
          };
          
          const status = {
            enabled: settings.enabled,
            intervalMs: settings.intervalMs,
            intervalMinutes: settings.intervalMs / 1000 / 60,
            lastRestart: storage.boldtake_last_auto_restart || null,
            initialized: storage.boldtake_auto_restart_initialized || null,
            isRunning: autoRestartInterval !== null,
            recentRestarts: (storage.boldtake_auto_restart_log || []).slice(-5)
          };
          
          sendResponse({ success: true, status });
        } catch (error) {
          errorLog('Error getting auto-restart status:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }
    
    if (message.type === 'UPDATE_AUTO_RESTART') {
      // Update auto-restart settings
      (async () => {
        try {
          const result = await updateAutoRestartSettings(message.settings);
          sendResponse(result);
        } catch (error) {
          errorLog('Error updating auto-restart:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }
    
    if (message.type === 'TRIGGER_AUTO_RESTART') {
      // Manually trigger auto-restart
      (async () => {
        try {
          debugLog('⚡ Manual auto-restart triggered');
          const result = await performHardRefresh({ reason: 'manual' });
          sendResponse({ success: true, result });
        } catch (error) {
          errorLog('Error triggering manual restart:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }
    
    if (message.type === 'EMERGENCY_STOP_AUTO_RESTART') {
      // Emergency stop - disable all auto-restart features
      (async () => {
        try {
          debugLog('🛑 EMERGENCY STOP triggered');
          
          // Clear all intervals
          if (autoRestartInterval) {
            clearInterval(autoRestartInterval);
            autoRestartInterval = null;
          }
          if (memoryCheckInterval) {
            clearInterval(memoryCheckInterval);
            memoryCheckInterval = null;
          }
          
          // Reset all locks
          isRefreshing = false;
          crashCounter = 0;
          
          // Disable in settings
          await chrome.storage.local.set({
            [AUTO_RESTART_CONFIG.storageKey]: {
              enabled: false,
              intervalMs: AUTO_RESTART_CONFIG.intervalMs
            }
          });
          
          debugLog('✅ All auto-restart features stopped');
          sendResponse({ success: true, message: 'Auto-restart emergency stopped' });
        } catch (error) {
          errorLog('Error in emergency stop:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }

    // STABILITY: Handle unknown message types
    debugLog('Unknown message type:', message.type);
    sendResponse({ error: `Unknown message type: ${message.type}` });
    return false;

  } catch (e) {
    errorLog('CRITICAL: Message handler crashed:', e);
    sendResponse({ error: `Message handler error: ${e.message}` });
    return false;
  }
});

/**
 * Generates a reply using Supabase Edge Function (Secure Architecture)
 * Routes all AI generation through your secure backend
 * @param {string} prompt - The full prompt to send to the AI
 * @param {Object} tweetContext - Additional context about the tweet
 * @returns {Promise<string|object>} The AI-generated reply string on success, or an object with an error key on failure
 */
async function generateReplyWithSupabase(prompt, tweetContext = {}) {
  // STABILITY: Input validation
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { error: 'Invalid or empty prompt provided' };
  }

  // STABILITY: Prompt length validation
  if (prompt.length > 8000) {
    return { error: 'Prompt too long - exceeds limits' };
  }

  const maxRetries = 3;
  let lastError = null;

  // Get user session for authentication - BACKGROUND SCRIPT COMPATIBLE
  let userSession = null;
  let accessToken = null;
  
  try {
    // Background scripts must use chrome.storage directly (no window/DOM access)
    const storage = await chrome.storage.local.get([
      STORAGE_CONFIG.userSession, 
      STORAGE_CONFIG.authToken,
      'sb-ckeuqgiuetlwowjoecku-auth-token' // Direct Supabase key
    ]);
    
    // Debug: Log all storage keys to understand what's available
    debugLog('🔍 Available storage keys:', Object.keys(storage));
    
    // Try multiple sources for authentication token
    // 1. Check direct Supabase auth token (most reliable)
    const supabaseToken = storage['sb-ckeuqgiuetlwowjoecku-auth-token'];
    if (supabaseToken) {
      try {
        const tokenData = typeof supabaseToken === 'string' ? JSON.parse(supabaseToken) : supabaseToken;
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          debugLog('✅ Found token from Supabase storage');
          // Extract user info from token if available
          if (tokenData.user) {
            userSession = { user: tokenData.user };
          }
        }
      } catch (parseError) {
        debugLog('Failed to parse Supabase token:', parseError);
      }
    }
    
    // 2. Check user session from our auth system
    if (!accessToken && storage[STORAGE_CONFIG.userSession]) {
      userSession = storage[STORAGE_CONFIG.userSession];
      if (userSession.access_token) {
        accessToken = userSession.access_token;
        debugLog('✅ Found token from user session');
      } else if (userSession.user?.access_token) {
        accessToken = userSession.user.access_token;
        debugLog('✅ Found token from user session (nested)');
      }
    }
    
    // 3. Check legacy auth token format
    if (!accessToken && storage[STORAGE_CONFIG.authToken]) {
      try {
        const authToken = storage[STORAGE_CONFIG.authToken];
        const tokenData = typeof authToken === 'string' ? JSON.parse(authToken) : authToken;
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          debugLog('✅ Found token from legacy storage');
        }
      } catch (parseError) {
        debugLog('Failed to parse legacy auth token:', parseError);
      }
    }
    
    // Final validation
    if (!accessToken) {
      errorLog('❌ No valid authentication token found');
      debugLog('Storage contents:', {
        hasUserSession: !!storage[STORAGE_CONFIG.userSession],
        hasAuthToken: !!storage[STORAGE_CONFIG.authToken],
        hasSupabaseToken: !!storage['sb-ckeuqgiuetlwowjoecku-auth-token']
      });
      return { error: 'Authentication failed - please login again' };
    }
    
    // Debug: Log token info (safely)
    console.log('🔑 Token found:', `${accessToken.substring(0, 20)}...`);
    console.log('📧 User:', userSession?.user?.email || 'Session active');
    
  } catch (error) {
    errorLog('Failed to retrieve authentication:', error);
    return { error: 'Authentication error - please try logging in again' };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debugLog(`🔄 Supabase Edge Function attempt ${attempt}/${maxRetries}`);
      
      // STABILITY: Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      try {
        const response = await fetch(`${SUPABASE_URL}${API_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            originalTweet: tweetContext.originalText || prompt,
            persona: mapStrategyToPersona(tweetContext.strategy || 'Engagement Indie Voice'),
            context: tweetContext.url ? `URL: ${tweetContext.url}` : undefined,
            // NEW: Language support fields
            language: tweetContext.language || 'english',
            languageInstructions: tweetContext.languageInstructions || undefined,
            debugMode: tweetContext.debugMode || false
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // STABILITY: Enhanced error handling based on your API specification
        if (!response.ok) {
          let errorBody;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = { error: 'Unknown server error' };
          }

          // Handle specific error cases from your API
          if (response.status === 400) {
            const errorMsg = errorBody.error || 'Bad request';
            if (errorMsg.includes('authorization header')) {
              return { error: 'Authentication failed - please login again' };
            }
            if (errorMsg.includes('subscription required')) {
              return { error: 'Active subscription required - please upgrade your plan' };
            }
            if (errorMsg.includes('Daily reply limit reached')) {
              return { error: errorMsg }; // Show the exact limit message from your API
            }
            if (errorMsg.includes('Missing required fields')) {
              return { error: 'Invalid request format - missing originalTweet or persona' };
            }
            return { error: errorMsg };
          }
          
          if (response.status === 401) {
            return { error: 'Authentication failed - please login again' };
          }
          
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter) : Math.pow(2, attempt);
            if (attempt < maxRetries) {
              console.log(`⏳ Rate limited. Waiting ${waitTime}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
              continue;
            }
            return { error: 'Rate limit exceeded. Please try again later.' };
          }
          
          if (response.status >= 500) {
            if (attempt < maxRetries) {
              console.log(`🔄 Server error (${response.status}). Retrying in ${attempt * 2}s...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              continue;
            }
          }

          const errorMessage = errorBody.error || `HTTP Error: ${response.status}`;
          throw new Error(`API Error: ${errorMessage}`);
        }

        const data = await response.json();
        
        // STABILITY: Validate response structure
        if (!data || typeof data.reply !== 'string') {
          throw new Error('Invalid response structure from Edge Function');
        }

        const content = data.reply.trim();
        
        // STABILITY: Validate content
        if (!content || content.length === 0) {
          throw new Error('Empty response from AI service');
        }

        if (content.length > 1000) {
          throw new Error('Response too long - potential error');
        }

        // Log usage statistics from your API response format
        if (data.usage) {
          const { used, limit, remaining } = data.usage;
          debugLog(`📊 Daily usage ${used}/${limit} replies (${remaining} remaining)`);
          
          // Store usage stats for potential UI updates
          try {
            await chrome.storage.local.set({
              [STORAGE_CONFIG.usageStats]: {
                used: used,
                limit: limit,
                remaining: remaining,
                lastUpdated: new Date().toISOString()
              }
            });
          } catch (storageError) {
            errorLog('⚠️ Failed to store usage stats:', storageError);
          }
        }

        debugLog(`✅ Supabase Edge Function success on attempt ${attempt}`);
        return content;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          lastError = new Error('Request timeout - Edge Function took too long to respond');
        } else {
          lastError = fetchError;
        }
        
        if (attempt < SESSION_CONFIG.maxRetries) {
          debugLog(`⚠️ Attempt ${attempt} failed: ${lastError.message}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, attempt * SESSION_CONFIG.retryDelay));
          continue;
        }
      }

    } catch (error) {
      lastError = error;
      
      if (attempt < SESSION_CONFIG.maxRetries) {
        debugLog(`⚠️ Attempt ${attempt} failed: ${error.message}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, attempt * SESSION_CONFIG.retryDelay));
        continue;
      }
    }
  }

  errorLog("BoldTake - All Edge Function attempts failed:", lastError);
  return { error: `AI generation failed after ${SESSION_CONFIG.maxRetries} attempts: ${lastError?.message || 'Unknown error'}` };
}

/**
 * Maps BoldTake extension strategies to Supabase Edge Function personas
 * @param {string} strategy - The strategy name from the extension
 * @returns {string} The corresponding persona for the Edge Function (one of 9 supported)
 */
function mapStrategyToPersona(strategy) {
  // ✅ RESTORED: Backend now supports ALL original personas (9 total)
  const strategyToPersonaMap = {
    "Engagement Indie Voice": "indie-voice",     // ✅ Matches backend
    "Engagement Spark Reply": "spark-reply",     // ✅ Matches backend  
    "Engagement The Counter": "counter",         // ✅ Matches backend (note: 'counter' not 'the-counter')
    "The Viral Shot": "viral-shot",              // ✅ Matches backend
    "The Riff": "riff",                          // ✅ Matches backend
    "The Shout-Out": "shout-out",                // ✅ Matches backend
    "Unknown": "indie-voice",                    // ✅ Safe default
    "Fallback": "indie-voice"                    // ✅ Safe default
  };

  // ✅ ALL 9 PERSONAS: Backend team added all original personas
  const supportedPersonas = [
    "indie-voice", "spark-reply", "counter", "riff", 
    "viral-shot", "shout-out", "tech-enthusiast", "business-minded", 
    "supportive-community"
  ];
  
  const mappedPersona = strategyToPersonaMap[strategy] || "indie-voice";
  
  // Validate the persona is supported
  if (!supportedPersonas.includes(mappedPersona)) {
    console.warn(`⚠️ Unsupported persona '${mappedPersona}', falling back to 'indie-voice'`);
    return "indie-voice";
  }
  
  console.log(`🎯 Persona mapping ${strategy} → ${mappedPersona}`);
  return mappedPersona;
}
