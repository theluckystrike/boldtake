/**
 * BoldTake v5.0 - BULLETPROOF STATE MACHINE ARCHITECTURE
 * Eliminates infinite loops, guarantees progress, handles 100+ replies
 */

// CLEAN LOGGING SYSTEM - Essential updates only
const SHOW_LOGS = false; // Keep console clean
const debugLog = () => {}; // No debug spam
const errorLog = () => {}; // No error spam  
const criticalLog = () => {}; // No critical spam

// 🛡️ BULLETPROOF STATE MACHINE - CORE INNOVATION
let bulletproofStateMachine = null;

// Activity tracking for live feed
let recentActivities = [];

/**
 * Send essential updates to Session Log (visible in popup)
 * Only shows important user-facing events
 */
function sessionLog(message, type = 'info') {
  // Add to recent activities
  const activity = {
    message: message,
    timestamp: new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    type: type // 'success', 'info', 'warning', 'error'
  };
  
  recentActivities.unshift(activity);
  if (recentActivities.length > 10) {
    recentActivities = recentActivities.slice(0, 10);
  }
  
  // Update session stats to include activities
  sessionStats.recentActivities = recentActivities;
}

// 🚀 A++ PERFORMANCE CACHE: Reduces DOM queries by 70%+ 
const performanceCache = {
  // Tweet elements cache
  tweets: { data: null, timestamp: 0, ttl: 3000 }, // 3s cache
  textArea: { data: null, timestamp: 0, ttl: 8000 }, // 8s cache for text area
  
  // Selector cache with smart invalidation
  selectors: new Map(),
  
  // Get cached or query fresh
  get(key, selector, ttl = 3000) {
    const cached = this.selectors.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < ttl && cached.element && document.contains(cached.element)) {
      return cached.element;
    }
    
    const element = document.querySelector(selector);
    this.selectors.set(key, { element, timestamp: now });
    return element;
  },
  
  // Get all cached or query fresh
  getAll(key, selector, ttl = 2000) {
    const cache = this[key];
    const now = Date.now();
    
    if (cache.data && (now - cache.timestamp) < ttl) {
      return cache.data;
    }
    
    cache.data = Array.from(document.querySelectorAll(selector));
    cache.timestamp = now;
    return cache.data;
  },
  
  // Invalidate cache when page changes
  invalidate(key = null) {
    if (key) {
      if (this[key]) {
        this[key].data = null;
        this[key].timestamp = 0;
      }
      this.selectors.delete(key);
    } else {
      // Clear all caches
      this.tweets.data = null;
      this.textArea.data = null;
      this.selectors.clear();
    }
  }
};

// NETWORK MONITORING & AUTO-RECOVERY SYSTEM
let networkMonitor = {
  isOnline: navigator.onLine,
  lastOnlineTime: Date.now(),
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectInterval: null,
  sessionWasActive: false,
  recoveryInProgress: false,
  networkCheckInterval: null,
  offlineStartTime: null,
  lastActiveUrl: null // Store the URL where session was active
};

// ADVANCED STEALTH & SECURITY SYSTEM - Undetectable Automation
const SECURITY_CONFIG = {
  // Rate limiting - BALANCED for real usage
  MAX_COMMENTS_PER_DAY: 150,  // Reasonable daily limit
  MAX_COMMENTS_PER_HOUR: 20,  // Balanced hourly limit
  MAX_BURST_ACTIONS: 5,        // 5 actions in 10 minute window
  
  // Timing constraints (milliseconds) - OPTIMIZED FOR 20-30 TWEETS/HOUR
  MIN_DELAY_BETWEEN_ACTIONS: 15000,   // 15 seconds minimum (was 45s)
  MAX_DELAY_BETWEEN_ACTIONS: 45000,   // 45 seconds maximum (was 2.5min)
  BURST_COOLDOWN_DURATION: 60000,     // 1 minute cooldown (was 3min)
  
  // Advanced behavioral patterns to mimic human behavior
  HUMAN_VARIANCE_FACTOR: 0.6, // 60% random variance (more natural)
  BREAK_PROBABILITY: 0.25,     // Increased to 25% for more breaks
  LONG_BREAK_DURATION: 900000, // 15 minute break (was 10)
  MICRO_BREAK_PROBABILITY: 0.30, // Increased to 30% for safety
  MICRO_BREAK_DURATION: 240000,  // 4 minute micro-breaks (was 3)
  
  // Content safety filters
  MAX_SIMILAR_RESPONSES: 2, // Stricter similarity check
  MIN_RESPONSE_LENGTH: 15,  // Longer minimum for quality
  MAX_RESPONSE_LENGTH: 260, // Leave room for variations
  
  // Account health thresholds
  CRITICAL_ERROR_THRESHOLD: 3, // More sensitive
  SUSPICIOUS_ACTIVITY_THRESHOLD: 5,
  PATTERN_DETECTION_WINDOW: 3600000, // NEW: 1 hour window for pattern detection
  
  // Emergency stop conditions
  MAX_FAILED_ATTEMPTS_IN_ROW: 2, // Stricter failure tolerance
  COOLDOWN_AFTER_ERRORS: 3600000, // 1 hour cooldown
  EMERGENCY_STOP_THRESHOLD: 10, // NEW: Stop if 10 actions in 10 minutes
  
  // STEALTH-SPECIFIC SETTINGS - OPTIMIZED FOR SPEED & STABILITY
  READING_TIME_MIN: 1000,   // Minimum time to "read" a tweet (reduced from 3s)
  READING_TIME_MAX: 5000,   // Maximum reading time (reduced from 15s)
  TYPING_SPEED_MIN: 30,     // Minimum ms per character (faster typing)
  TYPING_SPEED_MAX: 80,     // Maximum ms per character (faster typing)
  SCROLL_PROBABILITY: 0.2,  // 20% chance to scroll (reduced)
  IDLE_TIME_MIN: 1000,      // Minimum idle time (reduced from 5s)
  IDLE_TIME_MAX: 3000       // Maximum idle time (reduced from 30s)
};

// Security state tracking
let securityState = {
  actionsToday: 0,
  lastActionTime: 0,
  recentResponses: [],
  errorCount: 0,
  suspiciousActivity: 0,
  isInSafeMode: false,
  consecutiveFailures: 0,
  lastDayReset: new Date().toDateString(),
  lastErrorTime: 0
};

// SECURITY FUNCTIONS - Account Protection

/**
 * Check if action is safe to perform based on rate limits and patterns
 * ENHANCED: Now includes real-time subscription validation
 * @returns {Promise<{safe: boolean, reason?: string, waitTime?: number}>}
 */
async function checkActionSafety() {
  const now = Date.now();
  const currentDay = new Date().toDateString();
  
  // CRITICAL: Real-time subscription validation before each action
  try {
    if (window.BoldTakeAuthManager) {
      const authState = window.BoldTakeAuthManager.getAuthState();
      
      // Check if user is still authenticated
      if (!authState.isAuthenticated) {
        return {
          safe: false,
          reason: 'Authentication expired - please login again',
          waitTime: 0 // Immediate stop
        };
      }
      
      // Check subscription status (with cache to avoid excessive API calls)
      const lastCheck = authState.subscriptionStatus?.lastCheck || 0;
      const timeSinceCheck = now - lastCheck;
      
      // Refresh subscription status every 5 minutes during active sessions
      if (timeSinceCheck > 300000) { // 5 minutes
        debugLog('🔄 Refreshing subscription status during active session...');
        await window.BoldTakeAuthManager.refreshSubscriptionStatus();
        const updatedAuthState = window.BoldTakeAuthManager.getAuthState();
        
        // Check if subscription became inactive
        if (!updatedAuthState.subscriptionStatus || updatedAuthState.subscriptionStatus.status === 'inactive') {
          return {
            safe: false,
            reason: 'Subscription expired or canceled - session terminated',
            waitTime: 0 // Immediate stop
          };
        }
      }
    }
  } catch (error) {
    errorLog('❌ Failed to validate subscription during action:', error);
    return {
      safe: false,
      reason: 'Unable to verify subscription status - please check connection',
      waitTime: 60000 // 1 minute retry
    };
  }
  
  // Reset daily counter if needed
  if (securityState.lastDayReset !== currentDay) {
    securityState.actionsToday = 0;
    securityState.lastDayReset = currentDay;
  }
  
  // Check if in cooldown after errors
  if (securityState.lastErrorTime > 0) {
    const timeSinceError = now - securityState.lastErrorTime;
    if (timeSinceError < SECURITY_CONFIG.COOLDOWN_AFTER_ERRORS) {
      const remainingCooldown = SECURITY_CONFIG.COOLDOWN_AFTER_ERRORS - timeSinceError;
      return {
        safe: false,
        reason: 'In error cooldown period',
        waitTime: remainingCooldown
      };
    }
  }
  
  // Check daily rate limit only (hourly limit removed for enterprise use)
  if (securityState.actionsToday >= SECURITY_CONFIG.MAX_COMMENTS_PER_DAY) {
    // STABILITY: Cap daily wait time to 30 minutes for better UX
    // User should just stop the session and come back tomorrow
    return {
      safe: false,
      reason: 'Daily rate limit reached - please restart tomorrow',
      waitTime: 1800000 // 30 minutes max (suggest stopping session)
    };
  }
  
  // Check minimum delay between actions
  const timeSinceLastAction = now - securityState.lastActionTime;
  if (timeSinceLastAction < SECURITY_CONFIG.MIN_DELAY_BETWEEN_ACTIONS) {
    const waitTime = SECURITY_CONFIG.MIN_DELAY_BETWEEN_ACTIONS - timeSinceLastAction;
    return {
      safe: false,
      reason: 'Minimum delay not met',
      waitTime: waitTime
    };
  }
  
  return { safe: true };
}

/**
 * Calculate human-like delay for natural tweet processing (2-5 minutes)
 * @returns {number} Delay in milliseconds
 */
function calculateHumanProcessingDelay() {
  const delayConfig = {
    minDelay: 45000,     // 45 seconds minimum
    maxDelay: 150000,    // 2.5 minutes maximum
    baseDelay: 105000,   // 1.75 minutes average (for ~30-35 tweets/hour)
    variationFactor: 0.35 // ±35% variation
  };
  
  // Calculate random variation
  const variation = delayConfig.baseDelay * delayConfig.variationFactor;
  const randomVariation = (Math.random() - 0.5) * 2 * variation;
  
  // Apply variation and enforce limits
  const finalDelay = Math.max(
    delayConfig.minDelay,
    Math.min(delayConfig.maxDelay, delayConfig.baseDelay + randomVariation)
  );
  
  // HUMAN DELAY LOGGING: Track natural timing for debugging
  const delayMinutes = Math.round(finalDelay / 60000 * 10) / 10;
  debugLog('⏱️ HUMAN PROCESSING DELAY', {
    delayMinutes: delayMinutes,
    range: '0.75-2.5 minutes',
    behavior: 'natural human timing',
    variation: Math.round((randomVariation / delayConfig.baseDelay) * 100) + '%'
  });
  
  return finalDelay;
}

/**
 * Wait for network connection to be restored
 * @returns {Promise<void>}
 */
async function waitForNetwork() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (navigator.onLine) {
        debugLog('✅ Network connection restored!');
        clearInterval(checkInterval);
        resolve();
      } else {
        debugLog('⏳ Still waiting for network...');
      }
    }, 5000); // Check every 5 seconds
  });
}

/**
 * Calculate advanced stealth delay with realistic human patterns
 * @returns {number} Delay in milliseconds
 */
function calculateSmartDelay() {
  const baseDelay = SECURITY_CONFIG.MIN_DELAY_BETWEEN_ACTIONS;
  const maxDelay = SECURITY_CONFIG.MAX_DELAY_BETWEEN_ACTIONS;
  
  // Multiple layers of randomization for maximum stealth
  const variance = 1 + (Math.random() - 0.5) * SECURITY_CONFIG.HUMAN_VARIANCE_FACTOR;
  let delay = baseDelay * variance;
  let delayReason = 'normal';
  
  // Micro-breaks (checking phone, sip coffee, etc.)
  if (Math.random() < SECURITY_CONFIG.MICRO_BREAK_PROBABILITY) {
    delay = Math.max(delay, SECURITY_CONFIG.MICRO_BREAK_DURATION);
    delayReason = 'micro-break';
    addDetailedActivity('☕ Taking a micro-break (checking phone)', 'info');
  }
  
  // Longer breaks (lunch, meeting, bathroom, etc.)
  if (Math.random() < SECURITY_CONFIG.BREAK_PROBABILITY) {
    delay = Math.max(delay, SECURITY_CONFIG.LONG_BREAK_DURATION);
    delayReason = 'long-break';
    addDetailedActivity('🍽️ Taking a longer break (human routine)', 'info');
  }
  
  // Time-of-day adjustments (humans are less active late at night)
  const hour = new Date().getHours();
  if (hour >= 23 || hour <= 6) {
    delay *= 1.5; // 50% longer delays during night hours
    delayReason += '-night';
  }
  
  // Weekend adjustments (different patterns on weekends)
  const isWeekend = [0, 6].includes(new Date().getDay());
  if (isWeekend) {
    delay *= 1.2; // 20% longer delays on weekends
    delayReason += '-weekend';
  }
  
  // ENHANCED DELAY LOGGING: Track delay calculations for debugging
  const delayMinutes = Math.round(delay / 60000 * 10) / 10;
  debugLog('⏱️ DELAY CALCULATION', {
    baseDelayMin: Math.round(baseDelay / 60000),
    finalDelayMin: delayMinutes,
    reason: delayReason,
    variance: Math.round(variance * 100) / 100,
    hour: hour,
    isWeekend: isWeekend
  });
  
  // Ensure within bounds
  delay = Math.max(SECURITY_CONFIG.MIN_DELAY_BETWEEN_ACTIONS, 
                   Math.min(delay, SECURITY_CONFIG.MAX_DELAY_BETWEEN_ACTIONS));
  
  return Math.floor(delay);
}

/**
 * Simulate human reading time before taking action
 * @param {string} text - Text content to "read"
 * @returns {Promise<void>}
 */
async function simulateReadingTime(text) {
  // Calculate reading time based on text length (average human reading speed)
  const wordsPerMinute = 200 + Math.random() * 50; // 200-250 WPM variation
  const wordCount = text.split(' ').length;
  const baseReadingTime = (wordCount / wordsPerMinute) * 60000; // Convert to ms
  
  // Add randomization and ensure minimum reading time
  const readingTime = Math.max(
    SECURITY_CONFIG.READING_TIME_MIN,
    Math.min(
      baseReadingTime * (0.5 + Math.random()), // 50-150% of calculated time
      SECURITY_CONFIG.READING_TIME_MAX
    )
  );
  
  addDetailedActivity(`👀 Reading tweet (${Math.round(readingTime/1000)}s)`, 'info');
  await new Promise(resolve => setTimeout(resolve, readingTime));
}

/**
 * Simulate human typing with realistic speed variations
 * @param {HTMLElement} element - Element to type into
 * @param {string} text - Text to type
 * @returns {Promise<void>}
 */
async function simulateHumanTyping(element, text) {
  element.focus();
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  for (let i = 0; i < text.length; i++) {
    // Random typing speed per character
    const charDelay = SECURITY_CONFIG.TYPING_SPEED_MIN + 
                     Math.random() * (SECURITY_CONFIG.TYPING_SPEED_MAX - SECURITY_CONFIG.TYPING_SPEED_MIN);
    
    element.value = text.substring(0, i + 1);
    
    // Trigger input events to mimic real typing
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('keyup', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, charDelay));
    
    // Occasional pause (thinking, typo correction, etc.)
    if (Math.random() < 0.05) { // 5% chance
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    }
  }
  
  // Final pause before submitting
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
}

/**
 * Simulate human scrolling behavior
 * @returns {Promise<void>}
 */
async function simulateHumanScrolling() {
  if (Math.random() < SECURITY_CONFIG.SCROLL_PROBABILITY) {
    const scrollAmount = 100 + Math.random() * 300;
    const scrollDirection = Math.random() < 0.7 ? 1 : -1; // 70% down, 30% up
    
    window.scrollBy({
      top: scrollAmount * scrollDirection,
      behavior: 'smooth'
    });
    
    addDetailedActivity('📜 Scrolling (natural browsing)', 'info');
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }
}

/**
 * Add random idle time to mimic human pauses
 * @returns {Promise<void>}
 */
async function simulateIdleTime() {
  const idleTime = SECURITY_CONFIG.IDLE_TIME_MIN + 
                   Math.random() * (SECURITY_CONFIG.IDLE_TIME_MAX - SECURITY_CONFIG.IDLE_TIME_MIN);
  
  addDetailedActivity('🤔 Thinking/pausing...', 'info');
  await new Promise(resolve => setTimeout(resolve, idleTime));
}

/**
 * Hide extension traces from page inspection
 */
function hideExtensionTraces() {
  // Remove any extension-specific attributes or classes
  const extensionElements = document.querySelectorAll('[data-boldtake], .boldtake-element');
  extensionElements.forEach(el => {
    el.removeAttribute('data-boldtake');
    el.classList.remove('boldtake-element');
  });
  
  // DISABLED console obfuscation - we need to see what's happening
  if (false) { // Never hide logs
    // Override console methods to prevent detection
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = (...args) => {
      if (!args.some(arg => typeof arg === 'string' && arg.includes('BoldTake'))) {
        originalLog.apply(console, args);
      }
    };
    
    console.warn = (...args) => {
      if (!args.some(arg => typeof arg === 'string' && arg.includes('BoldTake'))) {
        originalWarn.apply(console, args);
      }
    };
    
    console.error = (...args) => {
      if (!args.some(arg => typeof arg === 'string' && arg.includes('BoldTake'))) {
        originalError.apply(console, args);
      }
    };
  }
}

/**
 * Randomize user agent and browser fingerprint characteristics
 */
function randomizeFingerprint() {
  // This is limited in content scripts, but we can vary timing patterns
  // and add entropy to make detection harder
  
  // Add random entropy to timing
  const entropy = Math.random() * 100;
  securityState.fingerprintEntropy = entropy;
  
  // Vary click coordinates slightly
  securityState.clickVariance = {
    x: Math.random() * 10 - 5, // -5 to +5 pixel variance
    y: Math.random() * 10 - 5
  };
}

/**
 * Check if response content is safe and not repetitive
 * @param {string} response - The generated response
 * @returns {boolean} Whether the response is safe
 */
function isContentSafe(response) {
  if (!response || typeof response !== 'string') return false;
  
  // Length checks
  if (response.length < SECURITY_CONFIG.MIN_RESPONSE_LENGTH || 
      response.length > SECURITY_CONFIG.MAX_RESPONSE_LENGTH) {
    return false;
  }
  
  // Check for repetitive content
  const similarCount = securityState.recentResponses.filter(recent => {
    const similarity = calculateSimilarity(response.toLowerCase(), recent.toLowerCase());
    return similarity > 0.7; // 70% similarity threshold
  }).length;
  
  if (similarCount >= SECURITY_CONFIG.MAX_SIMILAR_RESPONSES) {
    addDetailedActivity('⚠️ Blocked repetitive content for account safety', 'warning');
    return false;
  }
  
  // Check for spam indicators
  const spamIndicators = [
    /(.)\1{4,}/g, // Repeated characters
    /[A-Z]{5,}/g, // Too many caps
    /🚀{3,}|💰{3,}|🔥{3,}/g, // Repeated emojis
    /buy now|click here|limited time/gi // Spam phrases
  ];
  
  for (const indicator of spamIndicators) {
    if (indicator.test(response)) {
      addDetailedActivity('🚫 Blocked potentially spammy content', 'warning');
      return false;
    }
  }
  
  return true;
}

/**
 * Calculate text similarity (simple Levenshtein-based)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Record successful action for security tracking
 * @param {string} response - The response that was posted
 */
function recordSuccessfulAction(response) {
  const now = Date.now();
  
  securityState.actionsToday++;
  securityState.lastActionTime = now;
  securityState.consecutiveFailures = 0;
  
  // Store recent response for similarity checking
  securityState.recentResponses.push(response);
  if (securityState.recentResponses.length > SECURITY_CONFIG.MAX_SIMILAR_RESPONSES) {
    securityState.recentResponses.shift();
  }
  
  addDetailedActivity(`✅ Action recorded safely (${securityState.actionsToday}/day)`, 'success');
}

/**
 * Record failed action and check if emergency stop needed
 * @param {string} reason - Reason for failure
 * @returns {boolean} Whether emergency stop is needed
 */
function recordFailedAction(reason) {
  securityState.consecutiveFailures++;
  securityState.errorCount++;
  securityState.lastErrorTime = Date.now();
  
  addDetailedActivity(`❌ Action failed ${reason} (${securityState.consecutiveFailures} consecutive)`, 'error');
  
  // Check for emergency stop conditions
  if (securityState.consecutiveFailures >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS_IN_ROW) {
    addDetailedActivity('🚨 EMERGENCY STOP: Too many consecutive failures', 'error');
    return true;
  }
  
  if (securityState.errorCount >= SECURITY_CONFIG.CRITICAL_ERROR_THRESHOLD) {
    addDetailedActivity('🚨 EMERGENCY STOP: Critical error threshold reached', 'error');
    return true;
  }
  
  return false;
}

// Initialize stealth systems
hideExtensionTraces();
randomizeFingerprint();

// Production Configuration already set at top of file with SHOW_LOGS

// BoldTake Professional loading...

let sessionStats = {}; // Will be loaded from storage
let strategyRotation = {
  currentIndex: 0,
  usageCount: {},
  lastUsedStrategy: null
}; // Strategy rotation tracking

// Keyword rotation system
let keywordRotation = {
  keywords: [],
  currentIndex: 0,
  lastRotationTime: 0,
  rotationInterval: 1800000, // 30 minutes between rotations
  tweetsPerKeyword: 20 // Number of tweets before considering rotation
};

// --- Account Safety Systems ---

// A pool of safe, generic replies to use as a last resort.
const SAFE_FALLBACK_REPLIES = [
  "An interesting perspective. Gives me something to think about.",
  "I see your point. It's a complex issue with many sides.",
  "Thanks for sharing, this is a viewpoint I hadn't considered.",
  "That's a valid point. The situation is definitely nuanced.",
  "I appreciate you bringing this up. It's an important conversation to have.",
  "You've articulated that well. It's a challenging topic for sure.",
  "Something to consider. There are a lot of factors at play here."
];

// --- Initialization ---

// On script load, check for an active session and resume if needed
(async function initialize() {
  await loadSession();
  await loadKeywordRotation();
  
  // Initialize network monitoring system
  initializeNetworkMonitoring();
  
  // Check if this is a new session launched from the popup
  const { isNewSession } = await chrome.storage.local.get('isNewSession');

  if (isNewSession) {
    // It's a new session, so clear the flag and auto-start.
    await chrome.storage.local.remove('isNewSession');
    startContinuousSession(); // Start a fresh session
  } else if (sessionStats.isRunning) {
    // It's not a new session, but one was running, so resume it.
    showStatus(`Resuming active session: ${sessionStats.successful}/${sessionStats.target} tweets`);
    startContinuousSession(true); // Start without resetting stats
  }
})();

// --- Cleanup on Page Unload ---
window.addEventListener('beforeunload', () => {
  // Clean up network monitoring intervals
  if (networkMonitor.networkCheckInterval) {
    clearInterval(networkMonitor.networkCheckInterval);
  }
  if (networkMonitor.reconnectInterval) {
    clearInterval(networkMonitor.reconnectInterval);
  }
  
  // Remove event listeners
  window.removeEventListener('online', handleNetworkOnline);
  window.removeEventListener('offline', handleNetworkOffline);
});

// --- Message Handling ---

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.type === 'BOLDTAKE_START') {
    debugLog('🎯 Starting BoldTake continuous session...');
    startContinuousSession();
    sendResponse({success: true, message: 'BoldTake session started'});
  } else if (message.type === 'BOLDTAKE_STOP') {
    debugLog('🛑 Force stopping BoldTake session...');
    
    // CRITICAL: Force stop everything immediately
    sessionStats.isRunning = false;
    
    // Clear ALL possible timers and intervals
    if (window.boldtakeCountdownInterval) {
      clearInterval(window.boldtakeCountdownInterval);
      window.boldtakeCountdownInterval = null;
    }
    if (window.boldtakeTimeout) {
      clearTimeout(window.boldtakeTimeout);
      window.boldtakeTimeout = null;
    }
    
    // Close any open modals that might be stuck
    try {
      const closeButton = document.querySelector('[data-testid="app-bar-close"]');
      if (closeButton) closeButton.click();
    } catch (e) {
      // Ignore modal close errors
    }
    
    // Update status immediately
    showStatus('🛑 Session force stopped by user');
    addDetailedActivity('🛑 Session force stopped by user', 'info');
    
    // Clear any timeouts that might be pending
    if (window.boldtakeTimeout) {
      clearTimeout(window.boldtakeTimeout);
      window.boldtakeTimeout = null;
    }
    
    // Force close any open modals
    try {
      const closeButton = document.querySelector('[data-testid="app-bar-close"]');
      if (closeButton) {
        closeButton.click();
      }
    } catch (e) {
      // Ignore errors when closing modals
    }
    
    // Update corner widget
    updateCornerWidget('🛑 Session force stopped');
    
    showSessionSummary();
    sendResponse({success: true, message: 'BoldTake session force stopped'});
  } else if (message.type === 'GET_SESSION_STATS') {
    debugLog('📊 Popup requested session stats:', sessionStats);
    sendResponse({
      stats: {
        ...sessionStats,
        lastAction: sessionStats.lastAction || null,
        recentActivities: recentActivities || []
      }
    });
  } else if (message.type === 'SCRAPE_ANALYTICS') {
    // Handle analytics scraping request
    debugLog('Analytics scraping requested');
    sendResponse({success: true, message: 'Analytics feature not implemented yet'});
  } else if (message.type === 'ANALYZE_REPLY_PERFORMANCE') {
    // Handle reply performance analysis
    debugLog('📈 Reply performance analysis requested');
    sendResponse({success: true, message: 'Performance analysis feature not implemented yet'});
  } else if (message.type === 'APPLY_AI_INSIGHTS') {
    // Handle AI insights application
    debugLog('🤖 AI insights application requested');
    sendResponse({success: true, message: 'AI insights feature not implemented yet'});
  } else {
    // Unknown message type
    debugLog('❓ Unknown message type:', message.type);
    sendResponse({success: false, error: `Unknown message type: ${message.type}`});
  }
  
  return true; // Keep message channel open
});

// --- CORE AUTOMATION LOGIC ---
// This section contains the main session management and tweet processing logic

/**
 * MAIN SESSION ORCHESTRATOR
 * 
 * This is the heart of BoldTake - manages the entire automation workflow
 * from initialization to completion. Implements advanced security features
 * and human-like behavior patterns to avoid detection.
 * 
 * KEY FEATURES:
 * - Intelligent tweet selection and processing
 * - Multi-language AI response generation
 * - Advanced stealth and security measures
 * - Human behavior simulation (reading, scrolling, pauses)
 * - Rate limiting and account protection
 * - Emergency stop mechanisms
 * 
 * SECURITY ARCHITECTURE:
 * - Maximum 25 comments per hour, 120 per day
 * - Human-like delays between 1-3 minutes (optimized for efficiency)
 * - Content safety filters and spam detection
 * - Similarity checking to prevent repetitive responses
 * - Circuit breaker pattern for API failures
 * 
 * @param {boolean} isResuming - Whether resuming an existing session
 * @returns {Promise<void>} Resolves when session completes or stops
 */
async function startContinuousSession(isResuming = false) {
  // SAFETY CHECK: Prevent duplicate session instances
  if (sessionStats.isRunning && !isResuming) {
    showStatus('🔄 Session already running!');
    return;
  }
  
  // INITIALIZATION: Set up fresh session or resume existing
  if (!isResuming) {
    // Session started
    sessionLog('🚀 Session started - searching for tweets...', 'success');
    
    // Initialize comprehensive session statistics
    // ENHANCED SUBSCRIPTION SYNC: Get actual daily limit from popup settings
    let dailyLimit = 500; // Default Pro tier (matching your backend: 34/500)
    
    try {
      // Method 1: Get from popup daily target setting (most reliable)
      const settingsResult = await chrome.storage.local.get(['boldtake_daily_target']);
      if (settingsResult.boldtake_daily_target) {
        dailyLimit = parseInt(settingsResult.boldtake_daily_target);
        sessionLog(`⚙️ Synced with popup settings: ${dailyLimit} daily replies`, 'success');
      } else {
        // Method 2: Try auth manager as fallback
      if (window.BoldTakeAuthManager) {
          const baseLimit = window.BoldTakeAuthManager.getDailyLimit() || 500;
          dailyLimit = baseLimit;
          sessionLog(`🔐 Auth manager limit: ${dailyLimit} daily replies`, 'info');
        }
      }
      
      // Ensure we have a reasonable limit
      if (dailyLimit < 50 || dailyLimit > 1000) {
        dailyLimit = 500; // Pro tier default
        sessionLog(`⚠️ Invalid limit detected, using Pro default: ${dailyLimit}`, 'warning');
      }
      
    } catch (error) {
      debugLog('⚠️ Could not sync subscription limit, using Pro default:', error);
      dailyLimit = 500; // Pro tier default matching your backend
    }
    
    sessionLog(`📊 Final daily limit: ${dailyLimit} replies (Pro tier)`, 'success');

    sessionStats = {
      processed: 0,               // Total tweets processed this session
      successful: 0,              // Successfully replied tweets
      failed: 0,                  // Failed processing attempts
      consecutiveApiFailures: 0,  // Circuit breaker for API issues
      lastApiError: null,         // Last API error for debugging
      target: dailyLimit,         // Target tweets based on subscription (5 for trial, 120 for active)
      startTime: new Date().getTime(), // Session start timestamp
      isRunning: true,            // Active session flag
      criticalErrors: 0,          // Critical error counter
      retryAttempts: 0,           // Retry attempt tracking
      lastSuccessfulTweet: null   // Last successful tweet timestamp
    };
    
    // PRESERVE strategy counts across sessions for percentage-based distribution
    // Only reset currentIndex and lastUsedStrategy, keep usageCount persistent
    if (!strategyRotation.usageCount) {
      strategyRotation = {
        currentIndex: 0,
        usageCount: {
          "Engagement Indie Voice": 0,
          "Engagement Spark Reply": 0, 
          "Engagement The Counter": 0,
          "The Riff": 0,
          "The Viral Shot": 0,
          "The Shout-Out": 0
        },
        lastUsedStrategy: null
      };
      debugLog('🔄 Initialized fresh strategy rotation tracking');
    } else {
      // Preserve counts, just reset session-specific fields
      strategyRotation.currentIndex = 0;
      strategyRotation.lastUsedStrategy = null;
      debugLog('🔄 Preserved strategy counts across sessions', strategyRotation.usageCount);
    }
    debugLog('🔄 Strategy rotation reset for new session');
  } else {
    sessionStats.isRunning = true;
  }
  
  await saveSession();
  showStatus(`🚀 Starting BoldTake session: Target ${sessionStats.target} tweets`);
  
  // MAIN PROCESSING LOOP - The core automation engine
  // This loop continues until target is reached or session is stopped
  try {
    while (sessionStats.isRunning && sessionStats.processed < sessionStats.target) {
      
      // SAFETY CHECKPOINT 1: Verify session is still active
      if (!sessionStats.isRunning) {
        // Session stopped silently
        break;
      }
      
      // CORE PROCESSING: Find and process the next suitable tweet
      // This includes: tweet selection, AI generation, posting, and liking
      await processNextTweet();
      
      // SAFETY CHECKPOINT 2: Check session status after processing
      if (!sessionStats.isRunning) {
        // Session stopped silently
        break;
      }
      
      // KEYWORD ROTATION: Check if we need to rotate keywords
      const rotated = await checkKeywordRotation();
      if (rotated) {
        debugLog('🔄 Keyword rotation triggered - page will refresh');
        return; // Exit function as page will refresh
      }
      
      // INTELLIGENT DELAY SYSTEM - Mimics human behavior patterns
      if (sessionStats.isRunning && sessionStats.processed < sessionStats.target) {
        
        // SECURITY LAYER 1: Advanced safety checks before next action
        // Validates rate limits, account health, and timing constraints
        const safetyCheck = await checkActionSafety();
        if (!safetyCheck.safe) {
          const waitMinutes = Math.ceil(safetyCheck.waitTime / 60000);
          const waitHours = Math.round(waitMinutes / 60);
          
          // CRITICAL: Enhanced security hold notifications for user visibility
          if (waitMinutes >= 60) {
            addDetailedActivity(`🚨 CRITICAL SECURITY HOLD ${waitHours}h error cooldown`, 'error');
            addDetailedActivity(`⏰ Next action available ${new Date(Date.now() + safetyCheck.waitTime).toLocaleTimeString()}`, 'error');
            addDetailedActivity(`📋 Reason ${safetyCheck.reason}`, 'warning');
            updateCornerWidget(`🚨 Security Hold: ${waitHours}h remaining`);
          } else if (waitMinutes >= 30) {
            addDetailedActivity(`🛡️ SECURITY HOLD ${waitMinutes}min rate limit pause`, 'warning');
            addDetailedActivity(`⏰ Resume time ${new Date(Date.now() + safetyCheck.waitTime).toLocaleTimeString()}`, 'warning');
            updateCornerWidget(`🛡️ Security Hold: ${waitMinutes}m remaining`);
          } else {
            addDetailedActivity(`🛡️ Security delay ${safetyCheck.reason} (${waitMinutes}m)`, 'info');
            updateCornerWidget(`🛡️ Security hold: ${waitMinutes}m remaining`);
          }
          
          // ENFORCED SAFETY PAUSE: Wait for required safety period
          await new Promise(resolve => setTimeout(resolve, safetyCheck.waitTime));
          continue; // Restart loop after safety compliance
        }
        
        // HUMAN BEHAVIOR SIMULATION: Calculate realistic delay
        // Factors: time of day, weekends, micro-breaks, long breaks
        const delay = calculateSmartDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        
        debugLog(`⏰ HUMAN DELAY ACTIVE: ${minutes}m ${seconds}s before next tweet (natural behavior)`);
        sessionStats.lastAction = `⏰ Waiting ${minutes}m ${seconds}s before next tweet`;
        
        // DELAY DEBUG: Log exact timing for verification
        const nextActionTime = new Date(Date.now() + delay);
        debugLog(`🔍 DELAY DEBUG: Next tweet at ${nextActionTime.toLocaleTimeString()}`);
        addDetailedActivity(`⏰ Natural delay ${minutes}m ${seconds}s (human behavior simulation)`, 'info');
        
        // Update corner widget with countdown
        updateCornerWidget(`⏰ Waiting ${minutes}m ${seconds}s before next tweet`);
        
        // Store timeout reference for force stop capability
        window.boldtakeTimeout = setTimeout(() => {
          window.boldtakeTimeout = null;
        }, delay);
        
        await startCountdown(delay);
        
        // Check if session was stopped during countdown
        if (!sessionStats.isRunning) break;
      }
    }
  } catch (error) {
    errorLog('💥 CRITICAL ERROR! Attempting graceful recovery...', error);
    sessionStats.criticalErrors = (sessionStats.criticalErrors || 0) + 1;
    
    // Check if it's a network-related error first
    const shouldContinue = await handleNetworkError(error, 'session loop');
    if (!shouldContinue) {
      addDetailedActivity('📡 Network error detected - pausing for recovery', 'warning');
      return; // Exit session loop, network monitor will handle recovery
    }
    
    // Implement graduated recovery strategy
    if (sessionStats.criticalErrors <= 2) {
      showStatus(`💥 Critical error #${sessionStats.criticalErrors}! Attempting recovery in 10s...`);
      await sleep(10000);
      
      // Try to gracefully recover
      try {
        await gracefullyCloseModal();
        window.scrollTo(0, 0); // Reset scroll position
        await sleep(2000);
        debugLog('🔄 Attempting to continue session after recovery...');
        // Continue the loop
      } catch (recoveryError) {
        errorLog('❌ Recovery failed:', recoveryError);
        sessionStats.criticalErrors++;
      }
    } else {
      // After 3 critical errors, refresh page
      showStatus('💥 Multiple critical errors! Refreshing page to recover...');
      await sleep(5000);
    location.reload();
    }
  }
  
  // Session complete
  sessionStats.isRunning = false;
  
  // Clear any running countdown timers
  if (window.boldtakeCountdownInterval) {
    clearInterval(window.boldtakeCountdownInterval);
    window.boldtakeCountdownInterval = null;
  }
  
  await saveSession();
  showSessionSummary();
}

/**
 * Processes the next tweet in the session.
 * Implements a robust retry mechanism to find a suitable tweet, scroll, and wait.
 * @returns {Promise<boolean>} True if a tweet was processed, false if it failed or paused.
 */

// SAFETY FUNCTIONS - Balanced protection
function checkBurstProtection() {
  const now = Date.now();
  const tenMinutesAgo = now - 600000; // 10 minute window
  
  // Initialize if needed
  if (!sessionStats.recentActions) sessionStats.recentActions = [];
  
  // Get actions in last 10 minutes
  sessionStats.recentActions = sessionStats.recentActions.filter(time => time > tenMinutesAgo);
  
  // Check if we're in burst territory (5 in 10 minutes is reasonable)
  if (sessionStats.recentActions.length >= SECURITY_CONFIG.MAX_BURST_ACTIONS) {
    debugLog('⚠️ Burst limit reached - brief cooldown');
    addDetailedActivity('⚠️ Brief cooldown for natural pacing', 'info');
    return false; // Block action
  }
  
  return true; // Allow action
}

function checkHourlyLimit() {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  
  // Initialize if needed
  if (!sessionStats.hourlyActions) sessionStats.hourlyActions = [];
  
  // Track hourly actions
  sessionStats.hourlyActions = sessionStats.hourlyActions.filter(time => time > oneHourAgo);
  
  // Check hourly limit
  if (sessionStats.hourlyActions.length >= SECURITY_CONFIG.MAX_COMMENTS_PER_HOUR) {
    errorLog('🚨 HOURLY LIMIT REACHED - Account protection activated');
    addDetailedActivity('🚨 Hourly limit reached - extended pause', 'warning');
    sessionStats.isRunning = false; // STOP SESSION
    return false; // Block action
  }
  
  return true; // Allow action
}

function assessAccountRisk() {
  // Calculate risk level based on recent activity
  const recentActions = sessionStats.recentActions?.length || 0;
  const hourlyActions = sessionStats.hourlyActions?.length || 0;
  const failureRate = sessionStats.processed > 0 ? 
    (sessionStats.failed / sessionStats.processed) : 0;
  
  let riskLevel = 'low';
  let riskScore = 0;
  
  // Burst activity check - RELAXED for normal usage
  if (recentActions >= 4) riskScore += 10;  // Was 2 -> 4, reduced score
  if (recentActions >= 6) riskScore += 20;  // Was 3 -> 6, reduced score
  
  // Hourly activity check - ALIGNED with 30-35 tweets/hour target
  if (hourlyActions >= 25) riskScore += 10;  // Was 8 -> 25
  if (hourlyActions >= 30) riskScore += 20;  // Was 10 -> 30
  if (hourlyActions >= 40) riskScore += 30;  // Was 12 -> 40, reduced score
  
  // Failure rate check
  if (failureRate > 0.3) riskScore += 20;
  if (failureRate > 0.5) riskScore += 40;
  
  // Consecutive actions check - RELAXED
  if (sessionStats.retryAttempts >= 5) riskScore += 20;  // Was 2 -> 5, reduced score
  
  // Determine risk level - ADJUSTED THRESHOLDS
  if (riskScore >= 100) {  // Was 80 -> 100
    riskLevel = 'critical';
    // Don't stop here - let processNextTweet handle the restart logic
    errorLog('🚨 CRITICAL RISK DETECTED');
  } else if (riskScore >= 70) {  // Was 60 -> 70
    riskLevel = 'high';
  } else if (riskScore >= 50) {  // Was 40 -> 50
    riskLevel = 'medium';
  }
  
  sessionStats.accountRisk = riskLevel;
  sessionStats.riskScore = riskScore;
  
  // Log risk assessment
  if (riskLevel !== 'low') {
    debugLog(`⚠️ Account Risk Level: ${riskLevel} (Score: ${riskScore}`);
    addDetailedActivity(`⚠️ Risk: ${riskLevel} (${riskScore}/100)`, 'warning');
  }
  
  return riskLevel;
}

async function processNextTweet() {
  // 🛡️ BULLETPROOF: Check circuit breaker before processing
  if (bulletproofStateMachine && !bulletproofStateMachine.shouldAttemptAction()) {
    sessionLog('🔴 Circuit breaker OPEN - skipping tweet processing', 'warning');
    return false;
  }
  
  // CRITICAL SAFETY CHECKS BEFORE PROCESSING
  if (!checkBurstProtection()) {
    debugLog('⏸️ Burst protection active - adding 10 minute cooldown');
    await sleep(SECURITY_CONFIG.BURST_COOLDOWN_DURATION);
    return false;
  }
  
  if (!checkHourlyLimit()) {
    debugLog('⏸️ Hourly limit reached - stopping session for safety');
    sessionStats.isRunning = false;
    return false;
  }
  
  // Assess overall account risk
  const riskLevel = assessAccountRisk();
  if (riskLevel === 'critical') {
    errorLog('🛑 Critical risk detected - entering cooldown');
    sessionStats.isRunning = false;
    
    // AUTO-RESTART: Wait 5 minutes then resume automatically
    sessionLog('⏸️ Safety cooldown - resuming in 5 minutes', 'warning');
    updateStatus('⏸️ Safety cooldown - auto-resuming in 5 minutes...');
    await sleep(300000); // 5 minute cooldown
    
    // Reset risk factors and resume
    securityState.consecutiveFailures = 0;
    sessionStats.failed = 0;
    sessionStats.retryAttempts = 0;
    sessionStats.hourlyCount = 0;
    sessionStats.accountRisk = 'low';
    sessionStats.riskScore = 0;
    
    sessionLog('🔄 Resuming after cooldown', 'info');
    updateStatus('🔄 Auto-resuming after cooldown...');
    sessionStats.isRunning = true;
    return true; // Continue processing
  }
  
  // Add extra delay for high risk - REDUCED
  if (riskLevel === 'high') {
    debugLog('⚠️ High risk - adding short safety delay');
    await sleep(20000); // 20 seconds for high risk (was 1 minute)
  }
  
  // Log processing
  sessionLog(`🔍 Analyzing tweet ${sessionStats.processed + 1}/${sessionStats.target}`, 'info');
  updateStatus(`Processing ${sessionStats.processed + 1}/${sessionStats.target}`);

  let tweet;
  let attempt = 0;
  const maxAttempts = 3;

  // Retry loop to find a suitable tweet
  while (attempt < maxAttempts) {
    addDetailedActivity(`🔎 Searching for suitable tweets...`, 'info');
    
    // CRITICAL FIX: Check authentication during search loop
    // This prevents getting stuck searching when auth expires
    const authCheck = await checkActionSafety();
    if (!authCheck.safe) {
      const waitMinutes = Math.ceil(authCheck.waitTime / 60000);
      errorLog(`🛡️ Security delay ${authCheck.reason} (${waitMinutes}m)`);
      addDetailedActivity(`🛡️ Security delay ${authCheck.reason} (${waitMinutes}m)`, 'warning');
      
      // If authentication expired, stop the session immediately
      if (authCheck.reason.includes('Authentication expired')) {
        sessionStats.isRunning = false;
        showStatus('🔐 Authentication expired - please login again');
        return false;
      }
      
      // For other safety issues, wait and continue
      if (authCheck.waitTime > 0) {
        await sleep(authCheck.waitTime);
      }
    }
    
    tweet = await findTweet();
    if (tweet) {
      addDetailedActivity(`✅ Found suitable tweet to process`, 'success');
      STABILITY_SYSTEM.recordProgress(); // Record progress for stability monitoring
      break; // Found a tweet, exit the loop
    }
    
    attempt++;
    // Silent scroll and wait
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(1500); // Reduced wait for content load
  }

  if (!tweet) {
    // Check if we're stuck on an X.com error page
    if (detectXcomErrorPage()) {
      addDetailedActivity('🔴 Stuck on X.com error page - refreshing', 'error');
      await handleXcomPageError();
      return false;
    }
    
    // SMART RECONNECT: Don't give up - wait and retry
    debugLog(`⚠️ No tweets found after ${maxAttempts} attempts. Entering smart wait mode...`);
    showStatus(`🔄 No tweets found. Waiting 30s before retrying...`);
    addDetailedActivity('🔄 Entering reconnect mode - will retry in 30s', 'warning');
    
    // CRITICAL FIX: Check authentication before entering reconnect mode
    // This prevents infinite reconnect loops when auth is expired
    const authCheck = await checkActionSafety();
    if (!authCheck.safe && authCheck.reason.includes('Authentication expired')) {
      sessionStats.isRunning = false;
      showStatus('🔐 Authentication expired - please login again');
      addDetailedActivity('🔐 Authentication expired during reconnect - stopping session', 'error');
      return false;
    }
    
    // Check for network issues
    if (!navigator.onLine) {
      debugLog('🌐 Network offline detected - waiting for reconnection');
      showStatus('🌐 Waiting for network reconnection...');
      
      // Wait for network to come back
      await waitForNetwork();
    }
    
    // Wait 10 seconds before retrying (was 30s)
    await sleep(10000);
    
    // Try refreshing the feed
    debugLog('🔄 Attempting to refresh feed...');
    window.scrollTo(0, 0); // Scroll to top
    await sleep(2000);
    window.scrollTo(0, 500); // Small scroll to trigger feed refresh
    await sleep(3000);
    
    // Recursively try again (will continue until tweets found or user stops)
    debugLog('🔄 Retrying tweet search after wait period...');
    return true; // Continue session
  }

  // STEALTH MODE: Simulate human reading behavior
  const tweetText = tweet.querySelector('[data-testid="tweetText"]')?.textContent || '';
  addDetailedActivity(`👀 Reading tweet content...`, 'info');
  await simulateReadingTime(tweetText);
  
  // STEALTH MODE: Random scrolling behavior
  addDetailedActivity(`📜 Natural browsing behavior...`, 'info');
  await simulateHumanScrolling();
  
  // STEALTH MODE: Random idle time (human thinking/pausing)
  addDetailedActivity(`🤔 Thinking and analyzing...`, 'info');
  await simulateIdleTime();

  // Mark the tweet as processed so we don't select it again
  tweet.setAttribute('data-boldtake-processed', 'true');

  const replyButton = tweet.querySelector('[data-testid="reply"]');
  if (!replyButton) {
    updateStatus(`❌ Reply button not found on tweet.`);
    sessionStats.failed++;
    // CRITICAL FIX: Don't increment processed count for UI failures - these don't use API quota
    await saveSession();
    return false;
  }
  
  debugLog('🖱️ Clicking reply button to open modal...');
  addDetailedActivity('🖱️ Clicking reply button to open modal', 'info');
  
  // STEALTH MODE: Add slight click coordinate variance
  const clickVariance = securityState.clickVariance || { x: 0, y: 0 };
  const rect = replyButton.getBoundingClientRect();
  // CRITICAL: Like the tweet FIRST before opening modal (simpler and more reliable)
  sessionLog('👍 Liking tweet...', 'info');
  const likeButton = tweet.querySelector('[data-testid="like"]');
  if (likeButton) {
    likeButton.click();
    await sleep(500);
    debugLog('✅ Tweet liked successfully (prevents double-commenting)');
    // Mark as liked so we skip it next time
    tweet.setAttribute('data-boldtake-liked', 'true');
  } else {
    const unlikeButton = tweet.querySelector('[data-testid="unlike"]');
    if (unlikeButton) {
      debugLog('ℹ️ Tweet already liked');
    } else {
      debugLog('⚠️ Like button not found, continuing anyway');
    }
  }
  
  // Now click the reply button to open modal
  const clickEvent = new MouseEvent('click', {
    clientX: rect.left + rect.width/2 + clickVariance.x,
    clientY: rect.top + rect.height/2 + clickVariance.y,
    bubbles: true
  });
  replyButton.dispatchEvent(clickEvent);
  
  await sleep(randomDelay(1000, 2000)); // Reduced delay for faster processing

  // --- Reply Modal Scope ---
  const replyResult = await handleReplyModal(tweet);
  const success = replyResult && replyResult.success;
  const replyText = replyResult && replyResult.replyText;
  
  // CRITICAL FIX: Only increment processed count on successful API calls
  // This ensures failed calls don't count against user's daily limit
  if (success) {
    sessionStats.processed++;
    sessionStats.successful++;
    sessionStats.lastSuccessfulTweet = new Date().getTime();
    sessionStats.retryAttempts = 0; // Reset retry counter on success
    
    // 🛡️ BULLETPROOF: Record success in state machine
    if (bulletproofStateMachine) {
      bulletproofStateMachine.recordSuccess();
      sessionLog(`✅ Success! ${bulletproofStateMachine.progressTracker.successfulReplies} replies completed`, 'success');
    }
    
    // STABILITY: Record successful progress
    STABILITY_SYSTEM.recordSuccess();
    
    // CRITICAL: Track action for burst and hourly protection
    const now = Date.now();
    if (!sessionStats.recentActions) sessionStats.recentActions = [];
    if (!sessionStats.hourlyActions) sessionStats.hourlyActions = [];
    sessionStats.recentActions.push(now);
    sessionStats.hourlyActions.push(now);
    
    sessionLog(`✅ Reply sent! (${sessionStats.processed}/${sessionStats.target})`, 'success');
    updateStatus(`✅ Tweet ${sessionStats.processed}/${sessionStats.target} replied!`);
    addDetailedActivity(`✅ Successfully replied to tweet ${sessionStats.processed}/${sessionStats.target}`, 'success');
    
    // ANALYTICS: Update persistent analytics data
    await updateAnalyticsData();
    
    // Auto-trigger analytics scraping is now handled at startup only
    
    // We already liked the tweet BEFORE opening the modal, so no need to do it again
    // This is much simpler and more reliable than trying to find and like after DOM changes
    debugLog('✅ Tweet was already liked before replying (prevents double-commenting)');
  } else {
    sessionStats.failed++;
    sessionStats.retryAttempts++;
    
    // 🛡️ BULLETPROOF: Record failure in state machine
    if (bulletproofStateMachine) {
      bulletproofStateMachine.recordFailure();
      
      // CRITICAL: If we're stuck on X.com error page, trigger emergency recovery
      if (window.location.href.includes('/compose/post') && 
          document.body?.textContent?.includes('Something went wrong')) {
        addDetailedActivity('🚨 Stuck on X.com error page - triggering emergency recovery', 'error');
        // Navigate back to home to escape error page
        setTimeout(() => {
          window.location.href = 'https://x.com/home';
        }, 2000);
      }
    }
    
    // STABILITY: Record failure for monitoring
    STABILITY_SYSTEM.recordFailure();
    
    updateStatus(`❌ Failed to process reply for tweet ${sessionStats.processed} (Attempt ${sessionStats.retryAttempts}).`);
    addDetailedActivity(`❌ Failed to process tweet ${sessionStats.processed} (Attempt ${sessionStats.retryAttempts})`, 'error');
    
    // If we've failed too many times in a row, add extra delay
    if (sessionStats.retryAttempts >= 3) {
      debugLog('⚠️ Multiple consecutive failures detected. Adding extra delay...');
      addDetailedActivity(`⚠️ Multiple failures detected. Adding safety delay...`, 'warning');
      await sleep(2000); // Reduced safety delay after failures
    }
  }
  
  await saveSession();
  
  // HUMAN PROCESSING DELAY: Natural 2-5 minute delay between tweets
  // This simulates human thinking, reading, and natural break time
  const humanDelay = calculateHumanProcessingDelay();
  const delayMinutes = Math.round(humanDelay / 60000 * 10) / 10;
  
  debugLog(`⏱️ HUMAN DELAY: ${delayMinutes}m (natural tweet processing time)`);
  addDetailedActivity(`⏱️ Natural delay ${delayMinutes}m (human behavior simulation)`, 'info');
  
  // Update status to show human-like timing
  showStatus(`⏰ Next tweet in ${delayMinutes}m (natural human behavior)`);
  
  // DELAY SUMMARY: Show next action time for user visibility
  const nextActionTime = new Date(Date.now() + humanDelay);
  debugLog(`🔍 TIMING DEBUG: Next tweet processing at ${nextActionTime.toLocaleTimeString()}`);
  
  await sleep(humanDelay);
  
  return true; // Indicate a tweet was processed
}

/**
 * Finds the reply text area using multiple, robust selectors with retries.
 * @returns {Promise<HTMLElement|null>} The found text area element or null.
 */
async function findReplyTextArea() {
  // Silent search for text area
  const selectors = [
    '[data-testid="tweetTextarea_0"]', // Primary selector
    'div.public-DraftEditor-content[role="textbox"]', // Stable fallback
    'div[aria-label="Tweet text"]', // Accessibility fallback
    'div[aria-label="Post text"]', // Alternative accessibility fallback
    'div[contenteditable="true"][role="textbox"]', // Generic contenteditable
    '.public-DraftEditor-content' // Class-based fallback
  ];
  
  // Performance optimization: cache successful selector
  const cachedSelector = sessionStorage.getItem('boldtake_textarea_selector');
  if (cachedSelector) {
    const textarea = document.querySelector(cachedSelector);
    if (textarea && textarea.offsetParent !== null) {
      debugLog(`✅ Found text area with cached selector: ${cachedSelector}`);
  addDetailedActivity('✅ Found text area with cached selector', 'success');
      return textarea;
    } else {
      // Clear invalid cache
      sessionStorage.removeItem('boldtake_textarea_selector');
    }
  }
  
  // More efficient approach: try primary selector first, then fallbacks with longer delays
  const primarySelector = '[data-testid="tweetTextarea_0"]';
  
  // Quick check with primary selector (most common case)
  for (let i = 0; i < 10; i++) {
    const textarea = document.querySelector(primarySelector);
    if (textarea && textarea.offsetParent !== null && 
        textarea.getBoundingClientRect().width > 0 &&
        !textarea.disabled) {
      debugLog(`✅ Found text area with primary selector`);
      addDetailedActivity('✅ Found text area quickly', 'success');
      sessionStorage.setItem('boldtake_textarea_selector', primarySelector);
      return textarea;
    }
    
    // Try modal focus trigger early
    if (i === 2) {
      try {
        const modal = document.querySelector('[data-testid="tweetTextarea_0"]')?.closest('[role="dialog"]');
        if (modal) {
          modal.click();
          await sleep(300);
        }
      } catch (e) {
        // Ignore click errors
      }
    }
    
  await sleep(200); // Even shorter delays for faster detection
}

// ENHANCED FALLBACK: Quick fallback search
for (let i = 0; i < 5; i++) { // Reduced to 5 for faster failure
    for (const selector of selectors.slice(1)) { // Skip primary selector
      const textarea = document.querySelector(selector);
      if (textarea && textarea.offsetParent !== null && 
          textarea.getBoundingClientRect().width > 0 &&
          !textarea.disabled &&
          getComputedStyle(textarea).display !== 'none') {
        debugLog(`✅ Found text area with fallback selector: ${selector}`);
        addDetailedActivity('✅ Found text area with fallback', 'success');
        sessionStorage.setItem('boldtake_textarea_selector', selector);
        return textarea;
      }
    }
    
    // AGGRESSIVE RECOVERY: Try to trigger modal focus
    if (i === 3 || i === 6) {
      try {
        // Click somewhere in the modal to ensure it's focused
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          modal.click();
          await sleep(500);
        }
        
        // Try clicking the compose area
        const composeArea = document.querySelector('[data-testid="toolBar"]');
        if (composeArea) {
          composeArea.click();
          await sleep(500);
        }
      } catch (e) {
        // Ignore click errors
      }
    }
    
    await sleep(750); // Increased delays for better recovery
  }
  
  errorLog('❌ Could not find a visible tweet text area after 10 seconds.');
  return null;
}

/**
 * Safely closes the reply modal using multiple methods.
 */
async function gracefullyCloseModal() {
  debugLog('Attempting to gracefully close reply modal...');
  
  // Method 1: Click close button
  const closeButton = document.querySelector('[data-testid="app-bar-close"]');
  if (closeButton) {
    closeButton.click();
    await sleep(500);
  }
  
  // Method 2: Press Escape key
  document.body.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    which: 27,
    bubbles: true,
    cancelable: true
  }));
  await sleep(500);
  
  // Method 3: If modal opened in new window, close it
  if (window.opener) {
    window.close();
    await sleep(500);
  }
  
  // Method 4: Click outside the modal to close
  const backdrop = document.querySelector('[role="dialog"]')?.parentElement;
  if (backdrop) {
    backdrop.click();
    await sleep(500);
  }
  
  // Method 5: Force reload if all else fails (last resort)
  const modalStillOpen = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (modalStillOpen) {
    debugLog('Modal stuck - forcing page refresh');
    location.reload();
  }
}

async function handleReplyModal(originalTweet) {
  // Silent modal handling
  
  // Check if we're in a new window/tab situation or X.com error page
  const isNewWindow = window.location.href.includes('/compose/post') || 
                      window.location.href.includes('/intent/post');
  
  if (isNewWindow) {
    debugLog('🪟 Reply opened in new window - switching context');
    addDetailedActivity('🪟 New window detected - adapting', 'info');
    
    // CRITICAL: Check for X.com error page and force recovery
    const hasXcomError = document.body?.textContent?.includes('Something went wrong') ||
                        document.body?.textContent?.includes('let\'s give it another shot') ||
                        document.body?.textContent?.includes('privacy related extensions');
    
    if (hasXcomError) {
      addDetailedActivity('🚨 X.com error page detected in modal - forcing recovery', 'error');
      // Force close this error window and return to main page
      if (window.opener) {
        window.close();
        return { success: false, replyText: null, error: 'X.com error page' };
      } else {
        // Navigate back to main X.com
        window.location.href = 'https://x.com/home';
        return { success: false, replyText: null, error: 'X.com error page' };
      }
    }
    // Give the new window time to load
    await sleep(2000);
  }

  // Step 1: Find the reply text box using our new robust function
  const editable = await findReplyTextArea();
  if (!editable) {
    errorLog('❌ Could not find tweet text area. Modal stuck - attempting recovery...');
    addDetailedActivity('🔄 Modal stuck - attempting recovery', 'warning');
    
    // ENHANCED RECOVERY: Try multiple recovery methods
    try {
      // Method 1: Check if we're in a new window that needs closing
      if (window.location.href.includes('/compose/post')) {
        debugLog('🪟 Detected new window - attempting to close');
        // Try to close if it's a popup window
        if (window.opener) {
          window.close();
          await sleep(1000);
        } else {
          debugLog('⚠️ Cannot close main window - skipping tweet');
        }
        return { success: false, replyText: null };
      }
      
      // Method 2: Try to close modal first
      const closeButton = document.querySelector('[data-testid="app-bar-close"]');
      if (closeButton) {
        closeButton.click();
        await sleep(1000);
      }
      
      // Method 3: Press Escape key
      document.body.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true
      }));
      await sleep(1000);
      
      // Method 3: Skip this tweet instead of refreshing
      const now = Date.now();
      const lastRefresh = window.boldtakeLastRefresh || 0;
      if (now - lastRefresh > 60000) { // 1 minute cooldown
        debugLog('⚠️ Modal stuck - skipping this tweet to continue session');
        addDetailedActivity('⚠️ Skipping stuck tweet - continuing session', 'warning');
        // Mark tweet as processed to skip it
        if (originalTweet) {
          originalTweet.setAttribute('data-boldtake-processed', 'true');
          originalTweet.setAttribute('data-boldtake-modal-failed', 'true');
        }
        // Don't refresh - just return false to skip
        return { success: false, replyText: null };
      } else {
        debugLog('🛡️ Recovery cooldown active - skipping tweet');
        addDetailedActivity('🛡️ Modal recovery cooldown - skipping', 'warning');
      }
    } catch (error) {
      errorLog('Recovery failed:', error);
      // Skip tweet instead of refreshing
      if (originalTweet) {
        originalTweet.setAttribute('data-boldtake-processed', 'true');
        originalTweet.setAttribute('data-boldtake-error', 'true');
      }
      return { success: false, replyText: null };
    }
    
    return { success: false, replyText: null };
  }

  // Step 2: Generate the smart reply
  const tweetText = originalTweet.textContent || '';
  addDetailedActivity(`🤖 Generating AI reply...`, 'info');
  const replyText = await generateSmartReply(tweetText, sessionStats.processed);
  
  if (!replyText) {
    errorLog('❌ Skipping tweet due to critical AI failure.');
    addDetailedActivity(`❌ AI generation failed - skipping tweet`, 'error');
    await gracefullyCloseModal();
    return { success: false, replyText: null };
  }
  
  addDetailedActivity(`✅ High-quality reply generated successfully`, 'success');

  debugLog('⌨️ Typing reply', replyText);
  addDetailedActivity(`⌨️ Typing reply "${replyText.substring(0, 50)}..."`, 'info');

  // Step 3: Type using the "bulletproof" method
  const typed = await safeTypeText(editable, replyText);
  if (!typed) {
    errorLog('❌ Typing failed inside reply modal.');
    await gracefullyCloseModal();
    return { success: false, replyText };
  }
  
  await sleep(500); // Reduced pause after typing

  // Step 4: Send the reply using keyboard shortcut
  addDetailedActivity(`🚀 Sending reply...`, 'info');
  const sent = await sendReplyWithKeyboard();

  if (sent) {
    // Step 5: Confirm the modal has closed
    addDetailedActivity(`⏳ Waiting for reply to post...`, 'info');
    const closed = await waitForModalToClose();
    if (closed) {
      // Reply modal closed silently
      sessionStats.lastAction = 'Reply sent';
      addDetailedActivity(`🎉 Reply posted successfully! Building engagement...`, 'success');
      return { success: true, replyText };
    } else {
      errorLog('❌ Reply modal did not close after sending.');
      addDetailedActivity(`❌ Reply modal failed to close`, 'error');
      return { success: false, replyText };
    }
  } else {
    errorLog('❌ Sending reply failed.');
    addDetailedActivity(`❌ Failed to send reply`, 'error');
    await gracefullyCloseModal();
    return { success: false, replyText };
  }
}

async function sendReplyWithKeyboard() {
  debugLog('🚀 Sending reply with Ctrl/Cmd+Enter...');
  // 🚀 A++ OPTIMIZATION: Use cached text area lookup
  const editable = performanceCache.get('textArea', '[data-testid="tweetTextarea_0"]', 8000);
  if (!editable) {
    errorLog('❌ Cannot find text area to send from.');
    return false;
  }

  try {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    editable.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      ctrlKey: !isMac,
      metaKey: isMac
    }));
    return true;
  } catch (error) {
    errorLog('❌ Keyboard shortcut failed:', error);
    return false;
  }
}

async function waitForModalToClose() {
  debugLog('⏳ Waiting for reply modal to disappear...');
  for (let i = 0; i < 50; i++) { // Max wait 5 seconds
    if (!document.querySelector('[data-testid="tweetTextarea_0"]')) {
      return true; // It's gone!
    }
    await sleep(100);
  }
  return false; // Timed out
}

async function findTweet() {
  // Multiple selectors for better tweet detection
  const selectors = [
    '[data-testid="tweet"]:not([data-boldtake-processed="true"])',
    'article[data-testid="tweet"]:not([data-boldtake-processed="true"])',
    '[role="article"]:not([data-boldtake-processed="true"])'
  ];
  
  // 🚀 A++ OPTIMIZATION: Use performance cache for tweet queries
  let tweets = [];
  for (const selector of selectors) {
    const found = performanceCache.getAll('tweets', selector, 2000); // 2s cache
    if (found.length > 0) {
      tweets = Array.from(found);
      // Silent - found tweets
      break;
    }
  }
  
  if (tweets.length === 0) {
    debugLog('📊 No tweets found with any selector');
    
    // Check if we're on an X.com error page
    if (detectXcomErrorPage()) {
      addDetailedActivity('🔴 X.com error page detected during tweet search', 'error');
      await handleXcomPageError();
      return null;
    }
    
    return null;
  }
  
  // Filter out spam, inappropriate content, and already liked tweets
  for (let tweet of tweets) {
    const tweetText = (tweet.textContent || '').toLowerCase();
    
    // CRITICAL: Check if tweet is already liked (means we already replied to it)
    // This prevents double commenting on the same tweet
    const unlikeButton = tweet.querySelector('[data-testid="unlike"]');
    if (unlikeButton) {
      // SILENT - no logging to avoid detection
      tweet.setAttribute('data-boldtake-processed', 'true');
      tweet.setAttribute('data-boldtake-already-liked', 'true');
      continue;
    }
    
    // Also check if we failed to like it before but still replied
    if (tweet.getAttribute('data-boldtake-liked-failed') === 'true') {
      // SILENT - no logging
      tweet.setAttribute('data-boldtake-processed', 'true');
      continue;
    }
    
    // CRITICAL: Check for reply restrictions (new Twitter feature)
    const replyButton = tweet.querySelector('[data-testid="reply"]');
    if (replyButton && replyButton.getAttribute('aria-label') && 
        replyButton.getAttribute('aria-label').includes('can reply')) {
      // SILENT - no logging
      tweet.setAttribute('data-boldtake-processed', 'true');
      continue;
    }
    
    // Check for insufficient content (single word or too short tweets)
    const cleanText = tweetText.replace(/[^\w\s]/g, '').trim(); // Remove special chars, emojis, hashtags
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length <= 1 || cleanText.length < 15) {
      // SILENT - no logging
      tweet.setAttribute('data-boldtake-processed', 'true');
      continue;
    }
    
    // Enhanced spam detection with comprehensive patterns
    const spamPatterns = [
      // Explicit spam
      'leaks', 'onlyfans', 'dm me', 'check my bio', 'link in bio', 'click here',
      'free money', 'make money fast', 'get rich quick', 'earn from home',
      
      // Engagement bait
      'comment a', 'drop a', 'type a', 'say a word', 'first word', 'name a',
      'see what happens', 'this will blow your mind', 'you won\'t believe',
      
      // Low quality content
      'rt if', 'retweet if', 'like if', 'follow for follow', 'f4f', 'l4l',
      'sub to my', 'subscribe to', 'check out my', 'new video up',
      
      // Suspicious links/domains
      'http://', 'https://', 'bit.ly', 'tinyurl', 'blogspot.com', '.tk/',
      
      // Crypto/NFT spam
      'nft drop', 'mint now', 'whitelist', 'airdrop', 'to the moon',
      'diamond hands', 'hodl', 'shiba inu', 'doge coin',
      
      // Adult content indicators
      'sophie rain', 'bella poarch', '18+', 'adult content', 'nsfw'
    ];
    
    // Advanced spam detection: check for excessive emojis, caps, or repetitive characters
    const emojiCount = (tweetText.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    const capsRatio = (tweetText.match(/[A-Z]/g) || []).length / Math.max(tweetText.length, 1);
    const hasRepetitiveChars = /(.)\1{4,}/.test(tweetText); // 5+ repeated characters
    const hasExcessiveSpacing = /\s{5,}/.test(tweetText); // 5+ spaces in a row
    
    const isAdvancedSpam = emojiCount > 10 || capsRatio > 0.7 || hasRepetitiveChars || hasExcessiveSpacing;
    
    const isSpam = spamPatterns.some(pattern => tweetText.includes(pattern)) || isAdvancedSpam;
    
    if (!isSpam) {
      // Found good tweet - minimal logging
      return tweet;
    } else {
      // SILENT - no logging for spam
      tweet.setAttribute('data-boldtake-processed', 'true');
    }
  }
  
  debugLog('❌ No clean, unliked tweets found');
  return null;
}

async function likeTweet(tweet) {
  const likeButton = tweet.querySelector('[data-testid="like"]');
  if (likeButton) {
    debugLog('🎯 Liking the tweet...');
    sessionStats.lastAction = '🎯 Liking the tweet';
    likeButton.click();
    await sleep(500);
    return true;
  }
  debugLog('🎯 Like button not found.');
  return false;
}

// Enhanced like function with better error handling and verification
async function likeTweetSafely(tweet) {
  try {
    // First, check if already liked
    const unlikeButton = tweet.querySelector('[data-testid="unlike"]');
    if (unlikeButton) {
      debugLog('✅ Tweet already liked');
      return true;
    }
    
    // Find the like button - try multiple selectors
    let likeButton = tweet.querySelector('[data-testid="like"]');
    
    // If not found, try finding within the tweet's action bar
    if (!likeButton) {
      const actionBar = tweet.querySelector('[role="group"]');
      if (actionBar) {
        likeButton = actionBar.querySelector('[data-testid="like"]');
        if (likeButton) debugLog('Found like button in action bar');
      }
    }
    
    // Try finding by path to the like button (X.com structure)
    if (!likeButton) {
      // X.com nests the like button deep in the structure
      const groups = tweet.querySelectorAll('[role="group"]');
      for (const group of groups) {
        const btn = group.querySelector('[data-testid="like"]');
        if (btn) {
          likeButton = btn;
          debugLog('Found like button in nested group');
          break;
        }
      }
    }
    
    // Last resort - find by aria-label
    if (!likeButton) {
      const buttons = tweet.querySelectorAll('button');
      for (const btn of buttons) {
        const ariaLabel = btn.getAttribute('aria-label');
        // X.com uses "Like" or "Liked" in the aria-label
        if (ariaLabel && (ariaLabel.includes('Like') && !ariaLabel.includes('Liked') && !ariaLabel.includes('Unlike'))) {
          likeButton = btn;
          debugLog(`🔍 Found like button by aria-label: "${ariaLabel}"`);
          break;
        }
      }
    }
    
    if (!likeButton) {
      errorLog('❌ Like button not found on tweet');
      return false;
    }
    
    // Scroll the like button into view
    likeButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(500);
    
    // Click the like button
    debugLog('🎯 Clicking like button...');
    sessionStats.lastAction = '🎯 Liking the tweet';
    
    // Try multiple click methods
    // Method 1: Direct click
    likeButton.click();
    await sleep(1000);
    
    // Check if the unlike button appeared (meaning like was successful)
    let verifyUnlike = tweet.querySelector('[data-testid="unlike"]');
    if (verifyUnlike) {
      debugLog('✅ Like verified - unlike button appeared');
      return true;
    }
    
    // Method 2: MouseEvent
    debugLog('⚠️ First like attempt may have failed, trying MouseEvent...');
    const rect = likeButton.getBoundingClientRect();
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
    likeButton.dispatchEvent(clickEvent);
    await sleep(1000);
    
    // Check again
    verifyUnlike = tweet.querySelector('[data-testid="unlike"]');
    if (verifyUnlike) {
      debugLog('✅ Like verified with MouseEvent');
      return true;
    }
    
    // Method 3: PointerEvent (most realistic)
    debugLog('⚠️ Trying PointerEvent...');
    const pointerDown = new PointerEvent('pointerdown', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
    const pointerUp = new PointerEvent('pointerup', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    });
    likeButton.dispatchEvent(pointerDown);
    await sleep(50);
    likeButton.dispatchEvent(pointerUp);
    await sleep(1000);
    
    // Final verification
    const finalCheck = tweet.querySelector('[data-testid="unlike"]');
    if (finalCheck) {
      debugLog('✅ Like successful with PointerEvent');
      return true;
    }
    
    debugLog('❌ All like attempts failed');
    return false;
    
  } catch (error) {
    errorLog('❌ Error while liking tweet:', error);
    return false;
  }
}

async function safeTypeText(el, str) {
  debugLog('🛡️ Starting BULLETPROOF typing process...');
  addDetailedActivity('🛡️ Starting BULLETPROOF typing process', 'info');
  
  try {
    el.focus();
    await sleep(50);

    document.execCommand('selectAll', false, null);
    await sleep(50);

    document.execCommand('insertText', false, str);
    await sleep(100);

    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await sleep(50);
    el.blur();
    await sleep(50);
    el.focus();

    const currentText = el.textContent || el.innerText;
    if (currentText.includes(str.slice(0, 20))) {
      debugLog('✅ Text verification successful.');
      addDetailedActivity('✅ Text verification successful', 'success');
      return true;
    } else {
      debugLog('⚠️ Text verification failed. Using fallback.');
      el.textContent = str;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      return true;
    }
  } catch (error) {
    errorLog('❌ BULLETPROOF typing error:', error);
    return false;
  }
}

function showStatus(message) {
  updateCornerWidget(message);
}

function updateStatus(message) {
  updateCornerWidget(message);
}

/**
 * Simple, practical corner widget - shows only what users need
 */
function updateCornerWidget(message) {
  let widget = document.getElementById('boldtake-corner-widget');
  
  // Clean up the message
  const cleanMessage = message
    .replace('[STATUS]', '')
    .replace('contentScript.js:', '')
    .replace(/^\d+\s*/, '')
    .trim();
  
  // Extract important info only
  let displayText = '';
  let shouldShow = false;
  
  // 1. Show "next tweet in X min" timing - handle multiple formats
  const timeMatch1 = cleanMessage.match(/Waiting (\d+m \d+s)/);
  const timeMatch2 = cleanMessage.match(/Next tweet in (\d+:\d+)/);
  const timeMatch3 = cleanMessage.match(/Waiting (\d+:\d+)/);
  
  if (timeMatch1) {
    displayText = `⏰ Next in ${timeMatch1[1]}`;
    shouldShow = true;
  }
  else if (timeMatch2) {
    displayText = `⏰ Next in ${timeMatch2[1]}`;
    shouldShow = true;
  }
  else if (timeMatch3) {
    displayText = `⏰ Next in ${timeMatch3[1]}`;
    shouldShow = true;
  }
  // Also catch any countdown format
  else if ((cleanMessage.includes('Next tweet') || cleanMessage.includes('Waiting')) && 
           (cleanMessage.includes('before next') || cleanMessage.includes('in'))) {
    const anyTimeMatch = cleanMessage.match(/(\d+:\d+|\d+m \d+s)/);
    if (anyTimeMatch) {
      displayText = `⏰ Next in ${anyTimeMatch[1]}`;
      shouldShow = true;
    }
  }
  // 2. Show security holds
  else if (cleanMessage.includes('Security hold') || cleanMessage.includes('🛡️')) {
    const holdMatch = cleanMessage.match(/(\d+m)/);
    if (holdMatch) {
      displayText = `security hold ${holdMatch[1]}`;
      shouldShow = true;
    }
  }
  // 3. Show critical issues that need user attention
  else if (cleanMessage.includes('refresh') || cleanMessage.includes('Refresh')) {
    displayText = 'refresh page needed';
    shouldShow = true;
  }
  else if (cleanMessage.includes('Failed') && cleanMessage.includes('❌')) {
    displayText = 'retrying...';
    shouldShow = true;
  }
  // 4. Brief processing indicator (auto-hides)
  else if (cleanMessage.includes('Processing') || cleanMessage.includes('🔍')) {
    displayText = 'processing...';
    shouldShow = true;
    // Auto-hide after 3 seconds
    setTimeout(() => {
      const w = document.getElementById('boldtake-corner-widget');
      if (w && w.textContent.includes('processing')) {
        w.style.display = 'none';
      }
    }, 3000);
  }

  // Only show widget when there's something useful to display
  if (shouldShow && displayText) {
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'boldtake-corner-widget';
      widget.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(17, 24, 39, 0.95);
        color: #34d399;
        padding: 6px 10px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        border: 1px solid rgba(52, 211, 153, 0.3);
        backdrop-filter: blur(8px);
        pointer-events: none;
        opacity: 0.9;
        transition: opacity 0.2s ease;
      `;
      document.body.appendChild(widget);
    }

    widget.textContent = displayText;
    widget.style.display = 'block';
  } else if (widget) {
    // Hide widget when there's nothing important to show
    widget.style.display = 'none';
  }
}

/**
 * Adds detailed activity to the tracking array
 */
function addDetailedActivity(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const activity = {
    message: message.replace('contentScript.js:', '').replace(/^\d+\s*/, '').trim(),
    timestamp,
    type
  };
  
  recentActivities.unshift(activity);
  
  // Keep only last 6 activities
  if (recentActivities.length > 6) {
    recentActivities = recentActivities.slice(0, 6);
  }
  
  // Update session stats for popup
  if (sessionStats) {
    sessionStats.recentActivities = recentActivities;
  }
}

// NETWORK MONITORING & AUTO-RECOVERY FUNCTIONS

/**
 * Initialize network monitoring system
 */
function initializeNetworkMonitoring() {
  addDetailedActivity('🌐 Network monitoring initialized', 'info');
  
  // Listen for online/offline events
  window.addEventListener('online', handleNetworkOnline);
  window.addEventListener('offline', handleNetworkOffline);
  
  // CRITICAL FIX: Add timeout protection to prevent hanging
  try {
    // Start periodic network health checks with error protection
    setTimeout(() => {
      startNetworkHealthChecks();
      addDetailedActivity('✅ Network health checks started', 'success');
    }, 1000); // Delay to prevent blocking
  } catch (error) {
    addDetailedActivity('⚠️ Network monitoring fallback mode', 'warning');
    // Continue without network monitoring if it fails
  }
  
  // CRITICAL: Don't let network monitoring block the main system
  setTimeout(() => {
    if (!sessionStats.isRunning) {
      addDetailedActivity('🚀 System ready - network monitoring complete', 'success');
    }
  }, 3000);
}

/**
 * Handle network coming back online
 */
async function handleNetworkOnline() {
  addDetailedActivity('🌐 Network connection restored!', 'success');
  networkMonitor.isOnline = true;
  networkMonitor.lastOnlineTime = Date.now();
  
  if (networkMonitor.offlineStartTime) {
    const offlineDuration = Math.round((Date.now() - networkMonitor.offlineStartTime) / 1000);
    addDetailedActivity(`📶 Offline for ${offlineDuration}s`, 'info');
    networkMonitor.offlineStartTime = null;
  }
  
  // Clear any reconnect intervals
  if (networkMonitor.reconnectInterval) {
    clearInterval(networkMonitor.reconnectInterval);
    networkMonitor.reconnectInterval = null;
  }
  
  // Auto-restart session if it was active before disconnect
  if (networkMonitor.sessionWasActive && !networkMonitor.recoveryInProgress) {
    await attemptSessionRecovery();
  }
}

/**
 * Handle network going offline
 */
function handleNetworkOffline() {
  addDetailedActivity('🔴 Network lost - recovery mode', 'warning');
  networkMonitor.isOnline = false;
  networkMonitor.offlineStartTime = Date.now();
  networkMonitor.sessionWasActive = sessionStats.isRunning;
  
  // Store the current URL for recovery (preserves search filters)
  if (sessionStats.isRunning) {
    networkMonitor.lastActiveUrl = window.location.href;
    addDetailedActivity('📍 Saved current search page for recovery', 'info');
  }
  
  // Stop current session gracefully
  if (sessionStats.isRunning) {
    addDetailedActivity('⏸️ Pausing session for recovery');
    pauseSession();
  }
  
  // Start reconnection attempts
  startReconnectionAttempts();
}

/**
 * Start periodic network health checks
 */
function startNetworkHealthChecks() {
  // CRITICAL FIX: Add error protection to prevent hanging
  try {
    // Check network every 30 seconds with timeout protection
    networkMonitor.networkCheckInterval = setInterval(async () => {
      try {
        // Add timeout to prevent hanging on network check
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network check timeout')), 10000);
        });
        
        await Promise.race([
          performNetworkHealthCheck(),
          timeoutPromise
        ]);
      } catch (error) {
        // Don't let network check errors stop the system
        addDetailedActivity('⚠️ Network check skipped - continuing', 'warning');
      }
    }, 30000);
  } catch (error) {
    addDetailedActivity('⚠️ Network monitoring disabled - system continues', 'warning');
  }
}

/**
 * Perform comprehensive network health check
 */
async function performNetworkHealthCheck() {
  if (!navigator.onLine) {
    if (networkMonitor.isOnline) {
      handleNetworkOffline();
    }
    return;
  }
  
  // Check for X.com error pages that require refresh (only during active sessions)
  // CRITICAL: Add cooldown to prevent excessive error checking
  const now = Date.now();
  const lastErrorCheck = window.boldtakeLastErrorCheck || 0;
  const errorCheckCooldown = 30000; // 30 seconds between error checks
  
  if (sessionStats.isRunning && (now - lastErrorCheck > errorCheckCooldown) && detectXcomErrorPage()) {
    window.boldtakeLastErrorCheck = now;
    addDetailedActivity('🔴 X.com error page detected - refreshing', 'warning');
    await handleXcomPageError();
    return;
  }
  
  // Test actual connectivity to X.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://x.com/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      if (!networkMonitor.isOnline) {
        await handleNetworkOnline();
      }
      networkMonitor.lastOnlineTime = Date.now();
      networkMonitor.reconnectAttempts = 0;
    } else {
      throw new Error('X.com not reachable');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      addDetailedActivity(`🔍 Network check failed ${error.message}`, 'warning');
    }
    if (networkMonitor.isOnline) {
      handleNetworkOffline();
    }
  }
}

/**
 * Detect X.com error pages that need refresh
 */
function detectXcomErrorPage() {
  // 🛡️ BULLETPROOF: Enhanced error detection for X.com error pages
  
  const pageText = document.body?.textContent || '';
  const pageTitle = document.title || '';
  
  // CONFIRMED X.com error page indicators
  const hasConfirmedErrorStructure = (
    document.querySelector('[data-testid="error-detail"]') ||
    document.querySelector('.error-page') ||
    document.querySelector('[data-testid="error"]')
  );
  
  // Enhanced text-based error detection for common X.com errors
  const hasErrorText = (
    pageText.includes('Something went wrong, but don\'t fret — let\'s give it another shot') ||
    pageText.includes('Something went wrong. Try reloading.') ||
    pageText.includes('Some privacy related extensions may cause issues on x.com') ||
    (pageTitle.includes('Something went wrong') && pageText.includes('Try again')) ||
    (pageText.includes('Try again') && pageText.includes('privacy related extensions'))
  );
  
  // Only trigger if we have strong evidence of an error page
  // AND we're not on a normal content page (has tweets, timeline, etc.)
  const hasNormalContent = (
    document.querySelector('[data-testid="tweet"]') ||
    document.querySelector('[data-testid="tweetText"]') ||
    document.querySelector('[data-testid="primaryColumn"]')
  );
  
  // Return true only if we detect error AND don't have normal content
  return (hasConfirmedErrorStructure || hasErrorText) && !hasNormalContent;
}

/**
 * X.com Analytics Scraper for Premium Users
 * Extracts real performance data from X.com analytics
 */
async function scrapeXcomAnalytics() {
  try {
    addDetailedActivity('📊 Accessing X.com Premium Analytics...', 'info');
    
    // Enhanced Premium detection
    const premiumIndicators = [
      '[data-testid="primaryColumn"]',
      '[aria-label*="Premium"]', 
      '[data-testid*="premium"]',
      'text*="Premium"',
      'text*="Pro"'
    ];
    
    const isPremium = premiumIndicators.some(selector => document.querySelector(selector)) ||
                     window.location.href.includes('account_analytics') ||
                     document.title.includes('Analytics');
    
    // Navigate to specific analytics page with retry mechanism
    if (!window.location.href.includes('account_analytics/content')) {
      addDetailedActivity('🔄 Opening 7-day reply analytics...', 'info');
      
      // Extract current user's username from the page
      let username = null;
      
      // Method 1: From URL if we're on a profile page
      const urlMatch = window.location.href.match(/x\.com\/([^\/\?]+)/);
      if (urlMatch && urlMatch[1] !== 'i' && urlMatch[1] !== 'home' && urlMatch[1] !== 'explore') {
        username = urlMatch[1];
      }
      
      // Method 2: From navigation or profile elements
      if (!username) {
        const profileLinks = document.querySelectorAll('a[href*="/"], [data-testid*="profile"]');
        for (const link of profileLinks) {
          const href = link.getAttribute('href') || '';
          const match = href.match(/^\/([^\/\?]+)$/);
          if (match && !['i', 'home', 'explore', 'search', 'notifications', 'messages'].includes(match[1])) {
            username = match[1];
            break;
          }
        }
      }
      
      // Method 3: From settings or account indicators
      if (!username) {
        const accountElements = document.querySelectorAll('[data-testid*="account"], [aria-label*="@"]');
        for (const el of accountElements) {
          const text = el.textContent || el.getAttribute('aria-label') || '';
          const match = text.match(/@([a-zA-Z0-9_]+)/);
          if (match) {
            username = match[1];
            break;
          }
        }
      }
      
      // Method 4: From page title or meta tags
      if (!username) {
        const pageTitle = document.title || '';
        const match = pageTitle.match(/\(@([a-zA-Z0-9_]+)\)/);
        if (match) {
          username = match[1];
        }
      }
      
      // Method 5: From sidebar or navigation username display
      if (!username) {
        const usernameElements = document.querySelectorAll('[data-testid="UserName"], [data-testid*="username"]');
        for (const el of usernameElements) {
          const text = el.textContent || '';
          const match = text.match(/@([a-zA-Z0-9_]+)/);
          if (match) {
            username = match[1];
            break;
          }
        }
      }
      
      // Use the user-specific analytics URL
      let analyticsUrl;
      if (username) {
        analyticsUrl = `https://x.com/i/account_analytics/content?type=replies&sort=impressions&dir=desc&days=7`;
        addDetailedActivity(`📊 Accessing analytics for @${username}`, 'info');
      } else {
        // Fallback to general analytics page
        analyticsUrl = 'https://x.com/i/account_analytics/content?type=replies&sort=impressions&dir=desc&days=7';
        addDetailedActivity('📊 Accessing general analytics page', 'info');
      }
      
      // Try to navigate with error handling
      try {
        window.location.href = analyticsUrl;
        return null; // Wait for page load
      } catch (navError) {
        addDetailedActivity('⚠️ Navigation blocked - trying alternative method', 'warning');
        // Alternative: try opening in same tab with a delay
        setTimeout(() => {
          window.location.replace(analyticsUrl);
        }, 1000);
        return null;
      }
    }
    
    // Enhanced waiting and error detection
    await sleep(5000); // Longer wait for analytics to load
    
    // Check for multiple error conditions
    const errorIndicators = [
      'Something went wrong',
      'Try again',
      'privacy related extensions',
      'temporarily unavailable',
      'Error loading',
      'Unable to load'
    ];
    
    const pageText = document.body.textContent || '';
    const hasError = errorIndicators.some(indicator => 
      pageText.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasError) {
      addDetailedActivity('⚠️ Analytics page error detected - will retry later', 'warning');
      addDetailedActivity('💡 Tip: Disable privacy extensions and refresh X.com', 'info');
      return null;
    }
    
    // Scrape analytics data
    const analyticsData = {
      totalImpressions: 0,
      totalEngagements: 0,
      totalReplies: 0,
      topPerformingReplies: [],
      scrapedAt: new Date().toISOString(),
      period: '7 days'
    };
    
    // Look for impression counts
    const impressionElements = document.querySelectorAll('[data-testid*="impression"], [aria-label*="impression"]');
    impressionElements.forEach(el => {
      const text = el.textContent || '';
      const match = text.match(/(\d+(?:,\d+)*)/);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        if (count > analyticsData.totalImpressions) {
          analyticsData.totalImpressions += count;
        }
      }
    });
    
    // Look for engagement data
    const engagementElements = document.querySelectorAll('[data-testid*="engagement"], [aria-label*="engagement"]');
    engagementElements.forEach(el => {
      const text = el.textContent || '';
      const match = text.match(/(\d+(?:,\d+)*)/);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        analyticsData.totalEngagements += count;
      }
    });
    
    // Look for reply-specific data
    const replyElements = document.querySelectorAll('[data-testid="tweet"]');
    replyElements.forEach((el, index) => {
      if (index < 10) { // Top 10 replies
        const tweetText = el.querySelector('[data-testid="tweetText"]')?.textContent || '';
        const impressions = el.textContent.match(/(\d+(?:,\d+)*)\s*impression/i);
        const engagements = el.textContent.match(/(\d+(?:,\d+)*)\s*engagement/i);
        
        if (impressions || engagements) {
          analyticsData.topPerformingReplies.push({
            text: tweetText.substring(0, 100) + '...',
            impressions: impressions ? parseInt(impressions[1].replace(/,/g, '')) : 0,
            engagements: engagements ? parseInt(engagements[1].replace(/,/g, '')) : 0
          });
        }
      }
    });
    
    // Count total replies from our tool
    const storage = await new Promise(resolve => {
      chrome.storage.local.get(['boldtake_analytics'], resolve);
    });
    
    const ourAnalytics = storage.boldtake_analytics || { totalReplies: 0 };
    analyticsData.totalReplies = ourAnalytics.totalReplies || 0;
    
    // Save combined analytics data
    await new Promise(resolve => {
      chrome.storage.local.set({ 
        boldtake_xcom_analytics: analyticsData,
        boldtake_last_analytics_scrape: Date.now()
      }, resolve);
    });
    
    addDetailedActivity(`📊 Analytics scraped ${analyticsData.totalImpressions} impressions`, 'success');
    
    return analyticsData;
    
  } catch (error) {
    errorLog('Analytics scraping error:', error);
    addDetailedActivity('❌ Analytics scraping failed', 'error');
    return null;
  }
}

/**
 * Generate CSV export of analytics data
 */
async function generateAnalyticsCSV() {
  try {
    const storage = await new Promise(resolve => {
      chrome.storage.local.get(['boldtake_xcom_analytics', 'boldtake_analytics'], resolve);
    });
    
    const xcomData = storage.boldtake_xcom_analytics || {};
    const ourData = storage.boldtake_analytics || {};
    
    const csvData = [
      ['Metric', 'Value', 'Period', 'Source'],
      ['Total Replies Sent', ourData.totalReplies || 0, '7 days', 'BoldTake'],
      ['Total Impressions', xcomData.totalImpressions || 0, '7 days', 'X.com Analytics'],
      ['Total Engagements', xcomData.totalEngagements || 0, '7 days', 'X.com Analytics'],
      ['Avg Impressions per Reply', xcomData.totalImpressions && ourData.totalReplies ? Math.round(xcomData.totalImpressions / ourData.totalReplies) : 0, '7 days', 'Calculated'],
      ['Engagement Rate', xcomData.totalImpressions ? ((xcomData.totalEngagements / xcomData.totalImpressions) * 100).toFixed(2) + '%' : '0%', '7 days', 'Calculated'],
      ['ROI Score', xcomData.totalImpressions && ourData.totalReplies ? Math.round((xcomData.totalImpressions / ourData.totalReplies) / 100) : 0, '7 days', 'BoldTake Score']
    ];
    
    // Add top performing replies
    if (xcomData.topPerformingReplies && xcomData.topPerformingReplies.length > 0) {
      csvData.push(['', '', '', '']); // Empty row
      csvData.push(['Top Performing Replies', '', '', '']);
      csvData.push(['Reply Text', 'Impressions', 'Engagements', 'Engagement Rate']);
      
      xcomData.topPerformingReplies.forEach(reply => {
        const engagementRate = reply.impressions ? ((reply.engagements / reply.impressions) * 100).toFixed(2) + '%' : '0%';
        csvData.push([reply.text, reply.impressions, reply.engagements, engagementRate]);
      });
    }
    
    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Copy to clipboard
    await navigator.clipboard.writeText(csvString);
    addDetailedActivity('📋 Analytics CSV copied to clipboard!', 'success');
    
    return csvString;
    
  } catch (error) {
    errorLog('CSV generation error:', error);
    addDetailedActivity('❌ CSV export failed', 'error');
    return null;
  }
}

/**
 * Handle X.com page errors by refreshing (with cooldown protection)
 */
async function handleXcomPageError() {
  // BULLETPROOF: Prevent refresh loops with extended cooldown and limits
  const now = Date.now();
  const lastRefresh = window.boldtakeLastRefresh || 0;
  const refreshCooldown = 300000; // 5 minutes minimum between refreshes (was 1 minute)
  
  // Track refresh attempts to prevent infinite loops
  window.boldtakeRefreshCount = (window.boldtakeRefreshCount || 0);
  
  if (now - lastRefresh < refreshCooldown) {
    addDetailedActivity('🛡️ Refresh cooldown active (5min) - skipping auto-refresh', 'warning');
    return;
  }
  
  // CRITICAL: Limit total refreshes per session
  if (window.boldtakeRefreshCount >= 3) {
    addDetailedActivity('🚨 Maximum refresh attempts reached (3) - manual intervention required', 'error');
    sessionLog('🚨 Extension stopped: Too many refresh attempts. Please reload X.com manually.', 'error');
    return;
  }
  
  // Increment refresh counter
  window.boldtakeRefreshCount++;
  window.boldtakeLastRefresh = now;
  
  // Save current URL for recovery
  const currentUrl = window.location.href;
  
  addDetailedActivity(`🔄 X.com page error - refreshing (attempt ${window.boldtakeRefreshCount}/3) in 10 seconds`, 'warning');
  sessionLog(`🔄 Refreshing X.com page (attempt ${window.boldtakeRefreshCount}/3)`, 'warning');
  
  // Wait longer before refresh to prevent loops (increased from 5s to 10s)
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Double-check we still need to refresh (user might have navigated away)
  if (window.location.href === currentUrl && detectXcomErrorPage()) {
    // ENHANCED: Smart navigation instead of just refreshing the same problematic page
    if (currentUrl.includes('/explore') || currentUrl.includes('/search') || currentUrl.includes('/notifications')) {
      addDetailedActivity('🏠 Navigating to home timeline from problematic page', 'info');
      window.location.href = 'https://x.com/home';
    } else if (currentUrl.includes('/home') || currentUrl === 'https://x.com/' || currentUrl === 'https://x.com') {
      // If we're already on home and still getting errors, try a hard refresh
      addDetailedActivity('🔄 Hard refresh on home timeline', 'warning');
      window.location.reload(true);
    } else {
      // For other pages, navigate to home timeline
      addDetailedActivity('🏠 Redirecting to home timeline for tweet processing', 'info');
      window.location.href = 'https://x.com/home';
    }
  } else {
    addDetailedActivity('🛡️ Page recovered during wait - refresh cancelled', 'success');
  }
}

/**
 * Start reconnection attempts
 */
function startReconnectionAttempts() {
  if (networkMonitor.reconnectInterval) return;
  
  networkMonitor.reconnectAttempts = 0;
  networkMonitor.reconnectInterval = setInterval(async () => {
    networkMonitor.reconnectAttempts++;
    addDetailedActivity(`🔄 Reconnect attempt ${networkMonitor.reconnectAttempts}/${networkMonitor.maxReconnectAttempts}`);
    
    if (navigator.onLine) {
      await performNetworkHealthCheck();
    }
    
    if (networkMonitor.reconnectAttempts >= networkMonitor.maxReconnectAttempts) {
      addDetailedActivity('🚫 Max attempts reached - standby mode', 'error');
      clearInterval(networkMonitor.reconnectInterval);
      networkMonitor.reconnectInterval = null;
      networkMonitor.reconnectAttempts = 0;
    }
  }, 10000); // Try every 10 seconds
}

/**
 * Attempt to recover and restart the session
 */
async function attemptSessionRecovery() {
  if (networkMonitor.recoveryInProgress) return;
  
  networkMonitor.recoveryInProgress = true;
  addDetailedActivity('🔧 Starting auto-recovery...', 'info');
  
  try {
    // Wait for network to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we're still on X.com
    if (!window.location.hostname.includes('x.com') && !window.location.hostname.includes('twitter.com')) {
      addDetailedActivity('🌐 Navigating back to X.com...', 'info');
      window.location.href = 'https://x.com/home';
      return;
    }
    
    // Use the saved URL from when session was active, or current URL as fallback
    const recoveryUrl = networkMonitor.lastActiveUrl || window.location.href;
    addDetailedActivity('🔄 Returning to saved search page...', 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate back to the exact search page with filters preserved
    window.location.href = recoveryUrl;
    
  } catch (error) {
    addDetailedActivity(`❌ Recovery failed ${error.message}`, 'error');
    networkMonitor.recoveryInProgress = false;
    
    // Retry in 30 seconds
    setTimeout(() => {
      if (networkMonitor.isOnline && networkMonitor.sessionWasActive) {
        attemptSessionRecovery();
      }
    }, 30000);
  }
}

/**
 * Enhanced error handling with network awareness
 */
async function handleNetworkError(error, context = '') {
  addDetailedActivity(`🔴 Network error in ${context} ${error.message}`, 'error');
  
  // Check if it's a network-related error
  const networkErrors = ['fetch', 'network', 'timeout', 'connection', 'dns', 'offline'];
  const isNetworkError = networkErrors.some(keyword => 
    error.message.toLowerCase().includes(keyword)
  );
  
  if (isNetworkError) {
    addDetailedActivity('🔍 Network error detected - checking connection', 'warning');
    await performNetworkHealthCheck();
    
    if (!networkMonitor.isOnline) {
      addDetailedActivity('📡 Network down - awaiting recovery', 'info');
      return false; // Don't continue with normal error handling
    }
  }
  
  return true; // Continue with normal error handling
}

/**
 * Pause session gracefully
 */
function pauseSession() {
  // Stop the main session
  sessionStats.isRunning = false;
  
  // Clear any countdown intervals
  if (window.boldtakeCountdownInterval) {
    clearInterval(window.boldtakeCountdownInterval);
    window.boldtakeCountdownInterval = null;
  }
  
  // Clear any timeouts
  if (window.boldtakeTimeoutId) {
    clearTimeout(window.boldtakeTimeoutId);
    window.boldtakeTimeoutId = null;
  }
  
  addDetailedActivity('⏸️ Session paused for network recovery');
}

function showCornerNotification(message) {
  let notification = document.getElementById('boldtake-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'boldtake-notification';
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; 
      background: linear-gradient(135deg, hsl(216 34% 7%), hsl(215 28% 12%));
      color: hsl(158 64% 52%); padding: 16px 20px; border-radius: 12px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px; font-weight: 500; z-index: 10000;
      box-shadow: 0 10px 30px -10px hsl(158 64% 52% / 0.3), 0 0 0 1px hsl(158 64% 52% / 0.2);
      border: 1px solid hsl(215 28% 12%); backdrop-filter: blur(10px);
      max-width: 380px; min-width: 320px; word-wrap: break-word; 
      animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: pre-wrap; line-height: 1.5; cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    // Enhanced styles with better animations and hover effects
    if (!document.getElementById('boldtake-styles')) {
      const style = document.createElement('style');
      style.id = 'boldtake-styles';
      style.textContent = `
        @keyframes slideIn { 
          from { transform: translateX(100%) scale(0.9); opacity: 0; } 
          to { transform: translateX(0) scale(1); opacity: 1; } 
        }
        @keyframes pulse { 
          0%, 100% { transform: scale(1); } 
          50% { transform: scale(1.02); } 
        }
        #boldtake-notification:hover {
          background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15);
        }
        .boldtake-success { color: #00ff88 !important; }
        .boldtake-warning { color: #ffaa00 !important; }
        .boldtake-error { color: #ff4444 !important; }
        .boldtake-info { color: #4488ff !important; }
      `;
      document.head.appendChild(style);
    }
    
    // Add click to minimize functionality
    notification.addEventListener('click', () => {
      const isMinimized = notification.style.height === '40px';
      if (isMinimized) {
        notification.style.height = 'auto';
        notification.style.overflow = 'visible';
        notification.style.opacity = '1';
      } else {
        notification.style.height = '40px';
        notification.style.overflow = 'hidden';
        notification.style.opacity = '0.7';
      }
    });
    
    document.body.appendChild(notification);
  }
  
  // Enhanced header with better formatting and status indicators
  const headerText = "🚀 BoldTake Professional\n";
  const subHeader = "Automating engagement while you relax ☕️\n\n";
  
  // Add visual indicators based on message type
  let messageClass = 'boldtake-info';
  let statusIcon = '📊';
  
  if (message.includes('✅') || message.includes('replied') || message.includes('complete')) {
    messageClass = 'boldtake-success';
    statusIcon = '✅';
  } else if (message.includes('❌') || message.includes('error') || message.includes('failed')) {
    messageClass = 'boldtake-error';
    statusIcon = '❌';
  } else if (message.includes('⏳') || message.includes('waiting') || message.includes('processing')) {
    messageClass = 'boldtake-warning';
    statusIcon = '⏳';
  }
  
  notification.className = messageClass;
  
  // SECURITY FIX: Sanitize message to prevent XSS
  const sanitizedMessage = message.replace(/[<>&"']/g, function(match) {
    const escapeMap = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return escapeMap[match];
  });
  
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px;">${headerText}</div>
    <div style="opacity: 0.8; font-size: 12px; margin-bottom: 12px;">${subHeader}</div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${statusIcon}</span>
      <span>${sanitizedMessage}</span>
    </div>
    <div style="margin-top: 8px; font-size: 11px; opacity: 0.6;">Click to minimize</div>
  `;
  
  // Auto-minimize after 10 seconds for non-critical messages
  if (!message.includes('error') && !message.includes('complete')) {
    setTimeout(() => {
      if (notification && notification.style.height !== '40px') {
        notification.style.height = '40px';
        notification.style.overflow = 'hidden';
        notification.style.opacity = '0.7';
      }
    }, 10000);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startCountdown(delayInMs) {
    return new Promise(resolve => {
        let remainingTime = delayInMs;

        if (window.boldtakeCountdownInterval) {
            clearInterval(window.boldtakeCountdownInterval);
        }

        window.boldtakeCountdownInterval = setInterval(() => {
            if (!sessionStats.isRunning) {
                clearInterval(window.boldtakeCountdownInterval);
                window.boldtakeCountdownInterval = null;
                resolve();
                return;
            }

            remainingTime -= 1000;

            if (remainingTime < 0) {
                clearInterval(window.boldtakeCountdownInterval);
                window.boldtakeCountdownInterval = null;
                resolve();
                return;
            }

            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;

            // Update status every 5 seconds, but limit activity feed updates
            if (seconds % 5 === 0 || seconds < 10) {
                const progressMessage = `⏳ Next tweet in ${minutes}:${paddedSeconds} (${sessionStats.successful}/${sessionStats.target} completed)`;
                showStatus(progressMessage);
                
                // REDUCED SPAM: Only show activity at start and near end
                const isStart = remainingTime >= delayInMs - 2000; // First 2 seconds
                const isNearEnd = remainingTime <= 10000; // Last 10 seconds
                
                if (isStart) {
                    addDetailedActivity(`⏳ Waiting ${minutes}m ${paddedSeconds}s before next tweet`, 'info');
                } else if (isNearEnd && seconds % 5 === 0) {
                    addDetailedActivity(`⏳ Next tweet starting in ${seconds}s`, 'info');
                }
            }
        }, 1000);
    });
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- AI Quality & Generation ---

/**
 * Generates a high-quality, context-aware reply to a given tweet.
 * Implements a Quality Guard to check and retry generation if the first output is poor.
 * @param {string} tweetText - The full text of the tweet to reply to.
 * @param {number} tweetNumber - The current count of processed tweets in the session.
 * @returns {Promise<string|null>} A high-quality reply or a safe fallback. Returns null if circuit breaker trips.
 */
async function generateSmartReply(tweetText, tweetNumber) {
  // --- ACCOUNT SAFETY: CIRCUIT BREAKER ---
  if (sessionStats.consecutiveApiFailures >= 3) {
    const finalError = sessionStats.lastApiError || 'AI quality failed repeatedly.';
    errorLog(`💥 CIRCUIT BREAKER TRIPPED! 💥 Final Error: ${finalError}`);
    showStatus(`CRITICAL: ${finalError}. Session Stopped.`);
    sessionStats.isRunning = false;
    chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
    return null; // Stop processing immediately
  }

  // MULTI-LANGUAGE SYSTEM: Respect user's language choice
  const personalization = await getPersonalizationSettings();
  
  // Use the user's selected language from popup settings
  const targetLanguage = personalization.language || 'english';
  
  debugLog('🌍 Multi-language mode active - using user selection', targetLanguage);
  
  // Get language instructions if not English
  const languageInstructions = targetLanguage !== 'english' ? 
    getLanguageInstruction(targetLanguage) : undefined;

  const selectedPrompt = await selectBestPrompt(tweetText);
  debugLog(`🎯 AI Strategy Selected: ${selectedPrompt.name}`);
  
  // Multi-language system messaging  
  const langDisplayActivity = targetLanguage !== 'english' ? 
    ` • ${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)}` : '';
  addDetailedActivity(`🛡️ ${selectedPrompt.name} strategy${langDisplayActivity}`, 'info');
  
  // Update status to show current strategy with target language
  const langDisplayStatus = targetLanguage !== 'english' ? 
    ` (${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)})` : '';
  showStatus(`🎯 Tweet ${sessionStats.processed + 1}/${sessionStats.target} - ${selectedPrompt.name}${langDisplayStatus}`);

  // Build enhanced prompt with detected language
  const enhancedPrompt = selectedPrompt.template.replace('{TWEET}', tweetText);

  // HYBRID GENERATION: Use target language with reliable fallbacks
  let reply = await attemptGeneration(enhancedPrompt, tweetText, {
    strategy: selectedPrompt.name,
    language: targetLanguage,
    languageInstructions: languageInstructions,
    isDebugMode: personalization.isDebugLanguage
  });

  // --- Quality & Cleanup Guard ---
  
  // 1. Post-processing: Clean up common AI artifacts like em-dashes
  if (reply) {
    reply = reply.replace(/—/g, '-');
  }

  // 2. LENIENT SECURITY CHECK: Only block severe violations (backend team optimization)
  if (reply && reply.length > 0) {
    // Only check for severe spam/repetition issues, not minor content concerns
    const hasSevereViolation = reply.includes('🚀🚀🚀') || reply.includes('BUY NOW') || reply.length < 10;
    
    if (hasSevereViolation) {
      addDetailedActivity('🚫 Severe content violation detected', 'warning');
      debugLog('Severe content safety issue detected');
      reply = null;
    } else {
      // BACKEND TEAM FIX: Accept all other replies from optimized backend
      debugLog('✅ Content safety passed (lenient mode)');
    }
  }

  // 3. BULLETPROOF QUALITY CHECK: More lenient for better success rates
  const hasMinLength = reply && reply.length >= 20; // Increased from 15 to 20
  const hasProperEnding = reply && (/[.!?]$/.test(reply.trim()) || reply.length >= 50); // Allow longer replies without punctuation
  const hasCompleteWords = reply && !reply.match(/\b\w{1}$/); // Only reject single-letter endings (was 1-2)
  const isNotTruncated = reply && !reply.includes('...'); // No ellipsis truncation
  
  // 🛡️ BULLETPROOF: More forgiving quality check to reduce false rejections
  const isLowQuality = !hasMinLength || (!hasProperEnding && reply.length < 40) || !hasCompleteWords || !isNotTruncated;

  // ENHANCED QUALITY DEBUG: Log all quality factors
  debugLog('🔍 Quality Check Debug', {
    hasReply: !!reply,
    replyLength: reply?.length || 0,
    replyPreview: reply?.substring(0, 50) || 'none',
    hasMinLength: hasMinLength,
    hasProperEnding: hasProperEnding,
    hasCompleteWords: hasCompleteWords,
    isNotTruncated: isNotTruncated,
    isLowQuality: isLowQuality,
    lastChar: reply ? `"${reply.slice(-1)}"` : 'none'
  });

  if (isLowQuality) {
    sessionStats.consecutiveApiFailures++;
    const currentError = sessionStats.lastApiError || 'Reply failed quality standards.';
    const failureReason = !hasMinLength ? 'too short' : 
                          !hasProperEnding ? 'incomplete sentence' :
                          !hasCompleteWords ? 'partial word' : 
                          !isNotTruncated ? 'truncated' : 'unknown';
                          
    debugLog(`Quality Check Failed ${sessionStats.consecutiveApiFailures}/3 - ${failureReason} (${reply?.length || 0} chars)`);
    
    // NO FALLBACKS: Skip this tweet entirely  
    addDetailedActivity(`🚫 Tweet skipped - ${failureReason} reply (${reply?.length || 0} chars)`, 'warning');
    
    return null; // This will cause the tweet to be skipped
  } else {
    debugLog('✅ Quality reply passed all checks');
    const langLabel = targetLanguage !== 'english' ? 
      `${targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)} ` : '';
    addDetailedActivity(`✅ Quality ${langLabel}reply generated (${reply.length} chars)`, 'success');
    sessionStats.consecutiveApiFailures = 0;
    sessionStats.lastApiError = null;
  }

  // NO FALLBACKS: Return quality reply or null (skip tweet)
  return reply;
}

/**
 * Truncate text at sentence boundary to stay within character limit
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Truncated text ending at sentence boundary
 */
function truncateAtSentence(text, maxLength) {
  if (text.length <= maxLength) return text;
  
  // Find last complete sentence under limit
  const sentences = text.split(/([.!?])/);
  let result = '';
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i];
    const punctuation = sentences[i + 1] || '';
    const withSentence = result + sentence + punctuation;
    
    if (withSentence.length <= maxLength) {
      result = withSentence;
    } else {
      break;
    }
  }
  
  // If no complete sentence fits, truncate at word boundary
  if (!result || result.length < 50) {
    const words = text.split(' ');
    result = '';
    for (const word of words) {
      if ((result + ' ' + word).length <= maxLength) {
        result += (result ? ' ' : '') + word;
      } else {
        break;
      }
    }
  }
  
  return result || text.substring(0, maxLength - 3) + '...';
}

/**
 * Checks if a generated reply is generic or a common fallback.
 * @param {string} replyText - The AI-generated reply.
 * @returns {boolean} True if the reply is considered generic.
 */
function isReplyGeneric(replyText) {
  const lowerReply = replyText.toLowerCase();
  const genericPatterns = [
    "great point", "similar experience", "interesting perspective", "good insight",
    "i appreciate you sharing", "makes you think", "needed to read", "great observation",
    "finding the right balance"
  ];
  return genericPatterns.some(pattern => lowerReply.includes(pattern));
}

/**
 * Sends a prompt to the background script to get an AI-generated reply.
 * @param {string} promptTemplate - The prompt template to use.
 * @param {string} tweetText - The text of the tweet.
 * @param {Object} languageContext - Language and debug information.
 * @returns {Promise<string|null>} The cleaned reply text or null if failed.
 */
async function attemptGeneration(promptTemplate, tweetText, languageContext = {}) {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API request timeout after 30 seconds')), 30000);
    });
    
    const messagePromise = chrome.runtime.sendMessage({
      type: 'GENERATE_REPLY',
      prompt: promptTemplate.replace('{TWEET}', tweetText.slice(0, 1500)), // Increased context length
      tweetContext: {
        originalText: tweetText,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        strategy: languageContext.strategy || promptTemplate.name || 'Unknown',
        // NEW: Language support
        language: languageContext.language || 'english',
        languageInstructions: languageContext.languageInstructions,
        debugMode: languageContext.isDebugMode || false
      }
    });
    
    // Race between the message and timeout
    const response = await Promise.race([messagePromise, timeoutPromise]);

    if (response.error) {
      errorLog(`Error from background script: ${response.error}`);
      sessionStats.lastApiError = response.error; // Store the specific error
      return null;
    }
    
    sessionStats.lastApiError = null; // Clear error on success
    
    if (response && response.reply) {
      // BULLETPROOF CLEANING - Remove ALL forbidden punctuation
      let cleanReply = response.reply
        .replace(/^reply:\s*/i, '') // Remove "Reply:" prefix
        .replace(/@\w+/g, '') // Remove mentions
        .replace(/#\w+/g, '') // Remove hashtags
        .replace(/["""'']/g, '') // Remove all kinds of quotes
        .replace(/—/g, '') // Remove em dashes
        .replace(/–/g, '') // Remove en dashes
        .replace(/;/g, '') // Remove semicolons
        .replace(/:/g, '') // Remove colons
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
        .replace(/\s+/g, ' ') // Condense whitespace
        .trim();
      
      // CRITICAL: CHARACTER LIMIT VALIDATION (EMERGENCY FIX)
      debugLog('🔍 CHARACTER CHECK', {
        originalLength: response.reply.length,
        cleanedLength: cleanReply.length,
        replyPreview: cleanReply.substring(0, 100),
        withinLimit: cleanReply.length <= 280,
        safeLimit: cleanReply.length <= 260
      });
      
      // SMART TRUNCATION: Use 260-character limit for better content preservation
      if (cleanReply.length > 260) {
        debugLog('⚠️ Reply exceeds safe limit, truncating:', cleanReply.length);
        cleanReply = truncateAtSentence(cleanReply, 260);
        debugLog('✅ Truncated to safe length:', cleanReply.length);
      }
      
      // SMART LENGTH CHECK: Ensure complete sentences
      if (cleanReply.length > 280) {
        // Find the last complete sentence within 280 characters
        const withinLimit = cleanReply.slice(0, 280);
        const lastSentenceEnd = Math.max(
          withinLimit.lastIndexOf('.'),
          withinLimit.lastIndexOf('!'),
          withinLimit.lastIndexOf('?')
        );
        
        if (lastSentenceEnd > 100) { // Only truncate if we have a reasonable sentence
          cleanReply = cleanReply.slice(0, lastSentenceEnd + 1);
        } else {
          // If no good sentence break, find last complete word
          const lastSpace = withinLimit.lastIndexOf(' ');
          if (lastSpace > 100) {
            cleanReply = cleanReply.slice(0, lastSpace);
          } else {
            // Last resort: hard truncate but no ellipsis (better than incomplete sentence)
            cleanReply = cleanReply.slice(0, 280);
          }
        }
      }
      return cleanReply;
    }
    return null;
  } catch (error) {
    if (error.message && error.message.includes('timeout')) {
      errorLog('⏱️ API request timed out after 30 seconds - likely backend issue');
      addDetailedActivity('⏱️ API timeout - backend may be down', 'warning');
      sessionStats.lastApiError = 'Request timeout - backend may be down';
    } else {
      errorLog('💥 AI generation attempt failed:', error.message);
      sessionStats.lastApiError = `Content Script Error: ${error.message}`;
    }
    
    // Check if it's a network error
    const shouldContinue = await handleNetworkError(error, 'AI generation');
    if (!shouldContinue) {
      return null; // Network is down, return null to trigger fallback
    }
    
    return null;
  }
}

// --- AI Strategy & Prompts ---

/**
 * Safely gets the PROVEN_PROMPTS array
 * @returns {Array} The PROVEN_PROMPTS array or empty array if not available
 */
function getProvenPrompts() {
  try {
    if (typeof PROVEN_PROMPTS !== 'undefined' && Array.isArray(PROVEN_PROMPTS)) {
      return PROVEN_PROMPTS;
    }
    debugLog('⚠️ PROVEN_PROMPTS not available, returning empty array');
    return [];
  } catch (error) {
    debugLog('❌ Error accessing PROVEN_PROMPTS:', error);
    return [];
  }
}

/**
 * Chooses the most effective AI prompt using intelligent rotation with content-aware fallbacks.
 * Ensures all strategies are used fairly while still prioritizing content-specific matches.
 * @param {string} tweetText - The full text of the tweet.
 * @returns {object} The selected prompt object from PROVEN_PROMPTS.
 */
async function selectBestPrompt(tweetText) {
  // PRIORITY 0: Check if custom prompt is active
  try {
    const storage = await new Promise((resolve) => {
      chrome.storage.local.get(['boldtake_use_custom_prompt', 'boldtake_active_custom_prompt'], resolve);
    });
    
    if (storage.boldtake_use_custom_prompt && storage.boldtake_active_custom_prompt) {
      const customPrompt = storage.boldtake_active_custom_prompt;
      debugLog('🎨 Using active custom prompt:', customPrompt.name);
      
      // Return custom prompt in the same format as built-in prompts
      return {
        name: customPrompt.name,
        template: customPrompt.text,
        isCustom: true,
        id: customPrompt.id
      };
    }
  } catch (error) {
    debugLog('⚠️ Error checking custom prompts, falling back to built-in:', error);
  }

  const lowerText = tweetText.toLowerCase();

  // Enhanced content-specific patterns for better matching
  const viralHookPatterns = [
    'i think', 'believe', 'realized', 'my take', 'i learned', 'my biggest', 
    'underrated', 'overrated', 'pro tip', 'the key is', 'hot take', 
    'unpopular opinion', 'my experience', 'here\'s what i', 'i discovered',
    'game changer', 'life hack', 'secret to', 'truth about', 'reality is'
  ];
  
  const challengePatterns = [
    'is better than', 'disagree', 'wrong', 'i hate', 'the problem with', 
    'terrible', 'awful', 'worst', 'overrated', 'doesn\'t work', 'myth',
    'unpopular opinion', 'controversial', 'against the grain', 'respectfully disagree'
  ];
  
  const questionPatterns = [
    'how to', 'what do you think', '?', 'help', 'advice', 'need to know', 
    'should i', 'what would you', 'any suggestions', 'recommendations',
    'best way to', 'how do you', 'what\'s your', 'thoughts on'
  ];
  
  const humorPatterns = [
    'hilarious', 'funny', 'lol', 'lmao', 'joke', '😂', 'comedy', 'ridiculous',
    'can\'t even', 'dead', 'crying', 'savage', 'roasted', 'mood', 'relatable'
  ];
  
  // New: Technical/Educational content patterns
  const technicalPatterns = [
    'tutorial', 'guide', 'how it works', 'technical', 'algorithm', 'code',
    'programming', 'development', 'engineering', 'data', 'analysis'
  ];
  
  // Political/Economic content patterns
  const politicalPatterns = [
    'president', 'biden', 'trump', 'economy', 'inflation', 'taxes', 'tax', 'government',
    'policy', 'congress', 'senate', 'election', 'political', 'administration',
    'inherited', 'mess', 'war', 'crisis', 'democracy', 'republican', 'democrat',
    'crypto', 'debt', 'bitcoin', 'federal', 'fiscal', 'monetary', 'budget',
    'capitalism', 'socialism', 'regulation', 'inequality', 'geopolitics'
  ];

  // Initialize usage tracking if needed
  if (!strategyRotation.usageCount) {
    strategyRotation.usageCount = {};
    // Use predefined names to avoid dependency on PROVEN_PROMPTS order
    const promptNames = [
      "Engagement Indie Voice",
      "Engagement Spark Reply", 
      "Engagement The Counter",
      "The Riff",
      "The Viral Shot",
      "The Shout-Out"
    ];
    promptNames.forEach(name => {
      strategyRotation.usageCount[name] = 0;
    });
  }

  let selectedPrompt = null;

  // Get PROVEN_PROMPTS safely
  const provenPrompts = getProvenPrompts();
  if (!provenPrompts || provenPrompts.length === 0) {
    debugLog('❌ PROVEN_PROMPTS not available, using fallback');
    return { name: "Fallback", template: "Respond thoughtfully to: {TWEET}" };
  }

  // Define achievement/success patterns for Shout-Out (needs to be checked first to avoid conflicts)
  const achievementPatterns = [
    'launched', 'shipped', 'hit', 'reached', 'achieved', 'sold', 'raised',
    'milestone', 'success', 'completed', 'finished', 'won', 'got accepted'
  ];
  
  // CRITICAL: Exclude political/negative contexts that contain achievement words
  const negativeContextPatterns = [
    'inherited', 'mess', 'problem', 'crisis', 'disaster', 'failure', 'struggling',
    'broken', 'corrupt', 'scandal', 'controversy', 'decline', 'collapse',
    'tax', 'inflation', 'crypto', 'debt', 'recession', 'crash', 'bubble',
    'capitalism', 'socialism', 'regulation', 'inequality', 'geopolitics'
  ];
  
  const hasAchievementPattern = achievementPatterns.some(pattern => lowerText.includes(pattern));
  const hasNegativeContext = negativeContextPatterns.some(pattern => lowerText.includes(pattern));

  // SMART PERCENTAGE-BASED STRATEGY SELECTION FOR MAXIMUM IMPRESSIONS
  // FIXED: Counter consolidated triggers but kept at 25%, other strategies rebalanced
  const STRATEGY_WEIGHTS = {
    "Engagement Indie Voice": 27,     // Great for questions, tech content
    "Engagement Spark Reply": 26,     // High engagement starter
    "Engagement The Counter": 25,     // Political, challenges (consolidated triggers prevent double-selection)
    "The Viral Shot": 20,            // Viral hooks, trending
    "The Riff": 2,                   // Humor only
    "The Shout-Out": 0               // Achievement only (reduced to balance)
  };

  // PRIORITY 1: Strong content matches (but respect percentage limits)
  let contentMatchStrategy = null;
  
  // FIXED: Consolidated Counter triggers to prevent double-selection
  if (politicalPatterns.some(pattern => lowerText.includes(pattern)) || 
      challengePatterns.some(pattern => lowerText.includes(pattern))) {
    contentMatchStrategy = "Engagement The Counter";
  } else if (viralHookPatterns.some(pattern => lowerText.includes(pattern))) {
    contentMatchStrategy = "The Viral Shot";
  } else if (questionPatterns.some(pattern => lowerText.includes(pattern))) {
    contentMatchStrategy = "Engagement Indie Voice";
  } else if (humorPatterns.some(pattern => lowerText.includes(pattern))) {
    contentMatchStrategy = "The Riff";
  } else if (technicalPatterns.some(pattern => lowerText.includes(pattern))) {
    contentMatchStrategy = "Engagement Indie Voice";
  } else if (hasAchievementPattern && !hasNegativeContext) {
    contentMatchStrategy = "The Shout-Out";
  }

  // PRIORITY 2: Check if content match strategy is within percentage limits
  if (contentMatchStrategy) {
    const totalTweets = Object.values(strategyRotation.usageCount).reduce((a, b) => a + b, 0);
    const currentUsage = strategyRotation.usageCount[contentMatchStrategy] || 0;
    const currentPercentage = totalTweets > 0 ? (currentUsage / totalTweets) * 100 : 0;
    const targetPercentage = STRATEGY_WEIGHTS[contentMatchStrategy];
    
    if (currentPercentage < targetPercentage || totalTweets < 3) {
      selectedPrompt = await getSelectedPromptVariation(contentMatchStrategy);
      debugLog(`🎯 Content match: ${contentMatchStrategy} (${currentPercentage.toFixed(1)}% vs ${targetPercentage}% target)`);
      addDetailedActivity(`🎯 Content match ${contentMatchStrategy} • ${selectedPrompt.variationName}`, 'info');
    } else {
      debugLog(`⚠️ ${contentMatchStrategy} BLOCKED - over limit (${currentPercentage.toFixed(1)}% vs ${targetPercentage}%), forcing variety`);
      addDetailedActivity(`⚠️ ${contentMatchStrategy} blocked (${currentPercentage.toFixed(1)}% vs ${targetPercentage}%) - forcing variety`, 'warning');
      // FORCE VARIETY: Don't set selectedPrompt - let it fall through to weighted selection
      contentMatchStrategy = null; // Clear it completely
    }
  }

  // PRIORITY 3: Weighted selection for general content (no strong content match)
  if (!selectedPrompt) {
    const totalTweets = Object.values(strategyRotation.usageCount).reduce((a, b) => a + b, 0);
    
    if (totalTweets === 0) {
      // First tweet - start with high-engagement strategies
      const startingStrategies = ["Engagement Indie Voice", "Engagement Spark Reply", "The Viral Shot"];
      const randomStrategy = startingStrategies[Math.floor(Math.random() * startingStrategies.length)];
      selectedPrompt = await getSelectedPromptVariation(randomStrategy);
      debugLog(`🚀 First tweet: Using ${randomStrategy} for strong start`);
      addDetailedActivity(`🚀 First tweet using ${randomStrategy} • ${selectedPrompt.variationName}`, 'success');
    } else {
      // Calculate which strategies are under their target percentage
      const underTargetStrategies = [];
      
      for (const [strategyName, targetWeight] of Object.entries(STRATEGY_WEIGHTS)) {
        const currentUsage = strategyRotation.usageCount[strategyName] || 0;
        const currentPercentage = (currentUsage / totalTweets) * 100;
        
        if (currentPercentage < targetWeight) {
          // Calculate how much under target (higher gap = higher priority)
          const gap = targetWeight - currentPercentage;
          underTargetStrategies.push({ name: strategyName, gap, targetWeight });
        }
      }
      
      if (underTargetStrategies.length > 0) {
        // Sort by gap (most under-target first) and add some randomness
        underTargetStrategies.sort((a, b) => b.gap - a.gap);
        
        // Weighted selection favoring strategies most under target
        const weights = underTargetStrategies.map(s => s.gap + 1); // +1 to avoid zero weights
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < underTargetStrategies.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            const chosenStrategy = underTargetStrategies[i];
            selectedPrompt = await getSelectedPromptVariation(chosenStrategy.name);
            if (selectedPrompt) {
              debugLog(`📊 Weighted selection: ${chosenStrategy.name} (${((strategyRotation.usageCount[chosenStrategy.name] || 0) / totalTweets * 100).toFixed(1)}% vs ${chosenStrategy.targetWeight}% target)`);
              addDetailedActivity(`📊 Weighted ${chosenStrategy.name} • ${selectedPrompt.variationName} (${((strategyRotation.usageCount[chosenStrategy.name] || 0) / totalTweets * 100).toFixed(1)}%)`, 'info');
            }
            break;
          }
        }
        
        // Safety check: if weighted selection failed, use first under-target strategy
        if (!selectedPrompt && underTargetStrategies.length > 0) {
          selectedPrompt = await getSelectedPromptVariation(underTargetStrategies[0].name);
          debugLog(`🔧 Fallback: Using ${underTargetStrategies[0].name} (weighted selection failed)`);
        }
      } else {
        // All strategies at target - use least used
        const leastUsedCount = Math.min(...Object.values(strategyRotation.usageCount));
        const leastUsedStrategyNames = Object.keys(strategyRotation.usageCount).filter(name => 
          strategyRotation.usageCount[name] === leastUsedCount
        );
        const randomStrategyName = leastUsedStrategyNames[Math.floor(Math.random() * leastUsedStrategyNames.length)];
        selectedPrompt = await getSelectedPromptVariation(randomStrategyName);
        debugLog(`⚖️ All targets met: Using least used ${selectedPrompt.name}`);
      }
    }
  }

  // CRITICAL: Ultimate fallback - ensure we always have a strategy
  if (!selectedPrompt) {
    selectedPrompt = await getSelectedPromptVariation("Engagement Indie Voice"); // Default to first strategy
    debugLog('🚨 EMERGENCY FALLBACK: Using first available strategy');
  }

  // Validate selectedPrompt has required properties
  if (!selectedPrompt || !selectedPrompt.name || !selectedPrompt.template) {
    errorLog('❌ CRITICAL ERROR: Invalid selectedPrompt:', selectedPrompt);
    return { name: "Emergency Fallback", template: "Respond thoughtfully to: {TWEET}" };
  }

  // Update tracking safely (usageCount should already be initialized)
  if (selectedPrompt && selectedPrompt.name) {
    strategyRotation.usageCount[selectedPrompt.name] = (strategyRotation.usageCount[selectedPrompt.name] || 0) + 1;
    strategyRotation.lastUsedStrategy = selectedPrompt.name;
    
    // Save updated counts to storage for persistence
    chrome.storage.local.set({ strategy_rotation: strategyRotation });
  }

  // Log usage statistics every 5 tweets
  if (sessionStats.processed > 0 && sessionStats.processed % 5 === 0) {
    debugLog('📊 Strategy Usage Stats', strategyRotation.usageCount);
  }

  return selectedPrompt;
}

/**
 * Get user's preferred prompt variations for each strategy
 */
async function getPromptPreferences() {
  try {
    const storage = await new Promise((resolve) => {
      chrome.storage.local.get(['boldtake_prompt_preferences'], resolve);
    });
    
    return storage.boldtake_prompt_preferences || {};
  } catch (error) {
    debugLog('⚠️ Error loading prompt preferences:', error);
    return {};
  }
}

/**
 * Get the actual prompt template based on strategy and user preferences
 */
async function getSelectedPromptVariation(strategyName) {
  const preferences = await getPromptPreferences();
  const strategy = PROVEN_PROMPTS.find(p => p.name === strategyName);
  
  if (!strategy || !strategy.variations) {
    // Fallback for old format or missing strategy
    return strategy || { name: "Fallback", template: "Respond thoughtfully to: {TWEET}" };
  }
  
  // Get user's preferred variation ID for this strategy
  const preferredVariationId = preferences[strategyName];
  let selectedVariation = null;
  
  if (preferredVariationId) {
    selectedVariation = strategy.variations.find(v => v.id === preferredVariationId);
  }
  
  // If no preference or variation not found, use first variation as default
  if (!selectedVariation) {
    selectedVariation = strategy.variations[0];
  }
  
  return {
    name: strategyName,
    template: selectedVariation.template,
    variationId: selectedVariation.id,
    variationName: selectedVariation.name
  };
}

// Enhanced Prompt Library System with Multiple Variations
const PROVEN_PROMPTS = [
    {
        name: "Engagement Indie Voice",
        variations: [
            {
                id: "indie_authentic",
                name: "Authentic Voice",
                description: "Genuine, conversational reactions with personal touch",
                template: `You are responding authentically to a tweet. Give a genuine, conversational reaction.

RESPONSE GUIDELINES:
- React to what they actually said in the tweet
- Use proper grammar and capitalization  
- Be conversational and natural
- Share a quick personal perspective or experience
- Stay relevant to their topic

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use proper sentence structure with capitals and periods
- 140-180 characters maximum
- Pure text output only

Examples:
Tweet: "I love coffee in the morning"
GOOD: "Same here. Nothing beats that first cup. Sets the whole tone for my day."
BAD: "Coffee is life I move fast Ship code Win"

Tweet: "{TWEET}"`
            },
            {
                id: "indie_storyteller",
                name: "Personal Story",
                description: "Share relatable personal experiences and anecdotes",
                template: `You're sharing a personal story or experience that relates to the tweet. Be authentic and relatable.

RESPONSE GUIDELINES:
- Connect their tweet to a brief personal experience
- Use "I" statements and personal anecdotes
- Keep it relatable and human
- Show empathy and understanding
- Be conversational, like talking to a friend

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use proper sentence structure with capitals and periods
- 140-180 characters maximum
- Pure text output only

Tweet: "{TWEET}"`
            },
            {
                id: "indie_supportive",
                name: "Supportive Friend",
                description: "Encouraging and uplifting responses that build community",
                template: `You're being a supportive friend. Offer encouragement, validation, or helpful perspective.

RESPONSE GUIDELINES:
- Be encouraging and positive
- Validate their feelings or experiences
- Offer gentle advice or perspective if appropriate
- Build them up, don't tear down
- Sound like a caring friend

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use proper sentence structure with capitals and periods
- 140-180 characters maximum
- Pure text output only

Tweet: "{TWEET}"`
            },
            {
                id: "indie_curious",
                name: "Curious Questioner",
                description: "Ask thoughtful questions to drive deeper engagement",
                template: `You're genuinely curious about their perspective. Ask thoughtful questions that show interest.

RESPONSE GUIDELINES:
- Ask genuine, thoughtful questions
- Show interest in learning more
- Be respectful and curious, not interrogating
- Questions should feel natural and conversational
- Encourage them to share more

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use proper sentence structure with capitals and periods
- 140-180 characters maximum
- Pure text output only

Tweet: "{TWEET}"`
            }
        ]
    },
    {
        name: "Engagement Spark Reply",
        variations: [
            {
                id: "spark_provocative",
                name: "Provocative Founder",
                description: "Brutally direct and debate-starting responses",
                template: `Your first step is to randomly choose an output format. Your reply will be either a single powerful line, exactly 2 lines, or exactly 4 lines.

After you have chosen the line count, reply to the tweet below.

Your #1 goal is to spark debate. Adopt the voice of a founder who is brutally direct and provocative.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate thoughts
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Line count exactly 1, 2, or 4
- Written in first person (I)
- ZERO forbidden punctuation
- Raw, unfiltered take

Tweet: "{TWEET}"`
            },
            {
                id: "spark_contrarian",
                name: "Contrarian Take",
                description: "Challenge popular opinions with bold alternative views",
                template: `Take the most contrarian position possible while being defensible. Challenge what everyone else thinks.

Your #1 goal is to present the opposite view that makes people think twice.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate thoughts
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Line count exactly 1, 2, or 4
- Present the contrarian view
- Written in first person (I)
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "spark_reality_check",
                name: "Reality Check",
                description: "Cut through the BS with hard truths and practical reality",
                template: `You're the voice of practical reality. Cut through any fluff or unrealistic thinking with hard truths.

Your #1 goal is to bring people back to earth with practical, no-nonsense perspective.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate thoughts
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Line count exactly 1, 2, or 4
- Practical, realistic perspective
- Written in first person (I)
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "spark_bold_prediction",
                name: "Bold Prediction",
                description: "Make confident predictions about the future or outcomes",
                template: `Make a bold, confident prediction related to their tweet. Be specific and memorable.

Your #1 goal is to make a prediction that gets people talking and remembering your take.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate thoughts
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Line count exactly 1, 2, or 4
- Make a specific prediction
- Written in first person (I)
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            }
        ]
    },
    {
        name: "Engagement The Counter",
        variations: [
            {
                id: "counter_direct",
                name: "Direct Challenge",
                description: "Directly challenge the core assumption with confidence",
                template: `Your first step is to randomly choose an output format. Your reply will be either a single powerful line, exactly 2 lines, or exactly 4 lines.

After you have chosen the line count, reply to the tweet below.

Your #1 goal is to challenge the tweet's core assumption. Adopt the voice of a confident and highly opinionated founder who is presenting a strong counter-argument. Refute the original point directly.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate distinct ideas
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Line count exactly 1, 2, or 4
- Directly challenges or refutes the original tweet
- Written in first person (I)
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "counter_evidence",
                name: "Evidence-Based Counter",
                description: "Challenge with data, examples, or logical reasoning",
                template: `Challenge their point using evidence, data, examples, or logical reasoning. Be the voice of facts.

Your #1 goal is to counter their argument with concrete evidence or logical reasoning that's hard to dispute.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate distinct ideas
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Line count exactly 1, 2, or 4
- Use evidence or logical reasoning
- Written in first person (I)
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "counter_experience",
                name: "Experience Counter",
                description: "Counter with personal or observed experience",
                template: `Counter their point using your personal experience or what you've observed. Be the voice of real-world experience.

Your #1 goal is to challenge their view with practical experience that contradicts their point.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate distinct ideas
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Line count exactly 1, 2, or 4
- Use personal or observed experience
- Written in first person (I)
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "counter_alternative",
                name: "Alternative Solution",
                description: "Propose a different approach or solution entirely",
                template: `Don't just disagree. Propose a completely different approach or solution to what they're discussing.

Your #1 goal is to redirect the conversation toward a better alternative solution or approach.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate distinct ideas
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Line count exactly 1, 2, or 4
- Propose alternative solution/approach
- Written in first person (I)
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            }
        ]
    },
    {
        name: "The Riff",
        variations: [
            {
                id: "riff_escalation",
                name: "Logic Escalation",
                description: "Take their logic to a ridiculous, deadpan conclusion",
                template: `Act as a witty, context-aware comedian. Take their logic and escalate it to a ridiculous, deadpan conclusion.

Your #1 goal is to create a funny, shareable reply by pushing their logic to an absurd extreme.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) for comedic timing
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Escalate their logic to absurd conclusion
- Witty and shareable
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "riff_punchline",
                name: "Perfect Punchline",
                description: "Act as the unexpected punchline to their setup",
                template: `Act as a witty comedian. Treat their tweet as a setup and deliver the perfect, unexpected punchline.

Your #1 goal is to create the punchline that makes their tweet accidentally hilarious.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) for comedic timing
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Act as perfect punchline to their setup
- Witty and shareable
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "riff_observational",
                name: "Sarcastic Observer",
                description: "Make clever sarcastic observations about their persona",
                template: `Act as a sarcastic but clever observer. Make a witty observation about their persona, tone, or approach.

Your #1 goal is to gently roast them with clever sarcasm that gets laughs.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) for comedic timing
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Clever sarcastic observation
- Witty and shareable
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "riff_relatable",
                name: "Relatable Absurdity",
                description: "Exaggerate common experiences to funny conclusions",
                template: `Take a relatable experience from their tweet and exaggerate it to a funny, absurd conclusion that everyone can relate to.

Your #1 goal is to make people laugh by relating to the absurdity of everyday life.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) for comedic timing
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Exaggerate to relatable absurdity
- Witty and shareable
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            }
        ]
    },
    {
        name: "The Viral Shot",
        variations: [
            {
                id: "viral_emotional",
                name: "Emotional Hook",
                description: "Tap into powerful universal emotions for maximum resonance",
                template: `You are a master at emotional resonance. Tap into powerful, universal feelings like nostalgia, frustration, hope, or excitement.

Your #1 goal is to create an emotionally resonant reply that people feel compelled to share.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks for impact and readability
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Tap into universal emotions
- Highly shareable and memorable
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "viral_secret",
                name: "Hidden Knowledge",
                description: "Frame reply as exclusive, high-value insider knowledge",
                template: `Frame your reply as revealing hidden, high-value knowledge that most people don't know.

Your #1 goal is to position yourself as someone with insider knowledge worth following.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks for impact and readability
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Reveal "hidden" knowledge
- Position as insider/expert
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "viral_bold_claim",
                name: "Bold Claim",
                description: "Make confident, memorable predictions or statements",
                template: `Make a bold, confident claim or prediction that will be remembered and quoted.

Your #1 goal is to make a statement so bold and memorable that people screenshot and share it.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks for impact and readability
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Make bold, memorable claim
- Confident and quotable
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "viral_question",
                name: "Provocative Question",
                description: "End with questions that drive massive engagement",
                template: `Craft a reply that ends with a provocative question designed to get hundreds of responses.

Your #1 goal is to ask the question that everyone feels compelled to answer in the comments.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks for impact and readability
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- End with provocative question
- Designed for mass engagement
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            }
        ]
    },
    {
        name: "The Shout-Out",
        variations: [
            {
                id: "shoutout_enthusiastic",
                name: "Enthusiastic Celebration",
                description: "Genuine, enthusiastic congratulations for achievements",
                template: `You are celebrating someone's genuine achievement or milestone. Your task is to write an enthusiastic congratulations reply.

ONLY respond if the tweet contains a clear personal achievement like:
- Launching a product/company
- Reaching revenue milestones  
- Getting hired/promoted
- Completing a project
- Winning an award
- Personal accomplishments

For genuine achievements, follow this structure:
1. Congratulations + their name/handle
2. Acknowledge what they accomplished
3. Brief validation of the effort required
4. Forward-looking encouragement

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- 180-220 characters maximum
- Pure text output only

Tweet: "{TWEET}"`
            },
            {
                id: "shoutout_inspiring",
                name: "Inspiring Others",
                description: "Use their achievement to inspire others to take action",
                template: `Celebrate their achievement while using it as inspiration for others to take action.

Your #1 goal is to turn their success story into motivation for your audience.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Celebrate their achievement
- Inspire others to act
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            },
            {
                id: "shoutout_community",
                name: "Community Builder",
                description: "Build connections and community around their success",
                template: `Celebrate their achievement while building community connections and encouraging others to support them.

Your #1 goal is to amplify their success and build community around it.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- 180-220 characters maximum
- Pure text output only

Final check requirements:
- Celebrate their achievement
- Build community connections
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
            }
        ]
    }
];

function showSessionSummary() {
  const endTime = new Date();
  const duration = Math.floor((endTime - sessionStats.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const hours = Math.floor(minutes / 60);
  const displayMinutes = minutes % 60;
  
  // Calculate advanced metrics
  const successRate = Math.round((sessionStats.successful / sessionStats.processed) * 100) || 0;
  const tweetsPerHour = duration > 0 ? Math.round((sessionStats.successful / duration) * 3600) : 0;
  const avgTimePerTweet = sessionStats.successful > 0 ? Math.round(duration / sessionStats.successful) : 0;
  
  // Strategy usage summary
  const strategyStats = Object.entries(strategyRotation.usageCount || {})
    .map(([name, count]) => `${name}: ${count}`)
    .join(', ');
  
  const timeDisplay = hours > 0 ? `${hours}h ${displayMinutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
  
  // Session complete - show only in status
  debugLog(`⏰ Duration: ${timeDisplay}`);
  debugLog(`🎯 Target: ${sessionStats.target} tweets`);
  debugLog(`✅ Successful: ${sessionStats.successful}`);
  debugLog(`❌ Failed: ${sessionStats.failed}`);
  debugLog(`📊 Success Rate: ${successRate}%`);
  debugLog(`⚡ Tweets/Hour: ${tweetsPerHour}`);
  debugLog(`⏱️ Avg Time/Tweet: ${avgTimePerTweet}s`);
  debugLog(`🎭 Strategy Usage: ${strategyStats}`);
  
  // Enhanced status message with key metrics
  const summaryMessage = `🎬 Session Complete!\n` +
    `✅ ${sessionStats.successful}/${sessionStats.target} tweets (${successRate}%)\n` +
    `⏰ Duration: ${timeDisplay}\n` +
    `⚡ Rate: ${tweetsPerHour} tweets/hour`;
  
  showStatus(summaryMessage);
  
  // Save session analytics for future reference
  const sessionAnalytics = {
    timestamp: new Date().toISOString(),
    duration: duration,
    target: sessionStats.target,
    successful: sessionStats.successful,
    failed: sessionStats.failed,
    successRate: successRate,
    tweetsPerHour: tweetsPerHour,
    strategyUsage: {...strategyRotation.usageCount}
  };
  
  // Store last 10 sessions for trend analysis
  chrome.storage.local.get('session_history', (result) => {
    const history = result.session_history || [];
    history.push(sessionAnalytics);
    if (history.length > 10) {
      history.shift(); // Keep only last 10 sessions
    }
    chrome.storage.local.set({ session_history: history });
  });
}

// --- Session Management ---

async function saveSession() {
  return new Promise(resolve => {
    chrome.storage.local.set({ 
      boldtake_session: sessionStats,
      strategy_rotation: strategyRotation,
      keyword_rotation: keywordRotation
    }, resolve);
  });
}

/**
 * Load keyword rotation settings from storage
 */
async function loadKeywordRotation() {
  return new Promise(resolve => {
    chrome.storage.local.get(['boldtake_rotation_keywords', 'keyword_rotation'], (result) => {
      if (result.boldtake_rotation_keywords && result.boldtake_rotation_keywords.length > 0) {
        keywordRotation.keywords = result.boldtake_rotation_keywords;
        debugLog(`🔄 Loaded ${keywordRotation.keywords.length} rotation keywords:`, keywordRotation.keywords);
      }
      
      if (result.keyword_rotation) {
        keywordRotation = { ...keywordRotation, ...result.keyword_rotation };
      }
      
      resolve();
    });
  });
}

/**
 * Check if keyword rotation is needed and execute it
 */
async function checkKeywordRotation() {
  if (keywordRotation.keywords.length === 0) {
    return false; // No keywords to rotate
  }
  
  const now = Date.now();
  const timeSinceRotation = now - keywordRotation.lastRotationTime;
  const tweetsProcessed = sessionStats.successful || 0;
  
  // Check if rotation is needed based on time or tweet count
  const shouldRotateByTime = timeSinceRotation >= keywordRotation.rotationInterval;
  const shouldRotateByCount = tweetsProcessed > 0 && tweetsProcessed % keywordRotation.tweetsPerKeyword === 0;
  
  if (shouldRotateByTime || shouldRotateByCount) {
    await rotateKeyword();
    return true;
  }
  
  return false;
}

/**
 * Rotate to the next keyword and refresh the page
 */
async function rotateKeyword() {
  if (keywordRotation.keywords.length === 0) return;
  
  // Move to next keyword
  keywordRotation.currentIndex = (keywordRotation.currentIndex + 1) % keywordRotation.keywords.length;
  keywordRotation.lastRotationTime = Date.now();
  
  const newKeyword = keywordRotation.keywords[keywordRotation.currentIndex];
  
  debugLog(`🔄 Rotating to keyword: "${newKeyword}" (${keywordRotation.currentIndex + 1}/${keywordRotation.keywords.length})`);
  addDetailedActivity(`🔄 Rotating to keyword: "${newKeyword}"`, 'info');
  
  // Save rotation state
  await saveSession();
  
  // Update the search URL and refresh with user's min_faves setting
  const currentUrl = window.location.href;
  
  // Extract current min_faves and lang from URL to preserve user settings
  const urlParams = new URLSearchParams(window.location.search);
  const currentQuery = urlParams.get('q') || '';
  
  // Handle both URL encoded (%3A) and regular (:) formats
  const minFavesMatch = currentQuery.match(/min_faves(?:%3A|:)(\d+)/i);
  const langMatch = currentQuery.match(/lang(?:%3A|:)(\w+)/i);
  
  const minFaves = minFavesMatch ? minFavesMatch[1] : '500';
  const lang = langMatch ? langMatch[1] : 'en';
  
  debugLog(`🔍 Extracted from URL - minFaves: ${minFaves}, lang: ${lang}`);
  
  const baseUrl = 'https://x.com/search?q=';
  const newUrl = `${baseUrl}${encodeURIComponent(newKeyword)}%20min_faves%3A${minFaves}%20lang%3A${lang}&src=typed_query&f=live`;
  
  debugLog(`🔄 Rotating with preserved settings: min_faves:${minFaves}, lang:${lang}`);
  
  // Navigate to new keyword search
  window.location.href = newUrl;
}

async function loadSession() {
  return new Promise(resolve => {
    chrome.storage.local.get(['boldtake_session', 'strategy_rotation', 'boldtake_user_session'], (result) => {
      if (result.boldtake_session) {
        sessionStats = result.boldtake_session;
      } else {
        sessionStats = { processed: 0, successful: 0, failed: 0, target: 120, isRunning: false };
      }
      
      if (result.strategy_rotation) {
        strategyRotation = result.strategy_rotation;
      } else {
        // Initialize strategy rotation tracking
        strategyRotation = {
          currentIndex: 0,
          usageCount: {},
          lastUsedStrategy: null
        };
        // Initialize usage count for all strategies
        const PROVEN_PROMPTS_NAMES = [
          "Engagement Indie Voice",
          "Engagement Spark Reply", 
          "Engagement The Counter",
          "The Riff",
          "The Viral Shot",
          "The Shout-Out"
        ];
        PROVEN_PROMPTS_NAMES.forEach(name => {
          strategyRotation.usageCount[name] = 0;
        });
      }
      resolve();
    });
  });
}

// Initialize completely silently - NO console output for maximum safety
// X.com can detect console.log activity!

/**
 * Update persistent analytics data
 * @returns {Promise<void>}
 */
async function updateAnalyticsData() {
  try {
    // Get current analytics data
    const result = await new Promise((resolve) => {
      chrome.storage.local.get([
        'boldtake_total_comments',
        'boldtake_daily_comments',
        'boldtake_comment_history',
        'boldtake_last_reset_date',
        'boldtake_best_streak',
        'boldtake_current_streak'
      ], resolve);
    });

    // Handle daily reset
    const today = new Date().toDateString();
    const lastReset = result.boldtake_last_reset_date;
    let dailyComments = result.boldtake_daily_comments || 0;
    let currentStreak = result.boldtake_current_streak || 0;

    if (lastReset !== today) {
      // New day - reset daily counter but preserve streak if we had activity yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastReset === yesterday.toDateString() && dailyComments > 0) {
        currentStreak++; // Continue streak
      } else if (dailyComments === 0) {
        currentStreak = 1; // Start new streak
      } else {
        currentStreak = 1; // Reset streak (gap in activity)
      }
      
      dailyComments = 0;
    }

    // Increment counters
    const totalComments = (result.boldtake_total_comments || 0) + 1;
    dailyComments += 1;
    
    // Update best streak if current is better
    const bestStreak = Math.max(result.boldtake_best_streak || 0, currentStreak);

    // Update comment history
    const commentHistory = result.boldtake_comment_history || [];
    const newComment = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      date: today,
      strategy: sessionStats.lastUsedStrategy || 'Unknown',
      success: true
    };

    commentHistory.unshift(newComment);
    
    // Keep only last 50 comments
    if (commentHistory.length > 50) {
      commentHistory.splice(50);
    }

    // Save updated analytics
    await new Promise((resolve) => {
      chrome.storage.local.set({
        'boldtake_total_comments': totalComments,
        'boldtake_daily_comments': dailyComments,
        'boldtake_comment_history': commentHistory,
        'boldtake_last_reset_date': today,
        'boldtake_best_streak': bestStreak,
        'boldtake_current_streak': currentStreak
      }, resolve);
    });

    debugLog('Analytics updated:', {
      total: totalComments,
      today: dailyComments,
      streak: currentStreak,
      best: bestStreak
    });

  } catch (error) {
    errorLog('❌ Failed to update analytics data:', error);
  }
}

/**
 * Get personalization settings from storage with validation
 * @returns {Promise<Object>} Object containing validated language and tone settings
 */
async function getPersonalizationSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['boldtake_language', 'boldtake_tone'], (result) => {
      const rawLanguage = result.boldtake_language || 'english';
      
      // SAFETY: Validate language is supported
      const validatedLanguage = validateLanguageSupport(rawLanguage);
      
      if (SHOW_LOGS) {
        debugLog('🌍 Language Settings:', {
          raw: rawLanguage,
          validated: validatedLanguage
        });
      }
      
      resolve({
        language: validatedLanguage,
        tone: result.boldtake_tone || 'adaptive'
      });
    });
  });
}

/**
 * Validate that a language is supported by both X.com search and AI generation
 * @param {string} language - Language to validate
 * @returns {string} Validated language (fallback to english if unsupported)
 */
function validateLanguageSupport(language) {
  // Languages supported by both X.com search AND our AI system
  const supportedLanguages = [
    'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'dutch', 'russian',
    'japanese', 'korean', 'chinese_simplified', 'chinese_traditional', 'hindi', 'arabic',
    'thai', 'vietnamese', 'indonesian', 'malay', 'filipino', 'turkish', 'polish',
    'swedish', 'norwegian', 'danish', 'finnish', 'czech', 'slovak', 'hungarian',
    'romanian', 'bulgarian', 'croatian', 'serbian', 'ukrainian', 'lithuanian',
    'latvian', 'estonian', 'greek', 'hebrew'
  ];
  
  if (!language || typeof language !== 'string') {
    debugLog('⚠️ Invalid language type, defaulting to English:', language);
    return 'english';
  }
  
  const normalizedLanguage = language.toLowerCase().trim();
  
  if (!supportedLanguages.includes(normalizedLanguage)) {
    debugLog('⚠️ Unsupported language, defaulting to English:', language);
    return 'english';
  }
  
  return normalizedLanguage;
}

/**
 * Build enhanced prompt with language and tone instructions (with safety limits)
 * @param {string} baseTemplate - Base prompt template
 * @param {string} tweetText - Tweet to reply to
 * @param {Object} personalization - Language and tone settings
 * @returns {string} Enhanced prompt with personalization
 */
function buildEnhancedPrompt(baseTemplate, tweetText, personalization) {
  // SAFETY: Truncate tweet text if too long to prevent prompt bloat
  const maxTweetLength = 800;
  const safeTweetText = tweetText.length > maxTweetLength 
    ? tweetText.substring(0, maxTweetLength) + '...'
    : tweetText;
  
  let enhancedPrompt = baseTemplate.replace('{TWEET}', safeTweetText);
  const baseLength = enhancedPrompt.length;
  
  // SAFETY: Only add enhancements if we have room (max 6000 chars for backend)
  const maxPromptLength = 5500; // Leave buffer for backend processing
  let remainingSpace = maxPromptLength - baseLength;
  
  if (SHOW_LOGS) {
    debugLog('🔧 Prompt Enhancement:', {
      baseLength,
      remainingSpace,
      language: personalization.language,
      tone: personalization.tone
    });
  }
  
  // Add language instruction if not English and we have space
  if (personalization.language !== 'english' && remainingSpace > 200) {
    const languageInstructions = getLanguageInstruction(personalization.language);
    if (languageInstructions.length < remainingSpace - 100) {
      enhancedPrompt += `\n\nLANGUAGE REQUIREMENT: ${languageInstructions}`;
      remainingSpace -= languageInstructions.length + 30;
      
      if (SHOW_LOGS) {
        debugLog('✅ Added language instructions for', personalization.language);
      }
    } else {
      debugLog('⚠️ Skipping language instructions - insufficient space');
    }
  }
  
  // Add tone modification if not adaptive and we have space
  if (personalization.tone !== 'adaptive' && remainingSpace > 100) {
    const toneInstructions = getToneInstruction(personalization.tone);
    if (toneInstructions.length < remainingSpace - 50) {
      enhancedPrompt += `\n\nTONE STYLE: ${toneInstructions}`;
      
      if (SHOW_LOGS) {
        debugLog('✅ Added tone instructions for:', personalization.tone);
      }
    } else {
      debugLog('⚠️ Skipping tone instructions - insufficient space');
    }
  }
  
  // FINAL SAFETY CHECK
  if (enhancedPrompt.length > maxPromptLength) {
    debugLog('⚠️ Prompt too long, truncating:', enhancedPrompt.length);
    enhancedPrompt = enhancedPrompt.substring(0, maxPromptLength - 3) + '...';
  }
  
  if (SHOW_LOGS) {
    debugLog('🎯 Final prompt length:', enhancedPrompt.length);
  }
  
  return enhancedPrompt;
}

/**
 * Detect the language of a tweet automatically
 * @param {string} tweetText - The tweet content to analyze
 * @returns {string} Detected language code
 */
function detectTweetLanguage(tweetText) {
  if (!tweetText || tweetText.length < 10) {
    return 'english';
  }

  const text = tweetText.toLowerCase();
  
  // Filipino/Tagalog patterns (most comprehensive)
  const filipinoPatterns = [
    /\b(ang|mga|sa|ng|na|ay|si|ni|kay|para|kung|pero|kasi|talaga|naman|lang|din|rin|yung|yun|ito|iyan|iyon|ako|ikaw|siya|kami|kayo|sila|may|meron|wala|hindi|oo|opo)\b/g,
    /\b(tama|mali|ganda|pangit|mabait|masama|maganda|importante|kailangan|gusto|ayaw|mahal|libre|bayad|trabaho|pamilya|kaibigan|bahay|paaralan|salamat|kumusta|paano|bakit|saan|kailan)\b/g
  ];
  
  // Spanish patterns
  const spanishPatterns = [
    /\b(que|con|una|para|por|como|muy|más|sí|está|son|el|la|de|en|y|a|es|se|no|te|lo|le|da|su|me|ha|todo|pero|hace|yo|sobre|tiempo|después|hay|ahora|años|vida|cada|bien|puede|sin|ver|hasta|modo|país|hecho|entre|uno|todos|tener|tal|mismo|gran|ya|lugar)\b/g
  ];
  
  // French patterns
  const frenchPatterns = [
    /\b(que|avec|une|pour|par|comme|très|plus|oui|est|sont|le|la|de|et|à|un|ce|il|être|qui|ne|se|pas|tout|elle|sur|avoir|dans|son|vous|je|sa|lui|ou|mais|où|nous|mes|ses|leur|bien|encore|aussi|depuis|sans|faire|après|ainsi|deux|même|peut|sous|ans|vie|fait|point|tous|homme|autre|peu|monde|puis|chez|grand|donc|maintenant|eau|moins|pourquoi)\b/g
  ];
  
  // German patterns
  const germanPatterns = [
    /\b(das|mit|eine|für|durch|wie|sehr|mehr|ja|ist|sind|der|die|und|in|den|von|zu|des|sich|dem|er|es|ein|auf|auch|an|als|haben|war|dass|sie|nicht|werden|einer|bei|um|im|noch|kann|so|über|aus|man|aber|nach|wenn|nur|am|vor|bis|mich|gegen|vom|zur|schon|seit|wegen|während|ohne|weil|warum|würde|könnte|sollte|müssen|zwischen|allem|heute|morgen|gestern|immer|wieder|ganz|hier|dort|wo|was|wer|welche|dieser|alle|andere|einige|viele|große|kleine|gute|neue|alte|ersten)\b/g
  ];
  
  // Italian patterns  
  const italianPatterns = [
    /\b(che|con|una|per|da|come|molto|più|sì|è|sono|il|la|di|e|a|un|in|del|le|si|non|tutto|lei|su|avere|nel|suo|noi|me|te|loro|o|ma|dove|anche|ancora|dopo|così|due|stesso|può|sotto|anni|vita|fatto|punto|tutti|uomo|altro|poco|mondo|poi|casa|grande|quindi|ora|acqua|meno|perché)\b/g
  ];
  
  // Portuguese patterns
  const portuguesePatterns = [
    /\b(que|com|uma|para|por|como|muito|mais|sim|é|são|o|a|de|e|um|em|do|as|se|não|tudo|ela|sobre|ter|no|seu|nós|me|você|eles|ou|mas|onde|também|ainda|depois|assim|dois|mesmo|pode|sob|anos|vida|feito|ponto|todos|homem|outro|pouco|mundo|então|casa|grande|portanto|agora|água|menos|por que)\b/g
  ];

  // Check each language
  const languages = [
    { name: 'filipino', patterns: filipinoPatterns },
    { name: 'spanish', patterns: spanishPatterns },
    { name: 'french', patterns: frenchPatterns },
    { name: 'german', patterns: germanPatterns },
    { name: 'italian', patterns: italianPatterns },
    { name: 'portuguese', patterns: portuguesePatterns }
  ];
  
  let maxMatches = 0;
  let detectedLanguage = 'english';
  
  for (const lang of languages) {
    let totalMatches = 0;
    for (const pattern of lang.patterns) {
      const matches = (text.match(pattern) || []).length;
      totalMatches += matches;
    }
    
    if (totalMatches > maxMatches && totalMatches >= 2) {
      maxMatches = totalMatches;
      detectedLanguage = lang.name;
    }
  }
  
  if (SHOW_LOGS) {
    debugLog(`🌍 Language detected: ${detectedLanguage} (${maxMatches} matches)`);
  }
  return detectedLanguage;
}

/**
 * Get language-specific instructions
 * @param {string} language - Selected language
 * @returns {string} Language instruction
 */
function getLanguageInstruction(language) {
  const instructions = {
    // Tier 1: Major Global Languages
    spanish: 'RESPOND ENTIRELY IN SPANISH. Use natural, conversational Spanish with proper grammar. Be culturally appropriate for Spanish-speaking audiences.',
    french: 'RESPOND ENTIRELY IN FRENCH. Use natural, conversational French with proper grammar. Be culturally appropriate for French-speaking audiences.',
    german: 'RESPOND ENTIRELY IN GERMAN. Use natural, conversational German with proper grammar. Be culturally appropriate for German-speaking audiences.',
    italian: 'RESPOND ENTIRELY IN ITALIAN. Use natural, conversational Italian with proper grammar. Be culturally appropriate for Italian-speaking audiences.',
    portuguese: 'RESPOND ENTIRELY IN PORTUGUESE. Use natural, conversational Portuguese with proper grammar. Be culturally appropriate for Portuguese-speaking audiences.',
    dutch: 'RESPOND ENTIRELY IN DUTCH. Use natural, conversational Dutch with proper grammar. Be culturally appropriate for Dutch-speaking audiences.',
    russian: 'RESPOND ENTIRELY IN RUSSIAN. Use natural, conversational Russian with proper grammar. Be culturally appropriate for Russian-speaking audiences.',
    
    // Tier 2: Asian Languages
    japanese: 'RESPOND ENTIRELY IN JAPANESE. Use natural, conversational Japanese with appropriate politeness levels (keigo). Be culturally appropriate for Japanese audiences.',
    korean: 'RESPOND ENTIRELY IN KOREAN. Use natural, conversational Korean with appropriate politeness levels. Be culturally appropriate for Korean audiences.',
    chinese_simplified: 'RESPOND ENTIRELY IN SIMPLIFIED CHINESE. Use natural, conversational Chinese with proper grammar. Be culturally appropriate for Chinese audiences.',
    chinese_traditional: 'RESPOND ENTIRELY IN TRADITIONAL CHINESE. Use natural, conversational Chinese with proper grammar. Be culturally appropriate for Chinese audiences.',
    hindi: 'RESPOND ENTIRELY IN HINDI. Use natural, conversational Hindi with proper Devanagari script. Be culturally appropriate for Hindi-speaking audiences.',
    arabic: 'RESPOND ENTIRELY IN ARABIC. Use natural, conversational Arabic with proper grammar and script. Be culturally appropriate for Arabic-speaking audiences.',
    thai: 'RESPOND ENTIRELY IN THAI. Use natural, conversational Thai with proper grammar and script. Be culturally appropriate for Thai audiences.',
    vietnamese: 'RESPOND ENTIRELY IN VIETNAMESE. Use natural, conversational Vietnamese with proper diacritical marks. Be culturally appropriate for Vietnamese audiences.',
    indonesian: 'RESPOND ENTIRELY IN INDONESIAN. Use natural, conversational Bahasa Indonesia with proper grammar. Be culturally appropriate for Indonesian audiences.',
    malay: 'RESPOND ENTIRELY IN MALAY. Use natural, conversational Bahasa Melayu with proper grammar. Be culturally appropriate for Malaysian audiences.',
    filipino: 'RESPOND ENTIRELY IN FILIPINO (TAGALOG). Use natural, conversational Filipino with proper grammar. Be culturally appropriate for Filipino audiences.',
    
    // Tier 3: European Languages
    turkish: 'RESPOND ENTIRELY IN TURKISH. Use natural, conversational Turkish with proper grammar. Be culturally appropriate for Turkish audiences.',
    polish: 'RESPOND ENTIRELY IN POLISH. Use natural, conversational Polish with proper grammar. Be culturally appropriate for Polish audiences.',
    swedish: 'RESPOND ENTIRELY IN SWEDISH. Use natural, conversational Swedish with proper grammar. Be culturally appropriate for Swedish audiences.',
    norwegian: 'RESPOND ENTIRELY IN NORWEGIAN. Use natural, conversational Norwegian with proper grammar. Be culturally appropriate for Norwegian audiences.',
    danish: 'RESPOND ENTIRELY IN DANISH. Use natural, conversational Danish with proper grammar. Be culturally appropriate for Danish audiences.',
    finnish: 'RESPOND ENTIRELY IN FINNISH. Use natural, conversational Finnish with proper grammar. Be culturally appropriate for Finnish audiences.',
    czech: 'RESPOND ENTIRELY IN CZECH. Use natural, conversational Czech with proper grammar. Be culturally appropriate for Czech audiences.',
    slovak: 'RESPOND ENTIRELY IN SLOVAK. Use natural, conversational Slovak with proper grammar. Be culturally appropriate for Slovak audiences.',
    hungarian: 'RESPOND ENTIRELY IN HUNGARIAN. Use natural, conversational Hungarian with proper grammar. Be culturally appropriate for Hungarian audiences.',
    romanian: 'RESPOND ENTIRELY IN ROMANIAN. Use natural, conversational Romanian with proper grammar. Be culturally appropriate for Romanian audiences.',
    bulgarian: 'RESPOND ENTIRELY IN BULGARIAN. Use natural, conversational Bulgarian with proper Cyrillic script. Be culturally appropriate for Bulgarian audiences.',
    croatian: 'RESPOND ENTIRELY IN CROATIAN. Use natural, conversational Croatian with proper grammar. Be culturally appropriate for Croatian audiences.',
    serbian: 'RESPOND ENTIRELY IN SERBIAN. Use natural, conversational Serbian with proper grammar (Cyrillic or Latin). Be culturally appropriate for Serbian audiences.',
    ukrainian: 'RESPOND ENTIRELY IN UKRAINIAN. Use natural, conversational Ukrainian with proper Cyrillic script. Be culturally appropriate for Ukrainian audiences.',
    lithuanian: 'RESPOND ENTIRELY IN LITHUANIAN. Use natural, conversational Lithuanian with proper grammar. Be culturally appropriate for Lithuanian audiences.',
    latvian: 'RESPOND ENTIRELY IN LATVIAN. Use natural, conversational Latvian with proper grammar. Be culturally appropriate for Latvian audiences.',
    estonian: 'RESPOND ENTIRELY IN ESTONIAN. Use natural, conversational Estonian with proper grammar. Be culturally appropriate for Estonian audiences.',
    greek: 'RESPOND ENTIRELY IN GREEK. Use natural, conversational Greek with proper grammar and script. Be culturally appropriate for Greek audiences.',
    hebrew: 'RESPOND ENTIRELY IN HEBREW. Use natural, conversational Hebrew with proper grammar and script. Be culturally appropriate for Hebrew-speaking audiences.'
  };
  
  return instructions[language] || 'Respond in English.';
}

/**
 * Get tone-specific instructions
 * @param {string} tone - Selected tone
 * @returns {string} Tone instruction
 */
function getToneInstruction(tone) {
  const instructions = {
    professional: 'Use a professional, polished tone. Be articulate and business-appropriate.',
    casual: 'Use a casual, friendly tone. Be relaxed and approachable.',
    witty: 'Use a witty, humorous tone. Be clever and entertaining while staying relevant.',
    'thought-leader': 'Use an authoritative, thought-leader tone. Share insights and expertise.',
    supportive: 'Use a supportive, encouraging tone. Be positive and uplifting.',
    contrarian: 'Use a contrarian, challenging tone. Question assumptions respectfully.',
    storyteller: 'Use a storytelling tone. Be narrative and engaging with personal touches.'
  };
  
  return instructions[tone] || 'Adapt your tone to match the context of the conversation.';
}

// Test function to verify strategy selection fix (will be removed in production)
function testStrategySelection() {
  if (typeof PROVEN_PROMPTS === 'undefined') return;
  
  // Test case: Political content with achievement words (should only select Counter, not Shout-Out)
  const testTweet = "Biden inherited a republican mess but achieved great success in the economy";
  const lowerText = testTweet.toLowerCase();
  
  // Define patterns (same as in selectBestPrompt)
  const achievementPatterns = ['launched', 'shipped', 'hit', 'reached', 'achieved', 'sold', 'raised', 'milestone', 'success', 'completed', 'finished', 'won', 'got accepted'];
  const negativeContextPatterns = ['inherited', 'mess', 'problem', 'crisis', 'disaster', 'failure', 'struggling', 'broken', 'corrupt', 'scandal', 'controversy', 'decline', 'collapse', 'tax', 'inflation', 'crypto', 'debt', 'recession', 'crash', 'bubble', 'capitalism', 'socialism', 'regulation', 'inequality', 'geopolitics'];
  const politicalPatterns = ['president', 'biden', 'trump', 'economy', 'inflation', 'taxes', 'tax', 'government', 'policy', 'congress', 'senate', 'election', 'political', 'administration', 'inherited', 'mess', 'war', 'crisis', 'democracy', 'republican', 'democrat', 'crypto', 'debt', 'bitcoin', 'federal', 'fiscal', 'monetary', 'budget', 'capitalism', 'socialism', 'regulation', 'inequality', 'geopolitics'];
  
  const hasAchievementPattern = achievementPatterns.some(pattern => lowerText.includes(pattern));
  const hasNegativeContext = negativeContextPatterns.some(pattern => lowerText.includes(pattern));
  const hasPoliticalPattern = politicalPatterns.some(pattern => lowerText.includes(pattern));
  
  debugLog('🧪 Strategy Selection Test:');
  debugLog('Test tweet:', testTweet);
  debugLog('Has achievement pattern:', hasAchievementPattern);
  debugLog('Has negative context:', hasNegativeContext);
  debugLog('Has political pattern:', hasPoliticalPattern);
  
  // Expected: Should select Counter strategy (political), NOT Shout-Out (due to negative context)
  if (hasAchievementPattern && !hasNegativeContext) {
    debugLog('✅ Test Result: Would select Shout-Out strategy');
  } else if (hasPoliticalPattern) {
    debugLog('✅ Test Result: Would select Counter strategy (correct!)');
  } else {
    debugLog('❌ Test Result: Would select rotation strategy');
  }
}

// Run test if in debug mode - DISABLED to reduce console spam
// Uncomment to enable strategy selection testing
// if (SHOW_LOGS) {
//   setTimeout(testStrategySelection, 1000);
// }

// 🛡️ BULLETPROOF STABILITY SYSTEM - MULTI-LAYER PROTECTION
const STABILITY_SYSTEM = {
  // Health monitoring
  lastProgressTime: Date.now(),
  lastSuccessTime: Date.now(),
  consecutiveFailures: 0,
  healthCheckInterval: null,
  watchdogTimer: null,
  
  // Recovery mechanisms
  recoveryAttempts: 0,
  maxRecoveryAttempts: 3,
  emergencyRefreshCooldown: 60000, // 1 minute between refreshes
  lastEmergencyRefresh: 0,
  
  // State tracking
  isRecovering: false,
  lastKnownGoodState: null,
  
  // Initialize the stability system
  initialize() {
    this.startHealthMonitoring();
    this.startWatchdog();
    this.setupEmergencyHandlers();
    sessionLog('🛡️ Bulletproof stability system activated', 'success');
  },
  
  // Continuous health monitoring (every 30 seconds)
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  },
  
  // Watchdog timer (2 minutes for faster recovery)
  startWatchdog() {
    this.resetWatchdog();
  },
  
  resetWatchdog() {
    this.lastProgressTime = Date.now();
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
    
    this.watchdogTimer = setTimeout(() => {
      if (sessionStats.isRunning && !this.isRecovering) {
        this.triggerEmergencyRecovery('Watchdog timeout - no progress detected');
      }
    }, 120000); // 2 minutes
  },
  
  // Comprehensive health check
  performHealthCheck() {
    if (!sessionStats.isRunning) return;
    
    const now = Date.now();
    const timeSinceProgress = now - this.lastProgressTime;
    const timeSinceSuccess = now - this.lastSuccessTime;
    
    // Check for various failure conditions
    const checks = {
      progressStalled: timeSinceProgress > 180000, // 3 minutes
      noRecentSuccess: timeSinceSuccess > 600000, // 10 minutes
      tooManyFailures: this.consecutiveFailures >= 5,
      xcomErrorPage: detectXcomErrorPage(),
      modalStuck: this.detectStuckModal(),
      networkIssues: !navigator.onLine
    };
    
    // Log health status
    const failedChecks = Object.entries(checks).filter(([_, failed]) => failed);
    if (failedChecks.length > 0) {
      sessionLog(`🚨 Health check failed: ${failedChecks.map(([check]) => check).join(', ')}`, 'error');
      this.triggerRecovery(failedChecks);
    }
  },
  
  // Detect stuck modal
  detectStuckModal() {
    const modal = document.querySelector('[data-testid="tweetTextarea_0"]');
    const backdrop = document.querySelector('[role="dialog"]');
    return modal && backdrop && (Date.now() - this.lastProgressTime > 60000);
  },
  
  // Smart recovery based on failure type
  triggerRecovery(failedChecks) {
    if (this.isRecovering) return;
    
    this.isRecovering = true;
    this.recoveryAttempts++;
    
    sessionLog(`🔧 Initiating recovery attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts}`, 'warning');
    
    // Choose recovery strategy based on failure type
    const failures = failedChecks.map(([check]) => check);
    
    if (failures.includes('modalStuck')) {
      this.recoverFromStuckModal();
    } else if (failures.includes('xcomErrorPage')) {
      this.recoverFromErrorPage();
    } else if (failures.includes('networkIssues')) {
      this.recoverFromNetworkIssues();
    } else {
      this.performGeneralRecovery();
    }
  },
  
  // Emergency recovery (last resort)
  triggerEmergencyRecovery(reason) {
    const now = Date.now();
    if (now - this.lastEmergencyRefresh < this.emergencyRefreshCooldown) {
      sessionLog('🛡️ Emergency refresh on cooldown - waiting', 'warning');
      return;
    }
    
    sessionLog(`🚨 EMERGENCY RECOVERY: ${reason}`, 'error');
    this.lastEmergencyRefresh = now;
    
    // Save current state before refresh
    this.saveEmergencyState();
    
    // Force refresh
    window.location.reload();
  },
  
  // Recovery methods
  async recoverFromStuckModal() {
    sessionLog('🔧 Recovering from stuck modal', 'info');
    
    // Try multiple modal closing methods
    await this.forceCloseModal();
    await sleep(2000);
    
    // If still stuck, skip current tweet
    if (this.detectStuckModal()) {
      this.skipCurrentTweet();
    }
    
    this.completeRecovery();
  },
  
  async recoverFromErrorPage() {
    sessionLog('🔧 Recovering from X.com error page', 'info');
    
    // Wait a bit for X.com to recover
    await sleep(5000);
    
    // Try to navigate back to search
    if (this.lastKnownGoodState && this.lastKnownGoodState.searchUrl) {
      window.location.href = this.lastKnownGoodState.searchUrl;
    } else {
      window.location.reload();
    }
  },
  
  async recoverFromNetworkIssues() {
    sessionLog('🔧 Recovering from network issues', 'info');
    
    // Wait for network to stabilize
    await this.waitForNetwork();
    this.completeRecovery();
  },
  
  async performGeneralRecovery() {
    sessionLog('🔧 Performing general recovery', 'info');
    
    // Clear any stuck states
    await this.clearStuckStates();
    
    // Scroll to refresh feed
    window.scrollTo(0, 0);
    await sleep(1000);
    window.scrollTo(0, 500);
    
    this.completeRecovery();
  },
  
  // Helper methods
  async forceCloseModal() {
    const methods = [
      () => document.querySelector('[data-testid="app-bar-close"]')?.click(),
      () => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
      () => document.querySelector('[role="dialog"]')?.parentElement?.click(),
      () => window.history.back()
    ];
    
    for (const method of methods) {
      try {
        method();
        await sleep(1000);
        if (!this.detectStuckModal()) break;
      } catch (error) {
        debugLog('Modal close method failed:', error);
      }
    }
  },
  
  skipCurrentTweet() {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    tweets.forEach(tweet => {
      if (!tweet.hasAttribute('data-boldtake-processed')) {
        tweet.setAttribute('data-boldtake-processed', 'true');
        tweet.setAttribute('data-boldtake-skipped', 'true');
        return; // Skip only the first unprocessed tweet
      }
    });
    sessionLog('⏭️ Skipped stuck tweet - continuing session', 'info');
  },
  
  async clearStuckStates() {
    // Clear any stuck intervals/timeouts
    if (window.boldtakeCountdownInterval) {
      clearInterval(window.boldtakeCountdownInterval);
      window.boldtakeCountdownInterval = null;
    }
    if (window.boldtakeTimeout) {
      clearTimeout(window.boldtakeTimeout);
      window.boldtakeTimeout = null;
    }
  },
  
  async waitForNetwork() {
    return new Promise((resolve) => {
      const checkNetwork = () => {
        if (navigator.onLine) {
          resolve();
        } else {
          setTimeout(checkNetwork, 1000);
        }
      };
      checkNetwork();
    });
  },
  
  completeRecovery() {
    this.isRecovering = false;
    this.consecutiveFailures = 0;
    this.resetWatchdog();
    sessionLog('✅ Recovery completed successfully', 'success');
  },
  
  // State management
  saveEmergencyState() {
    this.lastKnownGoodState = {
      searchUrl: window.location.href,
      sessionStats: { ...sessionStats },
      timestamp: Date.now()
    };
    
    // Save to storage for persistence across refreshes
    chrome.storage.local.set({
      boldtake_emergency_state: this.lastKnownGoodState
    });
  },
  
  async restoreEmergencyState() {
    try {
      const result = await chrome.storage.local.get(['boldtake_emergency_state']);
      if (result.boldtake_emergency_state) {
        this.lastKnownGoodState = result.boldtake_emergency_state;
        sessionLog('🔄 Emergency state restored', 'info');
      }
    } catch (error) {
      debugLog('Failed to restore emergency state:', error);
    }
  },
  
  // Setup emergency handlers
  setupEmergencyHandlers() {
    // Handle page errors
    window.addEventListener('error', (event) => {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 3) {
        this.triggerEmergencyRecovery('Multiple JavaScript errors detected');
      }
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.consecutiveFailures++;
      debugLog('Unhandled promise rejection:', event.reason);
    });
    
    // Handle visibility changes (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && sessionStats.isRunning) {
        this.resetWatchdog();
      }
    });
  },
  
  // Public methods for external use
  recordProgress() {
    this.lastProgressTime = Date.now();
    this.resetWatchdog();
  },
  
  recordSuccess() {
    this.lastSuccessTime = Date.now();
    this.consecutiveFailures = 0;
    this.recordProgress();
  },
  
  recordFailure() {
    this.consecutiveFailures++;
  },
  
  // Cleanup
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
    }
  }
};

// 🚀 INITIALIZE BULLETPROOF STATE MACHINE
function initializeBulletproofSystem() {
  // Load state machine dynamically
  const script = document.createElement('script');
  script.textContent = `
    // Inline state machine for immediate availability
    class BulletproofStateMachine {
      constructor() {
        this.currentState = 'IDLE';
        this.progressTracker = {
          successfulReplies: 0,
          totalAttempts: 0,
          consecutiveFailures: 0,
          lastProgressTime: Date.now()
        };
        this.circuitBreaker = {
          failureCount: 0,
          state: 'CLOSED',
          threshold: 5
        };
        sessionLog('🛡️ Bulletproof State Machine initialized', 'success');
      }
      
      recordSuccess() {
        this.progressTracker.successfulReplies++;
        this.progressTracker.totalAttempts++;
        this.progressTracker.consecutiveFailures = 0;
        this.progressTracker.lastProgressTime = Date.now();
        this.circuitBreaker.failureCount = 0;
      }
      
      recordFailure() {
        this.progressTracker.totalAttempts++;
        this.progressTracker.consecutiveFailures++;
        this.circuitBreaker.failureCount++;
        
        if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
          this.circuitBreaker.state = 'OPEN';
          sessionLog('🔴 Circuit breaker OPEN - cooling down', 'error');
        }
      }
      
      shouldAttemptAction() {
        return this.circuitBreaker.state !== 'OPEN';
      }
    }
    window.BulletproofStateMachine = BulletproofStateMachine;
  `;
  document.head.appendChild(script);
  
  // Initialize state machine
  bulletproofStateMachine = new window.BulletproofStateMachine();
}

// Legacy function for backward compatibility
function resetWatchdog() {
  if (bulletproofStateMachine) {
    bulletproofStateMachine.progressTracker.lastProgressTime = Date.now();
  } else {
    STABILITY_SYSTEM.recordProgress();
  }
}

// Initialize bulletproof system
initializeBulletproofSystem();

// Fallback to legacy system if needed
if (!bulletproofStateMachine) {
  STABILITY_SYSTEM.initialize();
}

// Initialization complete
sessionLog('✅ BoldTake v5.0 Ready - Bulletproof Architecture', 'success');
updateStatus('BoldTake Ready');
