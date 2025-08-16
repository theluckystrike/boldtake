/**
 * BoldTake - Professional X.com Automation
 * Intelligent AI-powered engagement system
 */

// Stealth mode - minimal logging
const DEBUG_MODE = false; // Set to true for debugging
const debugLog = DEBUG_MODE ? console.log : () => {};

// Activity tracking for live feed
let recentActivities = [];

// ADVANCED STEALTH & SECURITY SYSTEM - Undetectable Automation
const SECURITY_CONFIG = {
  // Rate limiting (actions per hour/day) - Conservative for stealth
  MAX_COMMENTS_PER_HOUR: 12, // Reduced for better stealth
  MAX_COMMENTS_PER_DAY: 80,  // Human-realistic daily limit
  
  // Timing constraints (milliseconds) - Optimized for user experience
  MIN_DELAY_BETWEEN_ACTIONS: 30000,  // 30 seconds minimum (user-friendly)
  MAX_DELAY_BETWEEN_ACTIONS: 300000, // 5 minutes maximum (much better UX)
  
  // Advanced behavioral patterns to mimic human behavior
  HUMAN_VARIANCE_FACTOR: 0.5, // 50% random variance (more natural)
  BREAK_PROBABILITY: 0.15,     // 15% chance of longer breaks (reduced)
  LONG_BREAK_DURATION: 600000, // 10 minute break (reasonable break)
  MICRO_BREAK_PROBABILITY: 0.2, // 20% chance of micro-breaks (reduced)
  MICRO_BREAK_DURATION: 120000,  // 2 minute micro-breaks
  
  // Content safety filters
  MAX_SIMILAR_RESPONSES: 2, // Stricter similarity check
  MIN_RESPONSE_LENGTH: 15,  // Longer minimum for quality
  MAX_RESPONSE_LENGTH: 260, // Leave room for variations
  
  // Account health thresholds
  CRITICAL_ERROR_THRESHOLD: 3, // More sensitive
  SUSPICIOUS_ACTIVITY_THRESHOLD: 5,
  
  // Emergency stop conditions
  MAX_FAILED_ATTEMPTS_IN_ROW: 2, // Stricter failure tolerance
  COOLDOWN_AFTER_ERRORS: 3600000, // 1 hour cooldown
  
  // STEALTH-SPECIFIC SETTINGS
  READING_TIME_MIN: 3000,   // Minimum time to "read" a tweet
  READING_TIME_MAX: 15000,  // Maximum reading time
  TYPING_SPEED_MIN: 50,     // Minimum ms per character (human typing)
  TYPING_SPEED_MAX: 200,    // Maximum ms per character
  SCROLL_PROBABILITY: 0.3,  // 30% chance to scroll before action
  IDLE_TIME_MIN: 5000,      // Minimum idle time between actions
  IDLE_TIME_MAX: 30000      // Maximum idle time
};

// Security state tracking
let securityState = {
  actionsThisHour: 0,
  actionsToday: 0,
  lastActionTime: 0,
  recentResponses: [],
  errorCount: 0,
  suspiciousActivity: 0,
  isInSafeMode: false,
  consecutiveFailures: 0,
  lastHourReset: Date.now(),
  lastDayReset: new Date().toDateString(),
  lastErrorTime: 0
};

// SECURITY FUNCTIONS - Account Protection

/**
 * Check if action is safe to perform based on rate limits and patterns
 * @returns {Promise<{safe: boolean, reason?: string, waitTime?: number}>}
 */
async function checkActionSafety() {
  const now = Date.now();
  const currentHour = Math.floor(now / 3600000);
  const currentDay = new Date().toDateString();
  
  // Reset counters if needed
  if (Math.floor(securityState.lastHourReset / 3600000) !== currentHour) {
    securityState.actionsThisHour = 0;
    securityState.lastHourReset = now;
  }
  
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
  
  // Check rate limits
  if (securityState.actionsThisHour >= SECURITY_CONFIG.MAX_COMMENTS_PER_HOUR) {
    const waitTime = 3600000 - (now - securityState.lastHourReset);
    // STABILITY: Cap hourly wait time to maximum 10 minutes for better UX
    const cappedWaitTime = Math.min(waitTime, 600000); // Max 10 minutes
    return {
      safe: false,
      reason: 'Hourly rate limit reached',
      waitTime: cappedWaitTime
    };
  }
  
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
 * Calculate advanced stealth delay with realistic human patterns
 * @returns {number} Delay in milliseconds
 */
function calculateSmartDelay() {
  const baseDelay = SECURITY_CONFIG.MIN_DELAY_BETWEEN_ACTIONS;
  const maxDelay = SECURITY_CONFIG.MAX_DELAY_BETWEEN_ACTIONS;
  
  // Multiple layers of randomization for maximum stealth
  const variance = 1 + (Math.random() - 0.5) * SECURITY_CONFIG.HUMAN_VARIANCE_FACTOR;
  let delay = baseDelay * variance;
  
  // Micro-breaks (checking phone, sip coffee, etc.)
  if (Math.random() < SECURITY_CONFIG.MICRO_BREAK_PROBABILITY) {
    delay = Math.max(delay, SECURITY_CONFIG.MICRO_BREAK_DURATION);
    addDetailedActivity('☕ Taking a micro-break (checking phone)', 'info');
  }
  
  // Longer breaks (lunch, meeting, bathroom, etc.)
  if (Math.random() < SECURITY_CONFIG.BREAK_PROBABILITY) {
    delay = Math.max(delay, SECURITY_CONFIG.LONG_BREAK_DURATION);
    addDetailedActivity('🍽️ Taking a longer break (human routine)', 'info');
  }
  
  // Time-of-day adjustments (humans are less active late at night)
  const hour = new Date().getHours();
  if (hour >= 23 || hour <= 6) {
    delay *= 1.5; // 50% longer delays during night hours
  }
  
  // Weekend adjustments (different patterns on weekends)
  const isWeekend = [0, 6].includes(new Date().getDay());
  if (isWeekend) {
    delay *= 1.2; // 20% longer delays on weekends
  }
  
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
  
  // Obfuscate console logs in production
  if (!DEBUG_MODE) {
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
  
  securityState.actionsThisHour++;
  securityState.actionsToday++;
  securityState.lastActionTime = now;
  securityState.consecutiveFailures = 0;
  
  // Store recent response for similarity checking
  securityState.recentResponses.push(response);
  if (securityState.recentResponses.length > SECURITY_CONFIG.MAX_SIMILAR_RESPONSES) {
    securityState.recentResponses.shift();
  }
  
  addDetailedActivity(`✅ Action recorded safely (${securityState.actionsThisHour}/h, ${securityState.actionsToday}/day)`, 'success');
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
  
  addDetailedActivity(`❌ Action failed: ${reason} (${securityState.consecutiveFailures} consecutive)`, 'error');
  
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

debugLog('🚀 BoldTake Professional loading...');

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
  
  // Check if this is a new session launched from the popup
  const { isNewSession } = await chrome.storage.local.get('isNewSession');

  if (isNewSession) {
    // It's a new session, so clear the flag and auto-start.
    await chrome.storage.local.remove('isNewSession');
    console.log('🚀 Auto-starting new session from popup...');
    startContinuousSession(); // Start a fresh session
  } else if (sessionStats.isRunning) {
    // It's not a new session, but one was running, so resume it.
    console.log('🔄 Resuming active session...');
    showStatus(`🔄 Resuming active session: ${sessionStats.successful}/${sessionStats.target} tweets`);
    startContinuousSession(true); // Start without resetting stats
  }
})();

// --- Message Handling ---

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('📨 Received message:', message.type);
  
  if (message.type === 'BOLDTAKE_START') {
    console.log('🎯 Starting BoldTake continuous session...');
    startContinuousSession();
    sendResponse({success: true, message: 'BoldTake session started'});
  } else if (message.type === 'BOLDTAKE_STOP') {
    console.log('🛑 Force stopping BoldTake session...');
    
    // Force stop everything immediately
    sessionStats.isRunning = false;
    
    // Clear any running countdown timers
    if (window.boldtakeCountdownInterval) {
      clearInterval(window.boldtakeCountdownInterval);
      window.boldtakeCountdownInterval = null;
    }
    
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
    sendResponse({
      stats: {
        ...sessionStats,
        lastAction: sessionStats.lastAction || null,
        recentActivities: recentActivities || []
      }
    });
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
 * - Maximum 12 comments per hour, 80 per day
 * - Random delays between 30 seconds - 5 minutes (user-friendly)
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
    console.log('🎬 === BoldTake Session Started ===');
    
    // Initialize comprehensive session statistics
    sessionStats = {
      processed: 0,               // Total tweets processed this session
      successful: 0,              // Successfully replied tweets
      failed: 0,                  // Failed processing attempts
      consecutiveApiFailures: 0,  // Circuit breaker for API issues
      lastApiError: null,         // Last API error for debugging
      target: 120,                // Target tweets to process (optimized for account safety)
      startTime: new Date().getTime(), // Session start timestamp
      isRunning: true,            // Active session flag
      criticalErrors: 0,          // Critical error counter
      retryAttempts: 0,           // Retry attempt tracking
      lastSuccessfulTweet: null   // Last successful tweet timestamp
    };
    
    // Reset strategy rotation for new sessions
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
    console.log('🔄 Strategy rotation reset for new session');
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
        console.log('🛑 Session stopped during main loop');
        break;
      }
      
      // CORE PROCESSING: Find and process the next suitable tweet
      // This includes: tweet selection, AI generation, posting, and liking
      await processNextTweet();
      
      // SAFETY CHECKPOINT 2: Check session status after processing
      if (!sessionStats.isRunning) {
        console.log('🛑 Session stopped after tweet processing');
        break;
      }
      
      // KEYWORD ROTATION: Check if we need to rotate keywords
      const rotated = await checkKeywordRotation();
      if (rotated) {
        console.log('🔄 Keyword rotation triggered - page will refresh');
        return; // Exit function as page will refresh
      }
      
      // INTELLIGENT DELAY SYSTEM - Mimics human behavior patterns
      if (sessionStats.isRunning && sessionStats.processed < sessionStats.target) {
        
        // SECURITY LAYER 1: Advanced safety checks before next action
        // Validates rate limits, account health, and timing constraints
        const safetyCheck = await checkActionSafety();
        if (!safetyCheck.safe) {
          const waitMinutes = Math.ceil(safetyCheck.waitTime / 60000);
          addDetailedActivity(`🛡️ Security hold: ${safetyCheck.reason} (${waitMinutes}m wait)`, 'warning');
          updateCornerWidget(`🛡️ Security hold: ${waitMinutes}m remaining`);
          
          // ENFORCED SAFETY PAUSE: Wait for required safety period
          await new Promise(resolve => setTimeout(resolve, safetyCheck.waitTime));
          continue; // Restart loop after safety compliance
        }
        
        // HUMAN BEHAVIOR SIMULATION: Calculate realistic delay
        // Factors: time of day, weekends, micro-breaks, long breaks
        const delay = calculateSmartDelay();
        const minutes = Math.floor(delay / 60000);
        const seconds = Math.floor((delay % 60000) / 1000);
        
        console.log(`⏰ Waiting ${minutes}m ${seconds}s before next tweet...`);
        sessionStats.lastAction = `⏰ Waiting ${minutes}m ${seconds}s before next tweet`;
        
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
    console.error('💥 CRITICAL ERROR! Attempting graceful recovery...', error);
    sessionStats.criticalErrors = (sessionStats.criticalErrors || 0) + 1;
    
    // Implement graduated recovery strategy
    if (sessionStats.criticalErrors <= 2) {
      showStatus(`💥 Critical error #${sessionStats.criticalErrors}! Attempting recovery in 10s...`);
      await sleep(10000);
      
      // Try to gracefully recover
      try {
        await gracefullyCloseModal();
        window.scrollTo(0, 0); // Reset scroll position
        await sleep(2000);
        console.log('🔄 Attempting to continue session after recovery...');
        // Continue the loop
      } catch (recoveryError) {
        console.error('❌ Recovery failed:', recoveryError);
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
async function processNextTweet() {
  updateStatus(`🔍 Processing tweet ${sessionStats.processed + 1}/${sessionStats.target}...`);
  debugLog(`\n🎯 === Tweet ${sessionStats.processed + 1}/${sessionStats.target} ===`);

  let tweet;
  let attempt = 0;
  const maxAttempts = 3;

  // Retry loop to find a suitable tweet
  while (attempt < maxAttempts) {
    tweet = findTweet();
    if (tweet) break; // Found a tweet, exit the loop
    
    attempt++;
    console.log(`🚫 Attempt ${attempt}/${maxAttempts}: No suitable tweets found. Scrolling...`);
    window.scrollTo(0, document.body.scrollHeight);
    
    console.log('⏳ Waiting 3 seconds for new tweets to load...');
    await sleep(3000); // Wait for content to load
  }

  if (!tweet) {
    showStatus(`🏁 No new tweets found after ${maxAttempts} attempts. Pausing session.`);
    console.log(`🏁 No new tweets found after ${maxAttempts} attempts. Session paused.`);
    sessionStats.isRunning = false;
    chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
    return false; // Indicate session pause
  }

  // STEALTH MODE: Simulate human reading behavior
  const tweetText = tweet.querySelector('[data-testid="tweetText"]')?.textContent || '';
  await simulateReadingTime(tweetText);
  
  // STEALTH MODE: Random scrolling behavior
  await simulateHumanScrolling();
  
  // STEALTH MODE: Random idle time (human thinking/pausing)
  await simulateIdleTime();

  // Mark the tweet as processed so we don't select it again
  tweet.setAttribute('data-boldtake-processed', 'true');

  const replyButton = tweet.querySelector('[data-testid="reply"]');
  if (!replyButton) {
    updateStatus(`❌ Reply button not found on tweet.`);
    sessionStats.failed++;
    sessionStats.processed++;
    await saveSession();
    return false;
  }
  
  console.log('🖱️ Clicking reply button to open modal...');
  addDetailedActivity('🖱️ Clicking reply button to open modal', 'info');
  
  // STEALTH MODE: Add slight click coordinate variance
  const clickVariance = securityState.clickVariance || { x: 0, y: 0 };
  const rect = replyButton.getBoundingClientRect();
  const clickEvent = new MouseEvent('click', {
    clientX: rect.left + rect.width/2 + clickVariance.x,
    clientY: rect.top + rect.height/2 + clickVariance.y,
    bubbles: true
  });
  replyButton.dispatchEvent(clickEvent);
  
  await sleep(randomDelay(2000, 4000)); // Slightly longer delay for realism

  // --- Reply Modal Scope ---
  const success = await handleReplyModal(tweet);
  
  sessionStats.processed++;

  if (success) {
    sessionStats.successful++;
    sessionStats.lastSuccessfulTweet = new Date().getTime();
    sessionStats.retryAttempts = 0; // Reset retry counter on success
    updateStatus(`✅ Tweet ${sessionStats.processed}/${sessionStats.target} replied!`);
    
    // ANALYTICS: Update persistent analytics data
    await updateAnalyticsData();
    
    await likeTweet(tweet); // Like the tweet after successful reply
  } else {
    sessionStats.failed++;
    sessionStats.retryAttempts++;
    updateStatus(`❌ Failed to process reply for tweet ${sessionStats.processed} (Attempt ${sessionStats.retryAttempts}).`);
    
    // If we've failed too many times in a row, add extra delay
    if (sessionStats.retryAttempts >= 3) {
      console.log('⚠️ Multiple consecutive failures detected. Adding extra delay...');
      await sleep(5000); // Extra 5 second delay after 3 failures
    }
  }
  
  await saveSession();
  return true; // Indicate a tweet was processed
}

/**
 * Finds the reply text area using multiple, robust selectors with retries.
 * @returns {Promise<HTMLElement|null>} The found text area element or null.
 */
async function findReplyTextArea() {
  console.log('🔍 Actively searching for reply text area...');
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
      console.log(`✅ Found text area with cached selector: ${cachedSelector}`);
  addDetailedActivity('✅ Found text area with cached selector', 'success');
      return textarea;
    } else {
      // Clear invalid cache
      sessionStorage.removeItem('boldtake_textarea_selector');
    }
  }
  
  for (let i = 0; i < 20; i++) { // Extended to 10 seconds for better reliability
    for (const selector of selectors) {
      const textarea = document.querySelector(selector);
      // Enhanced visibility check with better detection
      if (textarea && 
          textarea.offsetParent !== null && 
          textarea.getBoundingClientRect().width > 0 &&
          textarea.getBoundingClientRect().height > 0 &&
          !textarea.disabled &&
          getComputedStyle(textarea).display !== 'none') {
        console.log(`✅ Found text area with selector: ${selector}`);
        addDetailedActivity('✅ Found text area with selector', 'success');
        // Cache successful selector for performance
        sessionStorage.setItem('boldtake_textarea_selector', selector);
        return textarea;
      }
    }
    
    // Try to click anywhere to trigger modal focus
    if (i === 5) {
      try {
        const modal = document.querySelector('[data-testid="tweetTextarea_0"]')?.closest('[role="dialog"]');
        if (modal) {
          modal.click();
          await sleep(500);
        }
      } catch (e) {
        // Ignore click errors
      }
    }
    
    await sleep(500); // Wait 500ms before next try
  }
  
  console.error('❌ Could not find a visible tweet text area after 10 seconds.');
  return null;
}

/**
 * Safely closes the reply modal using multiple methods.
 */
async function gracefullyCloseModal() {
  console.log('Attempting to gracefully close reply modal...');
  const closeButton = document.querySelector('[data-testid="app-bar-close"]');
  if (closeButton) {
    closeButton.click();
    await sleep(1000);
    return;
  }
  // Fallback to sending an Escape key press
  document.body.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    which: 27,
    bubbles: true,
    cancelable: true
  }));
  await sleep(1000);
}

async function handleReplyModal(originalTweet) {
  console.log('🎯 Handling Reply Modal...');
  addDetailedActivity('🎯 Handling Reply Modal', 'info');

  // Step 1: Find the reply text box using our new robust function
  const editable = await findReplyTextArea();
  if (!editable) {
    console.error('❌ Could not find tweet text area. Attempting to close modal...');
    await gracefullyCloseModal();
    return false;
  }

  // Step 2: Generate the smart reply
  const tweetText = originalTweet.textContent || '';
  const replyText = await generateSmartReply(tweetText, sessionStats.processed);
  
  if (!replyText) {
    console.error('❌ Skipping tweet due to critical AI failure.');
    await gracefullyCloseModal();
    return false;
  }

  console.log('⌨️ Typing reply:', replyText);
  addDetailedActivity(`⌨️ Typing reply: ${replyText.substring(0, 50)}...`, 'info');

  // Step 3: Type using the "bulletproof" method
  const typed = await safeTypeText(editable, replyText);
  if (!typed) {
    console.error('❌ Typing failed inside reply modal.');
    await gracefullyCloseModal();
    return false;
  }
  
  await sleep(1000); // Small pause after typing

  // Step 4: Send the reply using keyboard shortcut
  const sent = await sendReplyWithKeyboard();

  if (sent) {
    // Step 5: Confirm the modal has closed
    const closed = await waitForModalToClose();
    if (closed) {
      console.log('✅ Reply modal closed successfully.');
      sessionStats.lastAction = '✅ Reply modal closed successfully';
      return true;
    } else {
      console.error('❌ Reply modal did not close after sending.');
      return false;
    }
  } else {
    console.error('❌ Sending reply failed.');
    await gracefullyCloseModal();
    return false;
  }
}

async function sendReplyWithKeyboard() {
  console.log('🚀 Sending reply with Ctrl/Cmd+Enter...');
  const editable = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (!editable) {
    console.error('❌ Cannot find text area to send from.');
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
    console.error('❌ Keyboard shortcut failed:', error);
    return false;
  }
}

async function waitForModalToClose() {
  console.log('⏳ Waiting for reply modal to disappear...');
  for (let i = 0; i < 50; i++) { // Max wait 5 seconds
    if (!document.querySelector('[data-testid="tweetTextarea_0"]')) {
      return true; // It's gone!
    }
    await sleep(100);
  }
  return false; // Timed out
}

function findTweet() {
  // Multiple selectors for better tweet detection
  const selectors = [
    '[data-testid="tweet"]:not([data-boldtake-processed="true"])',
    'article[data-testid="tweet"]:not([data-boldtake-processed="true"])',
    '[role="article"]:not([data-boldtake-processed="true"])'
  ];
  
  let tweets = [];
  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      tweets = Array.from(found);
      console.log(`📊 Found ${tweets.length} unprocessed tweets using selector: ${selector}`);
    addDetailedActivity(`📊 Found ${tweets.length} unprocessed tweets`, 'info');
      break;
    }
  }
  
  if (tweets.length === 0) {
    console.log('📊 No tweets found with any selector');
    return null;
  }
  
  // Filter out spam, inappropriate content, and already liked tweets
  for (let tweet of tweets) {
    const tweetText = (tweet.textContent || '').toLowerCase();
    
    // Check if tweet is already liked (means we already replied to it)
    const unlikeButton = tweet.querySelector('[data-testid="unlike"]');
    if (unlikeButton) {
      console.log('💚 Skipping already liked tweet (already replied)');
      tweet.setAttribute('data-boldtake-processed', 'true');
      continue;
    }
    
    // Check for insufficient content (single word or too short tweets)
    const cleanText = tweetText.replace(/[^\w\s]/g, '').trim(); // Remove special chars, emojis, hashtags
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length <= 1 || cleanText.length < 15) {
      console.log('🚫 Skipping tweet: insufficient content (single word or too short)');
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
      console.log('✅ Found clean, unliked tweet to process');
      addDetailedActivity('✅ Found clean, unliked tweet to process', 'success');
      return tweet;
    } else {
      console.log('🚫 Skipping spam/inappropriate tweet');
      // Mark as processed so we don't check it again
      tweet.setAttribute('data-boldtake-processed', 'true');
    }
  }
  
  console.log('❌ No clean, unliked tweets found');
  return null;
}

async function likeTweet(tweet) {
  const likeButton = tweet.querySelector('[data-testid="like"]');
  if (likeButton) {
    console.log('🎯 Liking the tweet...');
  sessionStats.lastAction = '🎯 Liking the tweet';
    likeButton.click();
    await sleep(500);
    return true;
  }
  console.warn('🎯 Like button not found.');
  return false;
}

async function safeTypeText(el, str) {
  console.log('🛡️ Starting BULLETPROOF typing process...');
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
      console.log('✅ Text verification successful.');
      addDetailedActivity('✅ Text verification successful', 'success');
      return true;
    } else {
      console.warn('⚠️ Text verification failed. Using fallback.');
      el.textContent = str;
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      return true;
    }
  } catch (error) {
    console.error('❌ BULLETPROOF typing error:', error);
    return false;
  }
}

function showStatus(message) {
  // Only log status in debug mode to reduce console spam
  debugLog(`[STATUS] ${message}`);
  updateCornerWidget(message);
}

function updateStatus(message) {
  // Only log status in debug mode to reduce console spam
  debugLog(`[STATUS] ${message}`);
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
  
  // 1. Show "next tweet in X min" timing
  const timeMatch = cleanMessage.match(/(\d+m \d+s)/);
  if (timeMatch && cleanMessage.includes('Waiting')) {
    displayText = `next tweet in ${timeMatch[1]}`;
    shouldShow = true;
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
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px;">${headerText}</div>
    <div style="opacity: 0.8; font-size: 12px; margin-bottom: 12px;">${subHeader}</div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">${statusIcon}</span>
      <span>${message}</span>
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

            // Only update status every 10 seconds to reduce spam
            if (seconds % 10 === 0 || seconds < 10) {
            showStatus(`⏳ Next tweet in ${minutes}:${paddedSeconds}... (${sessionStats.successful}/${sessionStats.target} completed)`);
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
    console.error(`💥 CIRCUIT BREAKER TRIPPED! 💥 Final Error: ${finalError}`);
    showStatus(`CRITICAL: ${finalError}. Session Stopped.`);
    sessionStats.isRunning = false;
    chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
    return null; // Stop processing immediately
  }

  // Get personalization settings for language and tone
  const personalization = await getPersonalizationSettings();

  const selectedPrompt = await selectBestPrompt(tweetText);
  debugLog(`🎯 AI Strategy Selected: ${selectedPrompt.name}`);
  addDetailedActivity(`🔄 Using ${selectedPrompt.name} strategy`, 'info');
  
  // Update status to show current strategy with personalization
  const langDisplay = personalization.language !== 'english' ? ` (${personalization.language})` : '';
  showStatus(`🎯 Tweet ${sessionStats.processed + 1}/${sessionStats.target} - ${selectedPrompt.name}${langDisplay}`);

  // Build enhanced prompt with language and tone
  const enhancedPrompt = buildEnhancedPrompt(selectedPrompt.template, tweetText, personalization);

  // First Attempt with enhanced prompt
  let reply = await attemptGeneration(enhancedPrompt, tweetText);

  // --- Quality & Cleanup Guard ---
  
  // 1. Post-processing: Clean up common AI artifacts like em-dashes
  if (reply) {
    reply = reply.replace(/—/g, '-');
  }

  // 2. SECURITY CHECK: Validate content safety before posting
  if (reply && !isContentSafe(reply)) {
    addDetailedActivity('🚫 Reply blocked by security filters', 'warning');
    const emergencyStop = recordFailedAction('Content safety violation');
    if (emergencyStop) {
      sessionStats.isRunning = false;
      showStatus('🚨 EMERGENCY STOP: Multiple security violations');
      return null;
    }
    reply = null; // Block unsafe content
  }

  // 3. Quality Check: See if the reply is low-quality
  const isLowQuality = !reply || isReplyGeneric(reply) || reply.length < 25;

  if (isLowQuality) {
    sessionStats.consecutiveApiFailures++;
    const currentError = sessionStats.lastApiError || 'Reply failed quality standards.';
    console.warn(`API Failure ${sessionStats.consecutiveApiFailures}/3: ${currentError}`);
    
    // Retry logic...
    if (tweetNumber <= 5) { // Only retry for the first 5 tweets
      const retryPrompt = selectedPrompt.template + "\n\nIMPORTANT: Your previous attempt was too generic. Be more specific and insightful.";
      reply = await attemptGeneration(retryPrompt, tweetText);
      if (reply) reply = reply.replace(/—/g, '-');

      // If retry is still bad, it counts as a failure for the circuit breaker
      if (!reply || isReplyGeneric(reply) || reply.length < 25) {
        console.error('❌ AI generation failed quality check after retry.');
        reply = null; // Important: ensure reply is null to trigger fallback
      } else {
        console.log('✅ AI reply passed quality check on retry.');
        sessionStats.consecutiveApiFailures = 0; // Success resets the counter
        sessionStats.lastApiError = null;
      }
    }
  } else {
    console.log('✅ AI reply passed quality check.');
  addDetailedActivity('✅ AI reply passed quality check', 'success');
    sessionStats.consecutiveApiFailures = 0; // Success resets the counter
    sessionStats.lastApiError = null;
  }

  // Final fallback uses the new dynamic pool
  if (!reply) {
    console.log('Using safe fallback reply pool.');
    return SAFE_FALLBACK_REPLIES[Math.floor(Math.random() * SAFE_FALLBACK_REPLIES.length)];
  }

  return reply;
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
 * @returns {Promise<string|null>} The cleaned reply text or null if failed.
 */
async function attemptGeneration(promptTemplate, tweetText) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_REPLY',
      prompt: promptTemplate.replace('{TWEET}', tweetText.slice(0, 1500)), // Increased context length
    });

    if (response.error) {
      console.error(`Error from background script: ${response.error}`);
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
      
      // Final length check
      if (cleanReply.length > 280) {
        cleanReply = cleanReply.slice(0, 277) + '...';
      }
      return cleanReply;
    }
    return null;
  } catch (error) {
    console.error('💥 AI generation attempt failed:', error.message);
    sessionStats.lastApiError = `Content Script Error: ${error.message}`;
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

  // PRIORITY 1: Strong content matches (override rotation for perfect fits)
  if (politicalPatterns.some(pattern => lowerText.includes(pattern))) {
    selectedPrompt = provenPrompts.find(p => p.name === "Engagement The Counter");
    console.log('🎯 Strong content match: Using Counter strategy for political content');
  } else if (viralHookPatterns.some(pattern => lowerText.includes(pattern))) {
    selectedPrompt = provenPrompts.find(p => p.name === "The Viral Shot");
    console.log('🎯 Strong content match: Using Viral Shot strategy');
  } else if (challengePatterns.some(pattern => lowerText.includes(pattern))) {
    selectedPrompt = provenPrompts.find(p => p.name === "Engagement The Counter");
    console.log('🎯 Strong content match: Using Counter strategy');
  } else if (questionPatterns.some(pattern => lowerText.includes(pattern))) {
    selectedPrompt = provenPrompts.find(p => p.name === "Engagement Indie Voice");
    console.log('🎯 Strong content match: Using Indie Voice strategy');
  } else if (humorPatterns.some(pattern => lowerText.includes(pattern))) {
    selectedPrompt = provenPrompts.find(p => p.name === "The Riff");
    console.log('🎯 Strong content match: Using Riff strategy');
  } else if (technicalPatterns.some(pattern => lowerText.includes(pattern))) {
    selectedPrompt = provenPrompts.find(p => p.name === "Engagement Indie Voice");
    console.log('🎯 Strong content match: Using Indie Voice for technical content');
  }
  
  // Check for achievement/success patterns for Shout-Out
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
  
  if (hasAchievementPattern && !hasNegativeContext) {
    selectedPrompt = provenPrompts.find(p => p.name === "The Shout-Out");
    console.log('🎯 Strong content match: Using Shout-Out strategy');
  }

  // PRIORITY 2: Smart rotation for general content
  if (!selectedPrompt) {
    // Find the least used strategy for balanced rotation
    const usageCounts = Object.values(strategyRotation.usageCount || {});
    if (usageCounts.length === 0) {
      // Fallback if no usage data
      selectedPrompt = provenPrompts[0];
      debugLog('🔄 No usage data, using first available prompt');
    } else {
      const leastUsedCount = Math.min(...usageCounts);
      const leastUsedStrategies = provenPrompts.filter(prompt => 
        strategyRotation.usageCount[prompt.name] === leastUsedCount
      );
    
      // Avoid using the same strategy twice in a row if possible
      let availableStrategies = leastUsedStrategies;
      if (leastUsedStrategies.length > 1 && strategyRotation.lastUsedStrategy) {
        availableStrategies = leastUsedStrategies.filter(prompt => 
          prompt.name !== strategyRotation.lastUsedStrategy
        );
        if (availableStrategies.length === 0) {
          availableStrategies = leastUsedStrategies; // Fallback if all filtered out
        }
      }
      
      // Select randomly from available strategies to add some unpredictability
      if (availableStrategies.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableStrategies.length);
        selectedPrompt = availableStrategies[randomIndex];
        console.log(`🔄 Rotation selection: Using ${selectedPrompt.name} (used ${strategyRotation.usageCount[selectedPrompt.name] || 0} times)`);
      } else {
        // Ultimate fallback
        selectedPrompt = provenPrompts[0];
        debugLog('🔄 Fallback to first prompt due to empty availableStrategies');
      }
    }
  }

  // Update tracking safely
  if (selectedPrompt && selectedPrompt.name) {
    if (!strategyRotation.usageCount) {
      strategyRotation.usageCount = {};
    }
    strategyRotation.usageCount[selectedPrompt.name] = (strategyRotation.usageCount[selectedPrompt.name] || 0) + 1;
    strategyRotation.lastUsedStrategy = selectedPrompt.name;
  }

  // Log usage statistics every 5 tweets
  if (sessionStats.processed > 0 && sessionStats.processed % 5 === 0) {
    console.log('📊 Strategy Usage Stats:', strategyRotation.usageCount);
  }

  return selectedPrompt;
}

const PROVEN_PROMPTS = [
    {
        name: "Engagement Indie Voice",
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
- 150-200 characters maximum
- Pure text output only

Examples:
Tweet: "I love coffee in the morning"
GOOD: "Same here. Nothing beats that first cup. Sets the whole tone for my day."
BAD: "Coffee is life I move fast Ship code Win"

Tweet: "It's not AI guys, I know how to surf"
GOOD: "Haha nice skills! Surfing takes real balance and timing. Way more impressive than AI."
BAD: "Keep it simple I move fast Break things Fix later"

Tweet: "{TWEET}"`
    },
    {
        name: "Engagement Spark Reply",
        template: `Your first step is to randomly choose an output format. Your reply will be either a single powerful line, exactly 2 lines, or exactly 4 lines.

After you have chosen the line count, reply to the tweet below.

Your #1 goal is to spark debate. Adopt the voice of a founder who is brutally direct and provocative.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate thoughts
- 200-250 characters maximum
- Pure text output only

Bad Example (Contains forbidden punctuation):
Most founders fail—they focus on funding, not customers.

Good Example (Uses line breaks):
Most founders fail. They focus on funding. Not customers.

Final check requirements:
- Line count exactly 1, 2, or 4
- Written in first person (I)
- ZERO forbidden punctuation
- Raw, unfiltered take

Tweet: "{TWEET}"`
    },
    {
        name: "Engagement The Counter",
        template: `Your first step is to randomly choose an output format. Your reply will be either a single powerful line, exactly 2 lines, or exactly 4 lines.

After you have chosen the line count, reply to the tweet below.

Your #1 goal is to challenge the tweet's core assumption. Adopt the voice of a confident and highly opinionated founder who is presenting a strong counter-argument. Refute the original point directly.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate distinct ideas
- 200-250 characters maximum
- Pure text output only

Bad Example (Uses forbidden punctuation):
That's one way to look at it—but I think retention is also important.

Good Example (Strong with line breaks):
That's the wrong way to look at it. Growth without retention is a leaky bucket. It's a vanity metric that kills companies.

Final check requirements:
- Line count exactly 1, 2, or 4
- Directly challenges or refutes the original tweet
- Written in first person (I)
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
    },
    {
        name: "The Riff",
        template: `Act as a witty, context-aware comedian who understands internet culture. Your #1 goal is to create a funny, shareable reply that could go viral.

First, deeply analyze the original tweet's persona, tone, and any unintentional humor or flawed logic. Then, craft a reply that does one of the following:

Takes their logic and escalates it to a ridiculous, deadpan conclusion.

Acts as the perfect, unexpected punchline to their setup.

Gently pokes fun at the persona with a sarcastic but clever observation.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks (Enter) to separate ideas or for comedic timing
- 200-250 characters maximum
- Pure text output only

Bad Example (Contains forbidden punctuation):
My Roomba just ran over my last nerve—it's clean now, but at what cost?

Good Example (Uses line breaks for timing):
My Roomba just ran over my last nerve. It's clean now. But at what cost.

Final check requirements:
- Witty and context-aware
- Short and shareable
- ZERO forbidden punctuation

Tweet: "{TWEET}"`
    },
    {
        name: "The Viral Shot",
        template: `You are a master social media strategist. Your purpose is to craft a reply with the highest possible chance of going viral by extracting key information from a provided text and using it to create a personalized, strategic reply.

YOUR PROCESS:

Step 1: Scrape Information from the Provided Text.
Analyze the tweet below. From this text, you must extract the following three pieces of information:

The Author's Handle (e.g., @sarahthefounder)

The Author's First Name (If the full name is present, use the first name. If not, infer a common name from the handle).

The Core Message of the post.

Step 2: Choose a Viral Strategy.
Based on the Core Message, secretly choose the single best viral strategy from this list:

Emotional Resonance: Tap into a powerful, universal feeling (nostalgia, frustration, hope).

The Secret Unveiled: Frame your reply as a piece of hidden, high-value knowledge.

Contrarian Stronghold: Take the most extreme, opposite, and defensible position.

Relatable Absurdity: Exaggerate a common experience to a funny, relatable conclusion.

Step 3: Structure and Write the Reply.
Execute your chosen strategy. Internally, think in terms of a hook, body, and call to action, but do not write these labels in your final output.

Hook: A powerful first line that makes a bold claim.

Body: 1-3 lines delivering the core message. At some point in the body, naturally weave in the Author's First Name you extracted to make the reply feel personal.

CTA: A final line with a provocative question to drive engagement.

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- Use hard line breaks for impact and readability
- Start reply by quoting the Author's Handle you extracted
- 200-250 characters maximum
- Pure text output only

Tweet: "{TWEET}"`
    },
    {
        name: "The Shout-Out",
        template: `You are celebrating someone's genuine achievement or milestone. Your task is to write an enthusiastic congratulations reply.

ONLY respond if the tweet contains a clear personal achievement like:
- Launching a product/company
- Reaching revenue milestones  
- Getting hired/promoted
- Completing a project
- Winning an award
- Personal accomplishments

If the tweet is about politics, news, opinions, or complaints, DO NOT use this congratulatory format. Instead, write a thoughtful response that engages with their actual content.

For genuine achievements, follow this structure:
1. Congratulations + their name/handle
2. Acknowledge what they accomplished
3. Brief validation of the effort required
4. Forward-looking encouragement

CRITICAL FORMATTING RULES:
- STRICTLY NO em dashes (—), dashes (-), colons (:), or semicolons (;)
- STRICTLY NO quotes (" "), apostrophes in contractions are OK
- 200-250 characters maximum
- Pure text output only

EXAMPLE for achievement:
Congratulations Sarah
Launching your first SaaS product is such a huge milestone
The amount of work that goes into shipping something like this is incredible
Excited to see where you take it next

Tweet: "{TWEET}"`
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
  
  console.log('\n🎬 === BoldTake Session Complete ===');
  console.log(`⏰ Duration: ${timeDisplay}`);
  console.log(`🎯 Target: ${sessionStats.target} tweets`);
  console.log(`✅ Successful: ${sessionStats.successful}`);
  console.log(`❌ Failed: ${sessionStats.failed}`);
  console.log(`📊 Success Rate: ${successRate}%`);
  console.log(`⚡ Tweets/Hour: ${tweetsPerHour}`);
  console.log(`⏱️ Avg Time/Tweet: ${avgTimePerTweet}s`);
  console.log(`🎭 Strategy Usage: ${strategyStats}`);
  
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
        console.log(`🔄 Loaded ${keywordRotation.keywords.length} rotation keywords:`, keywordRotation.keywords);
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
  
  console.log(`🔄 Rotating to keyword: "${newKeyword}" (${keywordRotation.currentIndex + 1}/${keywordRotation.keywords.length})`);
  addDetailedActivity(`🔄 Rotating to keyword: "${newKeyword}"`, 'info');
  
  // Save rotation state
  await saveSession();
  
  // Update the search URL and refresh
  const currentUrl = window.location.href;
  const baseUrl = 'https://x.com/search?q=';
  const newUrl = `${baseUrl}${encodeURIComponent(newKeyword)}&src=typed_query&f=live`;
  
  // Navigate to new keyword search
  window.location.href = newUrl;
}

async function loadSession() {
  return new Promise(resolve => {
    chrome.storage.local.get(['boldtake_session', 'strategy_rotation'], (result) => {
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

// Initialize
console.log('✅ BoldTake Professional ready! Go to X.com and click Start.');
console.log('🎯 Session mode: 120 tweets with 30s-5m random delays (optimized for user experience)');
console.log('�� Spam filtering enabled - only quality tweets targeted');
console.log('☕ Optimized for extended automation sessions!');

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

    debugLog('📊 Analytics updated:', {
      total: totalComments,
      today: dailyComments,
      streak: currentStreak,
      best: bestStreak
    });

  } catch (error) {
    console.error('❌ Failed to update analytics data:', error);
  }
}

/**
 * Get personalization settings from storage
 * @returns {Promise<Object>} Object containing language and tone settings
 */
async function getPersonalizationSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['boldtake_language', 'boldtake_tone'], (result) => {
      resolve({
        language: result.boldtake_language || 'english',
        tone: result.boldtake_tone || 'adaptive'
      });
    });
  });
}

/**
 * Build enhanced prompt with language and tone instructions
 * @param {string} baseTemplate - Base prompt template
 * @param {string} tweetText - Tweet to reply to
 * @param {Object} personalization - Language and tone settings
 * @returns {string} Enhanced prompt with personalization
 */
function buildEnhancedPrompt(baseTemplate, tweetText, personalization) {
  let enhancedPrompt = baseTemplate.replace('{TWEET}', tweetText);
  
  // Add language instruction if not English
  if (personalization.language !== 'english') {
    const languageInstructions = getLanguageInstruction(personalization.language);
    enhancedPrompt += `\n\nLANGUAGE REQUIREMENT: ${languageInstructions}`;
  }
  
  // Add tone modification if not adaptive
  if (personalization.tone !== 'adaptive') {
    const toneInstructions = getToneInstruction(personalization.tone);
    enhancedPrompt += `\n\nTONE STYLE: ${toneInstructions}`;
  }
  
  return enhancedPrompt;
}

/**
 * Get language-specific instructions
 * @param {string} language - Selected language
 * @returns {string} Language instruction
 */
function getLanguageInstruction(language) {
  const instructions = {
    spanish: 'Respond in natural, conversational Spanish. Use proper grammar and cultural context.',
    french: 'Respond in natural, conversational French. Use proper grammar and cultural context.',
    german: 'Respond in natural, conversational German. Use proper grammar and cultural context.',
    italian: 'Respond in natural, conversational Italian. Use proper grammar and cultural context.',
    portuguese: 'Respond in natural, conversational Portuguese. Use proper grammar and cultural context.',
    dutch: 'Respond in natural, conversational Dutch. Use proper grammar and cultural context.',
    japanese: 'Respond in natural, conversational Japanese. Use appropriate politeness levels and cultural context.',
    korean: 'Respond in natural, conversational Korean. Use appropriate politeness levels and cultural context.',
    chinese: 'Respond in natural, conversational Chinese (Simplified). Use proper grammar and cultural context.',
    russian: 'Respond in natural, conversational Russian. Use proper grammar and cultural context.',
    arabic: 'Respond in natural, conversational Arabic. Use proper grammar and cultural context.',
    hindi: 'Respond in natural, conversational Hindi. Use proper grammar and cultural context.',
    turkish: 'Respond in natural, conversational Turkish. Use proper grammar and cultural context.',
    polish: 'Respond in natural, conversational Polish. Use proper grammar and cultural context.',
    swedish: 'Respond in natural, conversational Swedish. Use proper grammar and cultural context.',
    norwegian: 'Respond in natural, conversational Norwegian. Use proper grammar and cultural context.',
    danish: 'Respond in natural, conversational Danish. Use proper grammar and cultural context.',
    finnish: 'Respond in natural, conversational Finnish. Use proper grammar and cultural context.',
    czech: 'Respond in natural, conversational Czech. Use proper grammar and cultural context.',
    hungarian: 'Respond in natural, conversational Hungarian. Use proper grammar and cultural context.',
    romanian: 'Respond in natural, conversational Romanian. Use proper grammar and cultural context.',
    greek: 'Respond in natural, conversational Greek. Use proper grammar and cultural context.',
    hebrew: 'Respond in natural, conversational Hebrew. Use proper grammar and cultural context.',
    thai: 'Respond in natural, conversational Thai. Use proper grammar and cultural context.',
    vietnamese: 'Respond in natural, conversational Vietnamese. Use proper grammar and cultural context.',
    indonesian: 'Respond in natural, conversational Indonesian. Use proper grammar and cultural context.',
    malay: 'Respond in natural, conversational Malay. Use proper grammar and cultural context.',
    filipino: 'Respond in natural, conversational Filipino (Tagalog). Use proper grammar and cultural context.',
    ukrainian: 'Respond in natural, conversational Ukrainian. Use proper grammar and cultural context.',
    bulgarian: 'Respond in natural, conversational Bulgarian. Use proper grammar and cultural context.',
    croatian: 'Respond in natural, conversational Croatian. Use proper grammar and cultural context.',
    serbian: 'Respond in natural, conversational Serbian. Use proper grammar and cultural context.',
    slovenian: 'Respond in natural, conversational Slovenian. Use proper grammar and cultural context.',
    slovak: 'Respond in natural, conversational Slovak. Use proper grammar and cultural context.',
    lithuanian: 'Respond in natural, conversational Lithuanian. Use proper grammar and cultural context.',
    latvian: 'Respond in natural, conversational Latvian. Use proper grammar and cultural context.',
    estonian: 'Respond in natural, conversational Estonian. Use proper grammar and cultural context.'
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

debugLog('🔥 BoldTake Professional content script loaded and ready!');
