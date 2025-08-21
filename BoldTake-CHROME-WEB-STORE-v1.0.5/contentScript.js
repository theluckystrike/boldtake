/**
 * BoldTake - Professional X.com Automation
 * Intelligent AI-powered engagement system
 */

// Production mode - no debug logging  
const DEBUG_MODE = false;
const debugLog = DEBUG_MODE ? console.log : () => {};

// Activity tracking for live feed
let recentActivities = [];

// 🚀 STUCK SESSION DETECTOR: Monitors session health and auto-recovers
const sessionHealthMonitor = {
  lastActivityTime: Date.now(),
  lastSuccessfulTweet: Date.now(),
  healthCheckInterval: null,
  maxInactivityTime: 5 * 60 * 1000, // 5 minutes of no activity
  maxNoSuccessTime: 10 * 60 * 1000, // 10 minutes without successful tweet
  recoveryAttempts: 0,
  maxRecoveryAttempts: 3,
  
  // Start monitoring session health
  startMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.lastActivityTime = Date.now();
    this.lastSuccessfulTweet = Date.now();
    this.recoveryAttempts = 0;
    
    this.healthCheckInterval = setInterval(() => {
      this.checkSessionHealth();
    }, 30000); // Check every 30 seconds
    
    console.log('🏥 Session health monitoring started');
  },
  
  // Stop monitoring
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('🏥 Session health monitoring stopped');
  },
  
  // Update activity timestamp
  recordActivity() {
    this.lastActivityTime = Date.now();
  },
  
  // Update successful tweet timestamp
  recordSuccessfulTweet() {
    this.lastSuccessfulTweet = Date.now();
    this.recoveryAttempts = 0; // Reset recovery attempts on success
  },
  
  // Check if session is stuck and attempt recovery
  async checkSessionHealth() {
    if (!sessionStats.isRunning) return;
    
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivityTime;
    const timeSinceSuccess = now - this.lastSuccessfulTweet;
    
    // Check for complete inactivity (stuck)
    if (timeSinceActivity > this.maxInactivityTime) {
      console.warn('🚨 STUCK SESSION DETECTED: No activity for', Math.round(timeSinceActivity/1000), 'seconds');
      addDetailedActivity(`🚨 Stuck session detected - no activity for ${Math.round(timeSinceActivity/60000)}m`, 'warning');
      await this.attemptRecovery('inactivity');
      return;
    }
    
    // Check for no successful tweets (might be stuck on errors)
    if (timeSinceSuccess > this.maxNoSuccessTime && this.recoveryAttempts < this.maxRecoveryAttempts) {
      console.warn('🚨 NO SUCCESS DETECTED: No successful tweets for', Math.round(timeSinceSuccess/1000), 'seconds');
      addDetailedActivity(`🚨 No successful tweets for ${Math.round(timeSinceSuccess/60000)}m - attempting recovery`, 'warning');
      await this.attemptRecovery('no_success');
      return;
    }
    
    // Log health status every 2 minutes
    if (timeSinceActivity > 120000) { // 2 minutes
      const activityMinutes = Math.round(timeSinceActivity/60000);
      const successMinutes = Math.round(timeSinceSuccess/60000);
      console.log(`🏥 Session health: ${activityMinutes}m since activity, ${successMinutes}m since success`);
    }
  },
  
  // Attempt to recover stuck session
  async attemptRecovery(reason) {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      console.error('🚨 MAX RECOVERY ATTEMPTS REACHED - Stopping session');
      addDetailedActivity('🚨 Max recovery attempts reached - session stopped', 'error');
      sessionStats.isRunning = false;
      chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
      return;
    }
    
    this.recoveryAttempts++;
    console.log(`🔄 RECOVERY ATTEMPT ${this.recoveryAttempts}/${this.maxRecoveryAttempts} for ${reason}`);
    addDetailedActivity(`🔄 Recovery attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts}`, 'info');
    
    try {
      // Close any stuck modals
      const closeButtons = document.querySelectorAll('[data-testid="app-bar-close"], [aria-label="Close"]');
      for (const button of closeButtons) {
        if (button.offsetParent !== null) {
          button.click();
          await sleep(1000);
        }
      }
      
      // Press Escape key to close anything
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, which: 27 }));
      await sleep(1000);
      
      // Scroll to top to reset view
      window.scrollTo(0, 0);
      await sleep(2000);
      
      // Clear performance cache
      performanceCache.invalidate();
      
      // Record recovery activity
      this.recordActivity();
      
      console.log('✅ Recovery attempt completed');
      addDetailedActivity('✅ Recovery attempt completed - resuming session', 'success');
      
    } catch (error) {
      console.error('❌ Recovery attempt failed:', error);
      addDetailedActivity(`❌ Recovery attempt failed: ${error.message}`, 'error');
    }
  }
};

// 🚀 REAL-TIME PERFORMANCE MONITOR: Tracks session quality and auto-adjusts
const performanceMonitor = {
  sessionStartTime: null,
  lastPerformanceCheck: Date.now(),
  performanceHistory: [],
  
  // Start performance monitoring
  startMonitoring() {
    this.sessionStartTime = Date.now();
    this.lastPerformanceCheck = Date.now();
    this.performanceHistory = [];
    console.log('📊 Performance monitoring started');
  },
  
  // Record session metrics every few minutes
  recordPerformanceMetrics() {
    if (!this.sessionStartTime || !sessionStats.isRunning) return;
    
    const now = Date.now();
    const sessionDuration = now - this.sessionStartTime;
    const timeSinceLastCheck = now - this.lastPerformanceCheck;
    
    // Record metrics every 2 minutes
    if (timeSinceLastCheck >= 120000) { // 2 minutes
      const metrics = {
        timestamp: now,
        duration: sessionDuration,
        attempted: sessionStats.attempted || 0,
        successful: sessionStats.successful || 0,
        skipped: sessionStats.skipped || 0,
        successRate: sessionStats.attempted > 0 ? (sessionStats.successful / sessionStats.attempted * 100) : 0,
        tweetsPerHour: sessionDuration > 0 ? (sessionStats.successful / (sessionDuration / 3600000)) : 0
      };
      
      this.performanceHistory.push(metrics);
      this.lastPerformanceCheck = now;
      
      // Keep only last 10 records
      if (this.performanceHistory.length > 10) {
        this.performanceHistory.shift();
      }
      
      // Log performance summary
      console.log(`📊 Performance: ${metrics.successRate.toFixed(1)}% success rate, ${metrics.tweetsPerHour.toFixed(1)} tweets/hour`);
      
      // Auto-adjust if performance is poor
      this.autoAdjustIfNeeded(metrics);
    }
  },
  
  // Auto-adjust session parameters if performance is poor
  autoAdjustIfNeeded(metrics) {
    // If success rate is very low (under 50%), increase delays slightly
    if (metrics.successRate < 50 && metrics.attempted > 5) {
      console.warn('⚠️ Low success rate detected - auto-adjusting for better reliability');
      addDetailedActivity(`⚠️ Auto-adjusting: Success rate ${metrics.successRate.toFixed(1)}%`, 'warning');
      
      // Increase minimum delay slightly for better reliability
      if (SECURITY_CONFIG.MIN_DELAY < 45000) {
        SECURITY_CONFIG.MIN_DELAY += 5000; // Add 5 seconds
        console.log(`🔧 Increased minimum delay to ${SECURITY_CONFIG.MIN_DELAY/1000}s for better reliability`);
      }
    }
    
    // If we're getting too many skips, pause briefly
    if (metrics.attempted > 0 && (metrics.skipped / metrics.attempted) > 0.5) {
      console.warn('⚠️ High skip rate detected - taking a brief pause');
      addDetailedActivity('⚠️ High skip rate - taking 30s pause', 'warning');
      // This will be handled by the delay system
    }
  },
  
  // Get current session summary
  getSessionSummary() {
    if (!this.sessionStartTime) return null;
    
    const duration = Date.now() - this.sessionStartTime;
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    
    return {
      duration: `${hours}h ${minutes}m`,
      attempted: sessionStats.attempted || 0,
      successful: sessionStats.successful || 0,
      skipped: sessionStats.skipped || 0,
      successRate: sessionStats.attempted > 0 ? (sessionStats.successful / sessionStats.attempted * 100) : 0,
      tweetsPerHour: duration > 0 ? (sessionStats.successful / (duration / 3600000)) : 0
    };
  }
};

// 🚀 PERFORMANCE: DOM query cache for frequently accessed elements
const performanceCache = {
  tweets: null,
  lastTweetQuery: 0,
  replyButtons: null,
  lastButtonQuery: 0,
  textAreas: null,
  lastTextAreaQuery: 0,
  
  // Cache tweets for 3 seconds (safe caching)
  getTweets(selector) {
    const now = Date.now();
    if (!this.tweets || now - this.lastTweetQuery > 3000) {
      this.tweets = document.querySelectorAll(selector);
      this.lastTweetQuery = now;
    }
    return this.tweets;
  },
  
  // Cache reply buttons for 2 seconds
  getReplyButtons(selector) {
    const now = Date.now();
    if (!this.replyButtons || now - this.lastButtonQuery > 2000) {
      this.replyButtons = document.querySelectorAll(selector);
      this.lastButtonQuery = now;
    }
    return this.replyButtons;
  },
  
  // Cache text areas for 1 second (they change frequently)
  getTextAreas(selector) {
    const now = Date.now();
    if (!this.textAreas || now - this.lastTextAreaQuery > 1000) {
      this.textAreas = document.querySelectorAll(selector);
      this.lastTextAreaQuery = now;
    }
    return this.textAreas;
  },
  
  // Clear cache when needed
  invalidate() {
    this.tweets = null;
    this.replyButtons = null;
    this.textAreas = null;
  }
};

// 🚀 PERFORMANCE: Simple performance monitoring
const performanceMonitor = {
  startTime: null,
  tweetProcessingTimes: [],
  
  startTweetProcessing() {
    this.startTime = Date.now();
  },
  
  endTweetProcessing() {
    if (this.startTime) {
      const duration = Date.now() - this.startTime;
      this.tweetProcessingTimes.push(duration);
      
      // Keep only last 10 measurements
      if (this.tweetProcessingTimes.length > 10) {
        this.tweetProcessingTimes.shift();
      }
      
      const avgTime = this.tweetProcessingTimes.reduce((a, b) => a + b, 0) / this.tweetProcessingTimes.length;
      debugLog(`⚡ Tweet processed in ${duration}ms (avg: ${Math.round(avgTime)}ms)`);
      
      this.startTime = null;
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
  // Rate limiting - Optimized for enterprise use
  MAX_COMMENTS_PER_DAY: 155,  // Enterprise limit with +5 customer satisfaction buffer
  
  // Timing constraints (milliseconds) - BALANCED STEALTH + PERFORMANCE
  MIN_DELAY_BETWEEN_ACTIONS: 45000,  // 45 seconds minimum (balanced for speed + stealth)
  MAX_DELAY_BETWEEN_ACTIONS: 120000, // 2 minutes maximum (faster but still safe)
  
  // Advanced behavioral patterns to mimic human behavior - OPTIMIZED STEALTH
  HUMAN_VARIANCE_FACTOR: 0.5, // 50% random variance (natural but not excessive)
  BREAK_PROBABILITY: 0.15,     // 15% chance of longer breaks (reduced frequency)
  LONG_BREAK_DURATION: 600000, // 10 minute break (shorter breaks)
  MICRO_BREAK_PROBABILITY: 0.20, // 20% chance of micro-breaks (reduced)
  MICRO_BREAK_DURATION: 90000,  // 1.5 minute micro-breaks (much shorter)
  
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
        
        // NEW ARCHITECTURE: We never set 'inactive' status anymore
        // Local storage is source of truth, so subscription status is always valid
        // If there were API issues, auth.js maintains last known good status
        debugLog('✅ Subscription status refreshed during session:', updatedAuthState.subscriptionStatus);
      }
    }
  } catch (error) {
    console.error('❌ Failed to validate subscription during action:', error);
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
  
  // BALANCED: Time-of-day adjustments with reasonable anti-detection patterns
  const hour = new Date().getHours();
  if (hour >= 23 || hour <= 6) {
    delay *= 1.4; // Moderate night slowdown (reduced from 2.0x)
    addDetailedActivity('🌙 Night mode: Slower activity', 'info');
  } else if (hour >= 12 && hour <= 14) {
    delay *= 1.2; // Slight lunch time slowdown (reduced from 1.4x)
    addDetailedActivity('🍽️ Lunch time: Natural pacing', 'info');
  } else if (hour >= 17 && hour <= 19) {
    delay *= 1.15; // Minor evening adjustment (reduced from 1.3x)
    addDetailedActivity('🏠 Evening: Slightly distracted timing', 'info');
  }
  
  // Weekend adjustments (different patterns on weekends)
  const isWeekend = [0, 6].includes(new Date().getDay());
  if (isWeekend) {
    delay *= 1.2; // Moderate weekend delays (reduced from 1.4x)
    addDetailedActivity('🎮 Weekend: Relaxed pacing', 'info');
  }
  
  // ANTI-DETECTION: Add smaller random variance to break patterns
  const antiDetectionBoost = Math.random() * 30000; // Up to 30 seconds extra (reduced from 90s)
  delay += antiDetectionBoost;
  
  // STEALTH: Occasional longer pauses (human gets distracted/busy)
  if (Math.random() < 0.05) { // 5% chance of distraction (reduced from 8%)
    const distractionTime = Math.random() * 300000; // Up to 5 minutes (reduced from 10 minutes)
    delay += distractionTime;
    addDetailedActivity('💭 Extended pause: Human distraction', 'info');
  }
  
  // Ensure minimum but cap at reasonable maximum
  delay = Math.max(SECURITY_CONFIG.MIN_DELAY_BETWEEN_ACTIONS, delay);
  // Cap at max delay + 1 minute for anti-detection variance (reduced from 3 minutes)
  delay = Math.min(delay, SECURITY_CONFIG.MAX_DELAY_BETWEEN_ACTIONS + 60000);
  
  return Math.floor(delay);
}

/**
 * 🕵️ ANTI-DETECTION: Simulate human-like interactions to avoid bot detection
 */
async function performHumanLikeActions() {
  try {
    // Random mouse movements (humans naturally move mouse while reading)
    if (Math.random() < 0.4) { // 40% chance
      const randomX = Math.random() * window.innerWidth;
      const randomY = Math.random() * window.innerHeight;
      
      // Create subtle mouse movement event
      const moveEvent = new MouseEvent('mousemove', {
        clientX: randomX,
        clientY: randomY,
        bubbles: true
      });
      document.dispatchEvent(moveEvent);
      
      debugLog('🖱️ Anti-detection: Simulated natural mouse movement');
    }
    
    // Random scrolling (humans scroll while browsing)
    if (Math.random() < 0.3) { // 30% chance
      const scrollAmount = Math.random() * 300 - 150; // -150 to +150px
      window.scrollBy(0, scrollAmount);
      await sleep(1000 + Math.random() * 2000); // 1-3 second pause
      
      debugLog('📜 Anti-detection: Simulated natural scrolling');
    }
    
    // Random focus events (humans click around)
    if (Math.random() < 0.2) { // 20% chance
      const focusableElements = document.querySelectorAll('a, button, input, [tabindex]');
      if (focusableElements.length > 0) {
        const randomElement = focusableElements[Math.floor(Math.random() * focusableElements.length)];
        if (randomElement && randomElement.offsetParent !== null) {
          randomElement.focus();
          await sleep(500 + Math.random() * 1000); // Brief focus
          randomElement.blur();
          
          debugLog('🎯 Anti-detection: Simulated natural element focus');
        }
      }
    }
    
    // Occasional longer pauses (humans get distracted)
    if (Math.random() < 0.1) { // 10% chance
      const distractionTime = 2000 + Math.random() * 8000; // 2-10 seconds
      await sleep(distractionTime);
      debugLog('💭 Anti-detection: Simulated human distraction pause');
    }
    
  } catch (error) {
    debugLog('Anti-detection actions failed (non-critical):', error);
  }
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

// Production Configuration already set at top of file with DEBUG_MODE

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
// ❌ REMOVED: SAFE_FALLBACK_REPLIES system completely eliminated
// The extension now uses "Retry, then Skip" approach instead of generic fallbacks

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
    console.log('🚀 Auto-starting new session from popup...');
    startContinuousSession(); // Start a fresh session
  } else if (sessionStats.isRunning) {
    // It's not a new session, but one was running, so resume it.
    debugLog('🔄 Resuming active session...');
    showStatus(`🔄 Resuming active session: ${sessionStats.successful}/${sessionStats.target} tweets`);
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
  debugLog('📨 Received message:', message.type);
  
  if (message.type === 'BOLDTAKE_START') {
    console.log('🎯 Starting BoldTake continuous session...');
    startContinuousSession();
    sendResponse({success: true, message: 'BoldTake session started'});
  } else if (message.type === 'BOLDTAKE_STOP') {
    console.log('🛑 Force stopping BoldTake session...');
    
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
  // 🏥 Start health monitoring for session reliability
  sessionHealthMonitor.startMonitoring();
  
  // 📊 Start performance monitoring
  performanceMonitor.startMonitoring();
  
  // 🎯 CRITICAL FIX: Ensure we're on the correct search page before starting
  if (!isResuming) {
    const currentUrl = window.location.href;
    console.log('🔍 Current URL before session start:', currentUrl);
    
    // Check if we're NOT on a search page (home, explore, profile, etc.)
    if (!currentUrl.includes('/search?q=') || currentUrl.includes('/explore')) {
      console.log('⚠️ NOT ON SEARCH PAGE: Navigating to search page with user settings...');
      addDetailedActivity('⚠️ Wrong page detected - navigating to search', 'warning');
      
      // Get user's keyword and settings from storage
      try {
        const settings = await chrome.storage.local.get(['boldtake_keyword', 'boldtake_min_faves']);
        const keyword = settings.boldtake_keyword || 'artificial intelligence';
        const minFaves = settings.boldtake_min_faves || '500';
        
        const searchUrl = `https://x.com/search?q=${encodeURIComponent(keyword)}%20min_faves%3A${minFaves}%20lang%3Aen&src=typed_query&f=live`;
        
        console.log(`🎯 Navigating to search page: ${keyword} (min_faves:${minFaves})`);
        addDetailedActivity(`🎯 Navigating to search: "${keyword}"`, 'info');
        
        // Navigate to the correct search page
        window.location.href = searchUrl;
        return; // Stop here, session will auto-resume after navigation
        
      } catch (error) {
        console.error('❌ Failed to get settings for navigation:', error);
        showStatus('❌ Failed to navigate to search page');
        addDetailedActivity('❌ Navigation failed - check settings', 'error');
        return;
      }
    } else {
      console.log('✅ Already on search page - proceeding with session');
      addDetailedActivity('✅ On correct search page', 'success');
    }
  }
  
  // SAFETY CHECK: Prevent duplicate session instances
  if (sessionStats.isRunning && !isResuming) {
    showStatus('🔄 Session already running!');
    return;
  }
  
  // INITIALIZATION: Set up fresh session or resume existing
  if (!isResuming) {
    console.log('🎬 === BoldTake Session Started ===');
    
    // Initialize comprehensive session statistics
    // SUBSCRIPTION-AWARE: Get daily limit from authentication system
    let dailyLimit = 120; // Default fallback
    try {
      if (window.BoldTakeAuthManager) {
        const baseLimit = window.BoldTakeAuthManager.getDailyLimit() || 120;
        // CUSTOMER SATISFACTION: Add +5 buffer to advertised limits
        // This ensures users get slightly more than promised (125 for Pro, 10 for Trial)
        dailyLimit = baseLimit + 5;
        console.log(`🎁 Daily limit with satisfaction buffer: ${dailyLimit} (base: ${baseLimit} + 5 bonus)`);
      }
    } catch (error) {
      console.warn('⚠️ Could not get subscription limit, using default 125 (120+5)');
      dailyLimit = 125; // Default with buffer
    }

    sessionStats = {
      processed: 0,               // Total tweets SUCCESSFULLY processed (replied to)
      attempted: 0,               // 🔄 RETRY-THEN-SKIP: Total tweets attempted (including skipped)
      successful: 0,              // Successfully replied tweets (same as processed)
      skipped: 0,                 // 🔄 RETRY-THEN-SKIP: Tweets skipped due to AI failures
      failed: 0,                  // Failed processing attempts
      consecutiveApiFailures: 0,  // Circuit breaker for API issues
      consecutiveFailures: 0,     // 🔄 RETRY-THEN-SKIP: Counter for consecutive skipped tweets
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
      debugLog('🔄 Preserved strategy counts across sessions:', strategyRotation.usageCount);
    }
    debugLog('🔄 Strategy rotation reset for new session');
  } else {
    sessionStats.isRunning = true;
  }
  
  await saveSession();
  showStatus(`🚀 Starting BoldTake session: Target ${sessionStats.target} tweets`);
  
  // MAIN PROCESSING LOOP - The core automation engine
  // This loop continues until target is reached or session is stopped
  // 🔄 SAFEGUARD: Prevent infinite loops by limiting total attempts
  const maxAttempts = sessionStats.target * 3; // Allow 3x attempts vs target (accounts for skips)
  
  try {
    while (sessionStats.isRunning && sessionStats.processed < sessionStats.target && sessionStats.attempted < maxAttempts) {
      
      // SAFETY CHECKPOINT 1: Verify session is still active
      if (!sessionStats.isRunning) {
        console.log('🛑 Session stopped during main loop');
        break;
      }
      
      // 🔐 LOGIN STATE MONITOR: Check every 5th attempted tweet
      if (sessionStats.attempted > 0 && sessionStats.attempted % 5 === 0) {
        const isLoggedIn = await checkLoginState();
        if (!isLoggedIn) {
          console.error('🔐 LOGOUT DETECTED: User session expired during automation');
          addDetailedActivity('🔐 LOGOUT DETECTED: X.com session expired', 'error');
          showStatus('🔐 EMERGENCY STOP: You have been logged out of X.com');
          sessionStats.isRunning = false;
          chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
          
          // Show clear user notification
          addDetailedActivity('🚨 Please log back into X.com and restart the session', 'error');
          break;
        }
      }
      
      // 🚧 ENHANCED OBSTRUCTION DETECTOR: Check for unexpected popups/modals every 3rd tweet
      if (sessionStats.attempted > 0 && sessionStats.attempted % 3 === 0) {
        const obstruction = await detectPageObstructions();
        if (obstruction) {
          console.warn(`🚧 OBSTRUCTION DETECTED: ${obstruction.type} - ${obstruction.message}`);
          addDetailedActivity(`🚧 OBSTRUCTION: ${obstruction.message}`, 'warning');
          
          // 🎯 SMART RECOVERY: Try to recover from obstructions instead of stopping
          if (obstruction.type === 'PAGE_ERROR') {
            showStatus(`🔄 Page error detected - attempting refresh recovery...`);
            addDetailedActivity('🔄 Attempting page refresh recovery', 'info');
            window.location.reload();
            return;
          } else if (obstruction.type === 'UNEXPECTED_MODAL' || obstruction.type === 'FULLSCREEN_OVERLAY') {
            showStatus(`🔧 Modal/overlay detected - attempting to close...`);
            addDetailedActivity('🔧 Attempting to close modal/overlay', 'info');
            
            // Try to close the obstruction
            try {
              const closeButton = obstruction.element.querySelector('[aria-label="Close"], [data-testid*="close"], button[aria-label*="close"]');
              if (closeButton) {
                closeButton.click();
                await sleep(2000);
                addDetailedActivity('✅ Successfully closed obstruction', 'success');
                // Continue session
              } else {
                // Press Escape key
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, which: 27 }));
                await sleep(2000);
                addDetailedActivity('✅ Used Escape key to close obstruction', 'success');
              }
            } catch (error) {
              console.warn('⚠️ Could not close obstruction, continuing anyway:', error);
              addDetailedActivity('⚠️ Could not close obstruction, continuing session', 'warning');
            }
          } else {
            // For other obstructions (rate limits, captcha, etc.), pause and show user message
            showStatus(`🚧 Session paused: ${obstruction.message}`);
            sessionStats.isRunning = false;
            chrome.runtime.sendMessage({ type: 'BOLDTAKE_PAUSE' });
            
            // Show user-friendly message with resolution steps
            addDetailedActivity('⚠️ Session paused: Unexpected popup detected on X.com', 'warning');
            addDetailedActivity('🔧 Please resolve the popup on the page and click "Resume" to continue', 'info');
            break;
          }
        }
      }
      
      // CORE PROCESSING: Find and process the next suitable tweet
      // This includes: tweet selection, AI generation, posting, and liking
      sessionHealthMonitor.recordActivity(); // Record activity before processing
      performanceMonitor.recordPerformanceMetrics(); // Track performance metrics
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
          const waitHours = Math.round(waitMinutes / 60);
          
          // CRITICAL: Enhanced security hold notifications for user visibility
          if (waitMinutes >= 60) {
            addDetailedActivity(`🚨 CRITICAL SECURITY HOLD: ${waitHours}h error cooldown`, 'error');
            addDetailedActivity(`⏰ Next action available: ${new Date(Date.now() + safetyCheck.waitTime).toLocaleTimeString()}`, 'error');
            addDetailedActivity(`📋 Reason: ${safetyCheck.reason}`, 'warning');
            updateCornerWidget(`🚨 Security Hold: ${waitHours}h remaining`);
          } else if (waitMinutes >= 30) {
            addDetailedActivity(`🛡️ SECURITY HOLD: ${waitMinutes}min rate limit pause`, 'warning');
            addDetailedActivity(`⏰ Resume time: ${new Date(Date.now() + safetyCheck.waitTime).toLocaleTimeString()}`, 'warning');
            updateCornerWidget(`🛡️ Security Hold: ${waitMinutes}m remaining`);
          } else {
            addDetailedActivity(`🛡️ Security delay: ${safetyCheck.reason} (${waitMinutes}m)`, 'info');
            updateCornerWidget(`🛡️ Security hold: ${waitMinutes}m remaining`);
          }
          
          // ENFORCED SAFETY PAUSE: Wait for required safety period
          await new Promise(resolve => setTimeout(resolve, safetyCheck.waitTime));
          continue; // Restart loop after safety compliance
        }
        
        // ✅ ARCHITECTURAL FIX: Delay system moved inside processNextTweet()
        // This ensures delay happens AFTER every successful reply, not here in main loop
      }
    }
  } catch (error) {
    console.error('💥 CRITICAL ERROR! Attempting graceful recovery...', error);
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
        console.log('🔄 Attempting to continue session after recovery...');
        // Continue the loop
      } catch (recoveryError) {
        console.error('❌ Recovery failed:', recoveryError);
        sessionStats.criticalErrors++;
      }
    } else {
      // After 3 critical errors, stop session instead of refresh
      showStatus('💥 Multiple critical errors! Stopping session for safety.');
      addDetailedActivity('🛑 Session stopped due to multiple errors', 'error');
      sessionStats.isRunning = false;
      chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
    }
  }
  
  // 🔄 RETRY-THEN-SKIP: Check why session ended
  if (sessionStats.attempted >= maxAttempts && sessionStats.processed < sessionStats.target) {
    console.warn(`⚠️ Session ended: Reached maximum attempts (${maxAttempts}) with ${sessionStats.skipped} tweets skipped`);
    addDetailedActivity(`⚠️ Session ended: Too many skipped tweets (${sessionStats.skipped}/${sessionStats.attempted})`, 'warning');
    showStatus(`⚠️ Session paused: ${sessionStats.skipped} tweets skipped due to AI issues`);
  }
  
  // Session complete
  sessionStats.isRunning = false;
  
  // 🏥 Stop health monitoring when session ends
  sessionHealthMonitor.stopMonitoring();
  
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
  performanceMonitor.startTweetProcessing(); // 🚀 Start performance tracking
  
  updateStatus(`🔍 Processing tweet ${sessionStats.attempted + 1} (${sessionStats.processed}/${sessionStats.target} successful)...`);
  addDetailedActivity(`🔍 Processing tweet ${sessionStats.attempted + 1} (${sessionStats.processed}/${sessionStats.target} successful)`, 'info');
  debugLog(`\n🎯 === Tweet ${sessionStats.attempted + 1} (${sessionStats.processed}/${sessionStats.target} successful) ===`);

  let tweet;
  let attempt = 0;
  const maxAttempts = 3;

  // Retry loop to find a suitable tweet
  while (attempt < maxAttempts) {
    addDetailedActivity(`🔎 Searching for suitable tweets...`, 'info');
    tweet = await findTweet();
    if (tweet) {
      addDetailedActivity(`✅ Found suitable tweet to process`, 'success');
      break; // Found a tweet, exit the loop
    }
    
    attempt++;
    console.log(`🚫 Attempt ${attempt}/${maxAttempts}: No suitable tweets found. Scrolling...`);
    addDetailedActivity(`🚫 No tweets found (${attempt}/${maxAttempts}). Scrolling for more...`, 'warning');
    window.scrollTo(0, document.body.scrollHeight);
    
    console.log('⏳ Waiting 3 seconds for new tweets to load...');
    addDetailedActivity(`⏳ Loading new tweets...`, 'info');
    await sleep(2000); // Wait for content to load (optimized)
  }

  if (!tweet) {
    // Check if we're stuck on an X.com error page
    if (detectXcomErrorPage()) {
      addDetailedActivity('🔴 Stuck on X.com error page - refreshing', 'error');
      await handleXcomPageError();
      return false;
    }
    
    showStatus(`🏁 No new tweets found after ${maxAttempts} attempts. Pausing session.`);
    console.log(`🏁 No new tweets found after ${maxAttempts} attempts. Session paused.`);
    sessionStats.isRunning = false;
    chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
    return false; // Indicate session pause
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

  // 🗑️ DELETED TWEET DETECTOR: Check if tweet still exists and has reply button
  const replyButton = tweet.querySelector('[data-testid="reply"]');
  if (!replyButton) {
    // Check if tweet disappeared (deleted) vs just missing button
    const tweetStillExists = document.body.contains(tweet);
    const tweetText = tweet.textContent || '';
    
    if (!tweetStillExists || tweetText.includes('This Tweet was deleted') || tweetText.includes('Tweet unavailable')) {
      console.warn('⚠️ DELETED TWEET: Tweet no longer available, may have been deleted. Skipping.');
      addDetailedActivity('⚠️ Tweet no longer available (possibly deleted) - skipping', 'warning');
      updateStatus(`⚠️ Tweet deleted/unavailable - skipping to next tweet`);
      // Don't count as failure since this isn't our fault
      await saveSession();
      return 'skip'; // Use skip logic instead of failure
    } else {
      console.error('❌ Reply button not found on existing tweet (UI issue)');
      addDetailedActivity('❌ Reply button missing on existing tweet', 'error');
      updateStatus(`❌ Reply button not found on tweet.`);
      sessionStats.failed++;
      await saveSession();
      return false;
    }
  }
  
  // 🗑️ ADDITIONAL VALIDATION: Check if tweet elements are still valid before clicking
  try {
    // Verify tweet is still in DOM and accessible
    if (!document.body.contains(tweet) || !document.body.contains(replyButton)) {
      console.warn('⚠️ DELETED TWEET: Tweet elements removed from DOM during processing. Skipping.');
      addDetailedActivity('⚠️ Tweet removed from DOM during processing - skipping', 'warning');
      updateStatus(`⚠️ Tweet disappeared during processing - skipping`);
      await saveSession();
      return 'skip';
    }
    
    // Verify reply button is still clickable
    const buttonRect = replyButton.getBoundingClientRect();
    if (buttonRect.width === 0 || buttonRect.height === 0) {
      console.warn('⚠️ DELETED TWEET: Reply button no longer visible. Tweet may have been deleted. Skipping.');
      addDetailedActivity('⚠️ Reply button no longer visible - tweet likely deleted', 'warning');
      updateStatus(`⚠️ Tweet became unavailable - skipping`);
      await saveSession();
      return 'skip';
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
    
  } catch (error) {
    console.warn(`⚠️ DELETED TWEET: Error clicking reply button - tweet likely deleted: ${error.message}`);
    addDetailedActivity(`⚠️ Tweet interaction failed - likely deleted: ${error.message}`, 'warning');
    updateStatus(`⚠️ Tweet became unavailable during interaction - skipping`);
    await saveSession();
    return 'skip';
  }
  
  await sleep(randomDelay(1500, 3000)); // Optimized delay for realism

  // --- Reply Modal Scope ---
  const success = await handleReplyModal(tweet);
  
  // 🔄 RETRY-THEN-SKIP: Handle three possible outcomes
  // Always increment attempted counter for all tweet processing attempts
  sessionStats.attempted++;
  
  if (success === true) {
    // ✅ SUCCESS: Reply posted successfully
    sessionStats.processed++;
    sessionStats.successful++;
    sessionStats.lastSuccessfulTweet = new Date().getTime();
    
    // 🏥 Record successful tweet for health monitoring
    sessionHealthMonitor.recordSuccessfulTweet();
    sessionStats.retryAttempts = 0; // Reset retry counter on success
    updateStatus(`✅ Tweet ${sessionStats.processed}/${sessionStats.target} replied!`);
    addDetailedActivity(`✅ Successfully replied to tweet ${sessionStats.processed}/${sessionStats.target}`, 'success');
    
    // ANALYTICS: Update persistent analytics data
    await updateAnalyticsData();
    
    // Auto-trigger analytics scraping is now handled at startup only
    
    addDetailedActivity(`❤️ Liking the tweet...`, 'info');
    await likeTweet(tweet); // Like the tweet after successful reply
    
  } else if (success === 'skip') {
    // ⚠️ SKIP: AI couldn't generate quality reply - don't count against limit
    sessionStats.skipped++;
    console.log(`⚠️ TWEET SKIPPED: Not counting against daily limit (${sessionStats.skipped} total skipped)`);
    addDetailedActivity(`⚠️ Tweet skipped - not counted against daily limit (${sessionStats.skipped} total)`, 'warning');
    // ✅ CRITICAL: Do NOT increment sessionStats.processed (no limit decrement)
    // ✅ CRITICAL: Do NOT increment sessionStats.failed (this isn't a technical failure)
    // Simply move on to next tweet without affecting processed counter
    
  } else {
    // ❌ FAILURE: Technical failure (network, UI issues, etc.)
    sessionStats.failed++;
    sessionStats.retryAttempts++;
    updateStatus(`❌ Failed to process reply for tweet ${sessionStats.processed} (Attempt ${sessionStats.retryAttempts}).`);
    addDetailedActivity(`❌ Failed to process tweet ${sessionStats.processed} (Attempt ${sessionStats.retryAttempts})`, 'error');
    
    // If we've failed too many times in a row, add extra delay
    if (sessionStats.retryAttempts >= 3) {
      console.log('⚠️ Multiple consecutive failures detected. Adding extra delay...');
      addDetailedActivity(`⚠️ Multiple failures detected. Adding safety delay...`, 'warning');
      await sleep(3000); // Optimized delay after failures
    }
  }
  
  await saveSession();
  performanceMonitor.endTweetProcessing(); // 🚀 End performance tracking
  
  // 🚀 ARCHITECTURAL FIX: Apply delay AFTER successful OR skipped tweet processing
  // This ensures delay happens after every tweet attempt (success or skip), not just successes
  if (sessionStats.isRunning && sessionStats.processed < sessionStats.target && (success === true || success === 'skip')) {
    console.log('🔍 DEBUG: APPLYING DELAY INSIDE processNextTweet');
    const delay = calculateSmartDelay();
    console.log(`⏰ ARCHITECTURAL FIX: Applying ${Math.round(delay/1000)}s delay before next tweet...`);
    addDetailedActivity(`⏰ ARCHITECTURAL FIX: Waiting ${Math.round(delay/1000)}s before next tweet`, 'info');
    
    // Store timeout reference for force stop capability
    window.boldtakeTimeout = setTimeout(() => {
      window.boldtakeTimeout = null;
    }, delay);
    
    await startCountdown(delay);
  }
  
  return true; // Indicate a tweet was processed
}

/**
 * Finds the reply text area using multiple, robust selectors with retries.
 * @returns {Promise<HTMLElement|null>} The found text area element or null.
 */
async function findReplyTextArea(timeoutMs = 18000) {
  console.log('🔍 STUCK MODAL DETECTOR: Searching for reply text area...');
  addDetailedActivity('🔍 Searching for reply text area with timeout protection', 'info');
  
  const startTime = Date.now();
  const selectors = [
    '[data-testid="tweetTextarea_0"]', // Primary selector
    'div.public-DraftEditor-content[role="textbox"]', // Stable fallback
    'div[aria-label="Tweet text"]', // Accessibility fallback
    'div[aria-label="Post text"]', // Alternative accessibility fallback
    'div[contenteditable="true"][role="textbox"]', // Generic contenteditable
    '.public-DraftEditor-content' // Class-based fallback
  ];
  
  // 🔧 TIMEOUT PROTECTION: Wrap entire search in timeout
  return new Promise(async (resolve) => {
    const timeoutId = setTimeout(async () => {
      console.warn('🚨 STUCK MODAL DETECTED: Text area not found within timeout');
      addDetailedActivity('🚨 STUCK MODAL: Text area search timed out - attempting escape', 'error');
      
      // 🚨 GRACEFUL ESCAPE SEQUENCE
      await attemptModalEscape();
      resolve(null);
    }, timeoutMs);
    
    try {
      // Performance optimization: cache successful selector
      const cachedSelector = sessionStorage.getItem('boldtake_textarea_selector');
      if (cachedSelector) {
        const textarea = document.querySelector(cachedSelector);
        if (textarea && isTextAreaValid(textarea)) {
          console.log(`✅ Found text area with cached selector: ${cachedSelector}`);
          addDetailedActivity('✅ Found text area with cached selector', 'success');
          clearTimeout(timeoutId);
          resolve(textarea);
          return;
        } else {
          sessionStorage.removeItem('boldtake_textarea_selector');
        }
      }
      
      // 🔍 PROGRESSIVE SEARCH: Try primary selector first with increasing delays
      const primarySelector = '[data-testid="tweetTextarea_0"]';
      
      // Quick attempts (0-3 seconds)
      for (let i = 0; i < 10 && (Date.now() - startTime) < 3000; i++) {
        const textarea = document.querySelector(primarySelector);
        if (textarea && isTextAreaValid(textarea)) {
          console.log(`✅ Found text area with primary selector (attempt ${i+1})`);
          addDetailedActivity('✅ Found text area quickly', 'success');
          sessionStorage.setItem('boldtake_textarea_selector', primarySelector);
          clearTimeout(timeoutId);
          resolve(textarea);
          return;
        }
        
        // Modal focus trigger on 3rd attempt
        if (i === 2) {
          await attemptModalFocus();
        }
        
        await sleep(200); // Optimized typing delay
      }
      
      // 🔧 FALLBACK SEARCH: Try all selectors with recovery attempts (3-15 seconds)
      let recoveryAttempts = 0;
      while ((Date.now() - startTime) < (timeoutMs - 3000)) { // Leave 3s for escape
        for (const selector of selectors) {
          if ((Date.now() - startTime) >= (timeoutMs - 3000)) break;
          
          const textarea = document.querySelector(selector);
          if (textarea && isTextAreaValid(textarea)) {
            console.log(`✅ Found text area with selector: ${selector}`);
            addDetailedActivity('✅ Found text area with fallback selector', 'success');
            sessionStorage.setItem('boldtake_textarea_selector', selector);
            clearTimeout(timeoutId);
            resolve(textarea);
            return;
          }
        }
        
        // Recovery attempts every 3 seconds
        if (recoveryAttempts < 3 && (Date.now() - startTime) > (recoveryAttempts + 1) * 3000) {
          recoveryAttempts++;
          console.log(`🔧 Recovery attempt ${recoveryAttempts}/3: Modal focus & refresh`);
          addDetailedActivity(`🔧 Modal recovery attempt ${recoveryAttempts}/3`, 'warning');
          await attemptModalFocus();
        }
        
        await sleep(300); // Optimized recovery delay
      }
      
      // If we reach here, timeout will trigger
      
    } catch (error) {
      console.error('🚨 Error during text area search:', error);
      addDetailedActivity(`🚨 Text area search error: ${error.message}`, 'error');
      clearTimeout(timeoutId);
      await attemptModalEscape();
      resolve(null);
    }
  });
}

/**
 * 🔧 HELPER: Validate if text area is actually usable
 */
function isTextAreaValid(textarea) {
  return textarea && 
         textarea.offsetParent !== null && 
         textarea.getBoundingClientRect().width > 0 &&
         !textarea.disabled &&
         getComputedStyle(textarea).display !== 'none';
}

/**
 * 🔧 HELPER: Attempt to focus modal and trigger text area
 */
async function attemptModalFocus() {
  try {
    // Method 1: Focus modal dialog
    const modal = document.querySelector('[role="dialog"]');
    if (modal) {
      modal.click();
      await sleep(200);
    }
    
    // Method 2: Focus any existing text area
    const existingTextArea = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (existingTextArea) {
      existingTextArea.focus();
      await sleep(200);
    }
    
    // Method 3: Press Tab to potentially activate text area
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    await sleep(200);
    
  } catch (error) {
    console.log('Modal focus attempt failed (non-critical):', error.message);
  }
}

/**
 * 🚨 GRACEFUL ESCAPE: Close stuck modal and skip tweet
 */
async function attemptModalEscape() {
  console.log('🚨 EXECUTING GRACEFUL ESCAPE SEQUENCE...');
  addDetailedActivity('🚨 Executing modal escape sequence', 'warning');
  
  try {
    // Method 1: Try close button
    const closeButton = document.querySelector('[data-testid="app-bar-close"], [aria-label="Close"]');
    if (closeButton) {
      console.log('🔧 Escape Method 1: Clicking close button');
      closeButton.click();
      await sleep(1000);
      return;
    }
    
    // Method 2: ESC key simulation
    console.log('🔧 Escape Method 2: Sending ESC key');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', bubbles: true }));
    await sleep(1000);
    
    // Method 3: Click outside modal (backdrop)
    const backdrop = document.querySelector('[data-testid="mask"]');
    if (backdrop) {
      console.log('🔧 Escape Method 3: Clicking backdrop');
      backdrop.click();
      await sleep(1000);
    }
    
    // Method 4: Focus body and ESC again
    document.body.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(500);
    
    addDetailedActivity('✅ Modal escape sequence completed', 'success');
    
  } catch (error) {
    console.error('❌ Modal escape failed:', error);
    addDetailedActivity(`❌ Modal escape failed: ${error.message}`, 'error');
  }
}

/**
 * 🔐 LOGIN STATE MONITOR: Check if user is still logged into X.com
 * @returns {boolean} True if logged in, false if logged out
 */
async function checkLoginState() {
  try {
    console.log('🔐 Checking login state...');
    
    // Method 1: Check for main "Post" button (primary indicator)
    const postButton = document.querySelector('[data-testid="SideNav_NewTweet_Button"], [data-testid="tweetButtonInline"]');
    if (postButton) {
      return true; // User is logged in
    }
    
    // Method 2: Check for user avatar/profile picture
    const userAvatar = document.querySelector('[data-testid="AppTabBar_Profile_Link"], [data-testid="DashButton_ProfileIcon_Link"]');
    if (userAvatar) {
      return true; // User is logged in
    }
    
    // Method 3: Check for navigation elements that require login
    const homeNav = document.querySelector('[data-testid="AppTabBar_Home_Link"]');
    const notificationsNav = document.querySelector('[data-testid="AppTabBar_Notifications_Link"]');
    if (homeNav && notificationsNav) {
      return true; // User is logged in
    }
    
    // Method 4: Check for compose tweet area
    const composeArea = document.querySelector('[data-testid="toolBar"], [role="textbox"][placeholder*="happening"], [placeholder*="What is happening"]');
    if (composeArea) {
      return true; // User is logged in
    }
    
    // Method 5: Check URL patterns that indicate logged-in state
    const currentUrl = window.location.href;
    if (currentUrl.includes('/home') || currentUrl.includes('/notifications') || currentUrl.includes('/messages')) {
      // These pages require login, but double-check with DOM elements
      const loggedInElements = document.querySelectorAll('[data-testid*="tweet"], [data-testid*="SideNav"]');
      if (loggedInElements.length > 0) {
        return true;
      }
    }
    
    // Method 6: Check for logout indicators
    const loginButton = document.querySelector('[data-testid="loginButton"], [href="/login"]');
    const signUpButton = document.querySelector('[data-testid="signupButton"], [href="/signup"]');
    if (loginButton || signUpButton) {
      console.warn('🔐 Login/signup buttons detected - user appears to be logged out');
      return false; // User is logged out
    }
    
    // Method 7: Check for "Sign in" text or login prompts
    const bodyText = document.body.textContent || '';
    const logoutIndicators = [
      'Sign in to X',
      'Log in to Twitter', 
      'Create your account',
      'Join X today',
      'Sign up now'
    ];
    
    for (const indicator of logoutIndicators) {
      if (bodyText.includes(indicator)) {
        console.warn(`🔐 Logout indicator found: "${indicator}"`);
        return false; // User is logged out
      }
    }
    
    // If we can't determine state clearly, assume logged in but log warning
    console.warn('🔐 Login state unclear - assuming logged in (may need manual verification)');
    return true;
    
  } catch (error) {
    console.error('🔐 Error checking login state:', error);
    // If error checking, assume logged in to avoid false positives
    return true;
  }
}

/**
 * 🚧 OBSTRUCTION DETECTOR: Check for unexpected popups, modals, and overlays
 * @returns {Object|null} Obstruction details or null if none detected
 */
async function detectPageObstructions() {
  try {
    console.log('🚧 Scanning for page obstructions...');
    
    // 1. CAPTCHA DETECTION
    const captchaIndicators = [
      'div[data-testid*="captcha"]',
      'div[class*="captcha"]', 
      'iframe[src*="captcha"]',
      'div[class*="challenge"]',
      '[aria-label*="captcha"]',
      '[aria-label*="verification"]'
    ];
    
    for (const selector of captchaIndicators) {
      const element = document.querySelector(selector);
      if (element && element.offsetParent !== null) {
        return {
          type: 'CAPTCHA',
          message: 'CAPTCHA verification required',
          element: element
        };
      }
    }
    
    // 2. RATE LIMIT WARNINGS
    const rateLimitSelectors = [
      'div[data-testid*="error"]',
      'div[data-testid*="banner"]',
      'div[role="alert"]'
    ];
    
    for (const selector of rateLimitSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent || '';
        const rateLimitKeywords = [
          'rate limit',
          'too many requests',
          'temporarily restricted',
          'account limited',
          'suspended',
          'try again later',
          'request looks like it might be automated',
          'protect our users from spam',
          'malicious activity',
          'privacy related extensions may cause issues',
          'something went wrong'
        ];
        
        for (const keyword of rateLimitKeywords) {
          if (text.toLowerCase().includes(keyword)) {
            return {
              type: 'RATE_LIMIT',
              message: `Rate limit warning detected: ${text.substring(0, 100)}`,
              element: element
            };
          }
        }
      }
    }
    
    // 3. UNEXPECTED MODAL DETECTION
    const modalSelectors = [
      'div[role="dialog"]',
      'div[data-testid*="modal"]',
      'div[class*="modal"]',
      'div[aria-modal="true"]'
    ];
    
    for (const selector of modalSelectors) {
      const modals = document.querySelectorAll(selector);
      for (const modal of modals) {
        if (modal.offsetParent !== null) {
          const modalText = modal.textContent || '';
          
          // Skip known good modals (reply modal, etc.)
          const knownGoodModals = [
            'tweetTextarea',
            'reply',
            'post your reply',
            'what is happening'
          ];
          
          const isKnownGood = knownGoodModals.some(keyword => 
            modalText.toLowerCase().includes(keyword)
          );
          
          if (!isKnownGood && modalText.length > 20) {
            // Check for problematic modal types
            const problematicKeywords = [
              'verify you',
              'confirm your',
              'review our',
              'terms of service',
              'privacy policy',
              'new features',
              'tour',
              'welcome to',
              'getting started',
              'phone number',
              'email verification'
            ];
            
            for (const keyword of problematicKeywords) {
              if (modalText.toLowerCase().includes(keyword)) {
                return {
                  type: 'UNEXPECTED_MODAL',
                  message: `Unexpected modal detected: ${modalText.substring(0, 50)}...`,
                  element: modal
                };
              }
            }
          }
        }
      }
    }
    
    // 4. OVERLAY DETECTION (full screen overlays)
    const overlaySelectors = [
      'div[style*="position: fixed"]',
      'div[style*="z-index"]',
      'div[data-testid*="overlay"]',
      'div[class*="overlay"]'
    ];
    
    for (const selector of overlaySelectors) {
      const overlays = document.querySelectorAll(selector);
      for (const overlay of overlays) {
        if (overlay.offsetParent !== null) {
          const rect = overlay.getBoundingClientRect();
          const isFullScreen = rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.8;
          
          if (isFullScreen) {
            const overlayText = overlay.textContent || '';
            
            // Skip known good overlays
            if (!overlayText.toLowerCase().includes('tweet') && 
                !overlayText.toLowerCase().includes('reply') &&
                overlayText.length > 10) {
              return {
                type: 'FULLSCREEN_OVERLAY',
                message: `Full-screen overlay detected: ${overlayText.substring(0, 50)}...`,
                element: overlay
              };
            }
          }
        }
      }
    }
    
    // 5. PAGE ERROR DETECTION (only for actual page errors, not API errors)
    const pageText = document.body.textContent || '';
    
    // 🎯 CRITICAL FIX: Only detect ACTUAL page errors, not API/network errors
    // Check if we're on an actual error page (title, main content, etc.)
    const pageTitle = document.title || '';
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
    const mainText = mainContent ? mainContent.textContent || '' : '';
    
    // Only trigger if it's a clear page-level error (not just API errors in console)
    const isActualPageError = (
      pageTitle.includes('404') || 
      pageTitle.includes('Page not found') ||
      pageTitle.includes('Something went wrong') ||
      mainText.includes('This page doesn\'t exist') ||
      mainText.includes('Sorry, that page doesn\'t exist') ||
      (mainText.includes('Something went wrong') && mainText.length < 500) // Short error page
    );
    
    // 🚀 ENHANCED: Also check if we can still find tweets (if yes, page is working)
    const tweetsStillVisible = document.querySelectorAll('[data-testid="tweet"]').length > 0;
    
    if (isActualPageError && !tweetsStillVisible) {
      return {
        type: 'PAGE_ERROR',
        message: `Actual page error detected: ${pageTitle || 'Page error'}`,
        element: document.body
      };
    }
    
    // 6. BLOCKED CONTENT WARNINGS
    const blockedKeywords = [
      'This content is not available',
      'Tweet unavailable',
      'Account suspended',
      'Profile unavailable'
    ];
    
    for (const keyword of blockedKeywords) {
      if (pageText.includes(keyword)) {
        return {
          type: 'BLOCKED_CONTENT',
          message: `Content blocked: ${keyword}`,
          element: document.body
        };
      }
    }
    
    return null; // No obstructions detected
    
  } catch (error) {
    console.error('🚧 Error detecting obstructions:', error);
    return null; // Don't trigger false positives on errors
  }
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
    console.error('❌ Could not find tweet text area. Modal stuck - attempting recovery...');
    addDetailedActivity('🔄 Modal stuck - attempting recovery', 'warning');
    
    // ENHANCED RECOVERY: Try multiple recovery methods
    try {
      // Method 1: Try to close modal first
      const closeButton = document.querySelector('[data-testid="app-bar-close"]');
      if (closeButton) {
        closeButton.click();
        await sleep(1000);
      }
      
      // Method 2: Press Escape key
      document.body.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true
      }));
      await sleep(1000);
      
      // Method 3: Close modal and skip tweet instead of refresh
      console.log('🔄 All recovery methods failed - skipping tweet...');
      addDetailedActivity('🔄 Modal stuck - skipping this tweet', 'warning');
      return 'skip';
    } catch (error) {
      console.error('Recovery failed:', error);
      addDetailedActivity('❌ Modal recovery failed - skipping tweet', 'error');
      return 'skip';
    }
    
    return false;
  }

    // Step 2: Generate the smart reply
  const tweetText = originalTweet.textContent || '';
  addDetailedActivity(`🤖 Generating AI reply...`, 'info');
  const replyText = await generateSmartReply(tweetText, sessionStats.processed);
  
  // 🎯 SPECIAL CASE: Daily limit reached - session already stopped gracefully
  if (replyText === 'DAILY_LIMIT_REACHED') {
    console.log('📊 DAILY LIMIT REACHED: Session stopped gracefully');
    await gracefullyCloseModal();
    return 'daily_limit_reached'; // Special return value for daily limit
  }
  
  // 🔄 RETRY-THEN-SKIP: Handle null response (skip tweet)
  if (!replyText) {
    console.log('⚠️ SKIPPING TWEET: AI could not generate quality reply after 2 attempts');
    addDetailedActivity('⚠️ SKIPPING TWEET: No quality reply after 2 attempts', 'warning');
    await gracefullyCloseModal();
    // ✅ CRITICAL: Return 'skip' to signal tweet should be skipped (no limit decrement) 
    return 'skip';
  }
  
  addDetailedActivity(`✅ AI reply generated successfully`, 'success');

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
  addDetailedActivity(`🚀 Sending reply...`, 'info');
  const sent = await sendReplyWithKeyboard();

  if (sent) {
    // Step 5: Confirm the modal has closed
    addDetailedActivity(`⏳ Waiting for reply to post...`, 'info');
    const closed = await waitForModalToClose();
    if (closed) {
      console.log('✅ Reply modal closed successfully.');
      sessionStats.lastAction = '✅ Reply modal closed successfully';
      addDetailedActivity(`✅ Reply posted successfully!`, 'success');
      return true;
    } else {
      console.error('❌ Reply modal did not close after sending.');
      addDetailedActivity(`❌ Reply modal failed to close`, 'error');
      return false;
    }
  } else {
    console.error('❌ Sending reply failed.');
    addDetailedActivity(`❌ Failed to send reply`, 'error');
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

async function findTweet() {
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
    
    // Check if tweet is already liked (means we already replied to it)
    const unlikeButton = tweet.querySelector('[data-testid="unlike"]');
    if (unlikeButton) {
      console.log('💚 Skipping already liked tweet (already replied)');
      tweet.setAttribute('data-boldtake-processed', 'true');
      continue;
    }
    
    // CRITICAL: Check for reply restrictions (new Twitter feature)
    const replyButton = tweet.querySelector('[data-testid="reply"]');
    if (replyButton && replyButton.getAttribute('aria-label') && 
        replyButton.getAttribute('aria-label').includes('can reply')) {
      console.log('🚫 Skipping tweet with reply restrictions (mentioned users only)');
      addDetailedActivity('🚫 Skipped tweet with reply restrictions', 'warning');
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
  
  // Start periodic network health checks
  startNetworkHealthChecks();
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
  // Check network every 30 seconds
  networkMonitor.networkCheckInterval = setInterval(async () => {
    await performNetworkHealthCheck();
  }, 30000);
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
  
  // Check for X.com error pages that require refresh
  if (detectXcomErrorPage()) {
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
      addDetailedActivity(`🔍 Network check failed: ${error.message}`, 'warning');
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
  // Check for common X.com error messages
  const errorIndicators = [
    'Something went wrong',
    'let\'s give it another shot',
    'Some privacy related extensions may cause issues',
    'Try again'
  ];
  
  const pageText = document.body?.textContent || '';
  return errorIndicators.some(indicator => pageText.includes(indicator));
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
    
    addDetailedActivity(`📊 Analytics scraped: ${analyticsData.totalImpressions} impressions`, 'success');
    
    return analyticsData;
    
  } catch (error) {
    console.error('Analytics scraping error:', error);
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
    console.error('CSV generation error:', error);
    addDetailedActivity('❌ CSV export failed', 'error');
    return null;
  }
}

/**
 * Handle X.com page errors by returning to search page with filters
 */
async function handleXcomPageError() {
  addDetailedActivity('🔄 X.com page error detected - recovering to search page', 'warning');
  
  // 🔧 CRITICAL FIX: Return to search page, not current error page
  
  // Priority 1: Use saved search URL from session if available
  let recoveryUrl = null;
  
  // Check if we have a saved search URL from network monitor
  if (networkMonitor.lastActiveUrl && 
      networkMonitor.lastActiveUrl.includes('search?q=') && 
      !networkMonitor.lastActiveUrl.includes('explore')) {
    recoveryUrl = networkMonitor.lastActiveUrl;
    addDetailedActivity('📍 Using saved search URL with filters', 'info');
  }
  
  // Priority 2: Try to extract keyword from current URL or session
  if (!recoveryUrl) {
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuery = urlParams.get('q');
    
    if (currentQuery && !window.location.href.includes('explore')) {
      recoveryUrl = window.location.href;
      addDetailedActivity('📍 Using current search URL', 'info');
    }
  }
  
  // Priority 3: Build new search URL from stored keyword rotation
  if (!recoveryUrl && keywordRotation.keywords && keywordRotation.keywords.length > 0) {
    const currentKeyword = keywordRotation.keywords[keywordRotation.currentIndex] || keywordRotation.keywords[0];
    const baseUrl = 'https://x.com/search?q=';
    
    // Get user's min_faves setting from storage or use default
    let minFaves = '500'; // Default
    try {
      const stored = await new Promise(resolve => {
        chrome.storage.local.get(['boldtake_min_faves'], resolve);
      });
      minFaves = stored.boldtake_min_faves || '500';
    } catch (e) {
      console.log('Using default min_faves');
    }
    
    recoveryUrl = `${baseUrl}${encodeURIComponent(currentKeyword)}%20min_faves%3A${minFaves}%20lang%3Aen&src=typed_query&f=live`;
    addDetailedActivity(`📍 Building search URL for keyword: "${currentKeyword}"`, 'info');
  }
  
  // Priority 4: Fallback to X.com home if no search context
  if (!recoveryUrl) {
    recoveryUrl = 'https://x.com/home';
    addDetailedActivity('📍 No search context found - going to home', 'warning');
  }
  
  // Wait before navigation to avoid rapid redirects
  addDetailedActivity(`🔄 Navigating to recovery URL in 3 seconds...`, 'info');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log(`🔧 ERROR RECOVERY: Navigating from ${window.location.href} to ${recoveryUrl}`);
  window.location.href = recoveryUrl;
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
    
    // 🔧 CRITICAL FIX: Smart URL recovery with keyword preservation
    let recoveryUrl = null;
    
    // Priority 1: Use saved search URL if it's valid
    if (networkMonitor.lastActiveUrl && 
        networkMonitor.lastActiveUrl.includes('search?q=') && 
        !networkMonitor.lastActiveUrl.includes('explore')) {
      recoveryUrl = networkMonitor.lastActiveUrl;
      addDetailedActivity('📍 Using saved search URL with filters', 'info');
    }
    
    // Priority 2: Build search URL from keyword rotation if available
    else if (keywordRotation.keywords && keywordRotation.keywords.length > 0) {
      const currentKeyword = keywordRotation.keywords[keywordRotation.currentIndex] || keywordRotation.keywords[0];
      const baseUrl = 'https://x.com/search?q=';
      
      // Get user's min_faves setting
      let minFaves = '500';
      try {
        const stored = await new Promise(resolve => {
          chrome.storage.local.get(['boldtake_min_faves'], resolve);
        });
        minFaves = stored.boldtake_min_faves || '500';
      } catch (e) {
        console.log('Using default min_faves for recovery');
      }
      
      recoveryUrl = `${baseUrl}${encodeURIComponent(currentKeyword)}%20min_faves%3A${minFaves}%20lang%3Aen&src=typed_query&f=live`;
      addDetailedActivity(`📍 Building recovery URL for keyword: "${currentKeyword}"`, 'info');
    }
    
    // Priority 3: Fallback to home if no search context
    else {
      recoveryUrl = 'https://x.com/home';
      addDetailedActivity('📍 No search context - returning to home', 'warning');
    }
    
    addDetailedActivity('🔄 Returning to search page...', 'info');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`🔧 SESSION RECOVERY: Navigating to ${recoveryUrl}`);
    window.location.href = recoveryUrl;
    
  } catch (error) {
    addDetailedActivity(`❌ Recovery failed: ${error.message}`, 'error');
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
  addDetailedActivity(`🔴 Network error in ${context}: ${error.message}`, 'error');
  
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
                    addDetailedActivity(`⏳ Waiting ${minutes}:${paddedSeconds} before next tweet`, 'info');
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
 * 🔄 RETRY-THEN-SKIP SYSTEM: Generates AI replies with automatic retry and smart skipping
 * Implements "Retry, then Skip" approach instead of generic fallbacks for better quality
 * @param {string} tweetText - The full text of the tweet to reply to.
 * @param {number} tweetNumber - The current count of processed tweets in the session.
 * @returns {Promise<string|null>} A high-quality reply or null to skip this tweet.
 */
async function generateSmartReply(tweetText, tweetNumber) {
  // Initialize consecutiveFailures counter if not exists
  if (typeof sessionStats.consecutiveFailures === 'undefined') {
    sessionStats.consecutiveFailures = 0;
  }

  // --- EMERGENCY STOP: 3 consecutive skips triggers session halt ---
  if (sessionStats.consecutiveFailures >= 3) {
    const errorMsg = 'Session paused due to multiple consecutive AI failures. Please check your network or try again in a few minutes.';
    console.error(`🚨 EMERGENCY STOP: ${errorMsg}`);
    addDetailedActivity(`🚨 EMERGENCY STOP: ${errorMsg}`, 'error');
    showStatus(`🚨 EMERGENCY STOP: Multiple AI failures detected`);
    sessionStats.isRunning = false;
    chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
    return null;
  }

  // Get personalization settings for language and tone
  const personalization = await getPersonalizationSettings();
  const selectedPrompt = await selectBestPrompt(tweetText);
  debugLog(`🎯 AI Strategy Selected: ${selectedPrompt.name}`);
  addDetailedActivity(`🔄 Using ${selectedPrompt.name} strategy`, 'info');
  
  // Update status to show current strategy with personalization
  const langDisplay = personalization.language !== 'english' ? ` (${personalization.language})` : '';
  showStatus(`🎯 Tweet ${sessionStats.attempted + 1} (${sessionStats.processed}/${sessionStats.target} successful) - ${selectedPrompt.name}${langDisplay}`);

  // Build enhanced prompt with language and tone
  const enhancedPrompt = buildEnhancedPrompt(selectedPrompt.template, tweetText, personalization);

  // 🔄 ATTEMPT 1: First try with selected strategy
  console.log('🎯 ATTEMPT 1: Trying with selected strategy...');
  let reply = await attemptGeneration(enhancedPrompt, tweetText);
  
  // 🎯 SPECIAL CASE: Daily limit reached - stop immediately, don't retry
  if (reply === 'DAILY_LIMIT_REACHED') {
    return 'DAILY_LIMIT_REACHED';
  }
  
  // Clean up AI artifacts
  if (reply) {
    reply = reply.replace(/—/g, '-');
  }

  // Check if first attempt succeeded
  const firstAttemptSuccess = reply && isContentSafe(reply) && reply.length >= 15;
  
  if (firstAttemptSuccess) {
    console.log('✅ ATTEMPT 1 SUCCESS: High-quality reply generated');
    addDetailedActivity('✅ First attempt successful', 'success');
    sessionStats.consecutiveFailures = 0; // Reset failure counter on success
    return reply;
  }

  // 🔄 ATTEMPT 2: Retry with safer "Engagement Indie Voice" strategy
  console.warn('⚠️ First attempt failed. Retrying with safer strategy...');
  addDetailedActivity('⚠️ First attempt failed. Retrying...', 'warning');
  
  // Get the safer "Engagement Indie Voice" prompt directly
  const saferPrompt = await getSelectedPromptVariation("Engagement Indie Voice");
  const saferEnhancedPrompt = buildEnhancedPrompt(saferPrompt.template, tweetText, personalization);
  
  console.log('🎯 ATTEMPT 2: Trying with safer Engagement Indie Voice strategy...');
  let retryReply = await attemptGeneration(saferEnhancedPrompt, tweetText);
  
  // Clean up AI artifacts
  if (retryReply) {
    retryReply = retryReply.replace(/—/g, '-');
  }

  // Check if retry attempt succeeded
  const retrySuccess = retryReply && isContentSafe(retryReply) && retryReply.length >= 15;
  
  if (retrySuccess) {
    console.log('✅ ATTEMPT 2 SUCCESS: Retry generated quality reply');
    addDetailedActivity('✅ Retry attempt successful', 'success');
    sessionStats.consecutiveFailures = 0; // Reset failure counter on success
    return retryReply;
  }

  // 🔄 ATTEMPT 3: Final attempt with ultra-safe generic engagement prompt
  console.warn('⚠️ Second attempt failed. Trying final ultra-safe attempt...');
  addDetailedActivity('⚠️ Second attempt failed. Final try...', 'warning');
  
  // Ultra-safe fallback prompt that almost always works
  const ultraSafePrompt = `You are replying to a tweet. Write a thoughtful, engaging reply that adds value to the conversation. Keep it under 200 characters. Be authentic and conversational. Do not use quotes, hashtags, mentions, or emojis.

Tweet: {TWEET}

Reply with just the response text:`;
  
  console.log('🎯 ATTEMPT 3: Trying with ultra-safe fallback strategy...');
  let finalReply = await attemptGeneration(ultraSafePrompt, tweetText);
  
  // Clean up AI artifacts
  if (finalReply) {
    finalReply = finalReply.replace(/—/g, '-');
  }

  // Check if final attempt succeeded
  const finalSuccess = finalReply && isContentSafe(finalReply) && finalReply.length >= 10; // Lower threshold for final attempt
  
  if (finalSuccess) {
    console.log('✅ ATTEMPT 3 SUCCESS: Final attempt generated reply');
    addDetailedActivity('✅ Final attempt successful', 'success');
    sessionStats.consecutiveFailures = 0; // Reset failure counter on success
    return finalReply;
  }

  // 🚫 SKIP TWEET: All three attempts failed - skip this tweet entirely
  sessionStats.consecutiveFailures++; // Increment consecutive failure counter
  console.warn(`❌ Failed to generate reply for this tweet after 3 attempts. Skipping. (${sessionStats.consecutiveFailures}/3 consecutive failures)`);
  addDetailedActivity(`❌ Skipping tweet after 3 failed attempts (${sessionStats.consecutiveFailures}/3)`, 'error');
  
  // ✅ CRITICAL: Do NOT decrement daily limit for skipped tweets
  // ✅ CRITICAL: Do NOT post any reply
  // ✅ CRITICAL: Return null to signal "skip this tweet"
  
  return null; // This signals to skip the tweet entirely
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
      tweetContext: {
        originalText: tweetText,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        strategy: promptTemplate.name || 'Unknown'
      }
    });

    if (response.error) {
      console.error(`Error from background script: ${response.error}`);
      sessionStats.lastApiError = response.error; // Store the specific error
      
      // 🎯 SPECIAL HANDLING: Daily limit reached is not a failure, it's a limit
      if (response.error.includes('Daily reply limit reached')) {
        console.log('📊 DAILY LIMIT REACHED: Triggering graceful limit UI');
        addDetailedActivity('📊 Daily limit reached - showing limit screen', 'info');
        
        // Stop the session gracefully and show limit reached UI
        sessionStats.isRunning = false;
        chrome.runtime.sendMessage({ type: 'BOLDTAKE_STOP' });
        chrome.runtime.sendMessage({ 
          type: 'DAILY_LIMIT_REACHED',
          limit: sessionStats.target || 125 // Pass the daily limit for display
        });
        
        return 'DAILY_LIMIT_REACHED'; // Special return value
      }
      
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
      console.log(`🎯 Content match: ${contentMatchStrategy} (${currentPercentage.toFixed(1)}% vs ${targetPercentage}% target)`);
      addDetailedActivity(`🎯 Content match: ${contentMatchStrategy} - ${selectedPrompt.variationName}`, 'info');
    } else {
      console.log(`⚠️ ${contentMatchStrategy} BLOCKED - over limit (${currentPercentage.toFixed(1)}% vs ${targetPercentage}%), forcing variety`);
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
      console.log(`🚀 First tweet: Using ${randomStrategy} for strong start`);
      addDetailedActivity(`🚀 First tweet: Using ${randomStrategy} - ${selectedPrompt.variationName}`, 'success');
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
              console.log(`📊 Weighted selection: ${chosenStrategy.name} (${((strategyRotation.usageCount[chosenStrategy.name] || 0) / totalTweets * 100).toFixed(1)}% vs ${chosenStrategy.targetWeight}% target)`);
              addDetailedActivity(`📊 Weighted: ${chosenStrategy.name} - ${selectedPrompt.variationName} (${((strategyRotation.usageCount[chosenStrategy.name] || 0) / totalTweets * 100).toFixed(1)}%)`, 'info');
            }
            break;
          }
        }
        
        // Safety check: if weighted selection failed, use first under-target strategy
        if (!selectedPrompt && underTargetStrategies.length > 0) {
          selectedPrompt = await getSelectedPromptVariation(underTargetStrategies[0].name);
          console.log(`🔧 Fallback: Using ${underTargetStrategies[0].name} (weighted selection failed)`);
        }
      } else {
        // All strategies at target - use least used
        const leastUsedCount = Math.min(...Object.values(strategyRotation.usageCount));
        const leastUsedStrategyNames = Object.keys(strategyRotation.usageCount).filter(name => 
          strategyRotation.usageCount[name] === leastUsedCount
        );
        const randomStrategyName = leastUsedStrategyNames[Math.floor(Math.random() * leastUsedStrategyNames.length)];
        selectedPrompt = await getSelectedPromptVariation(randomStrategyName);
        console.log(`⚖️ All targets met: Using least used ${selectedPrompt.name}`);
      }
    }
  }

  // CRITICAL: Ultimate fallback - ensure we always have a strategy
  if (!selectedPrompt) {
    selectedPrompt = await getSelectedPromptVariation("Engagement Indie Voice"); // Default to first strategy
    console.log('🚨 EMERGENCY FALLBACK: Using first available strategy');
  }

  // Validate selectedPrompt has required properties
  if (!selectedPrompt || !selectedPrompt.name || !selectedPrompt.template) {
    console.error('❌ CRITICAL ERROR: Invalid selectedPrompt:', selectedPrompt);
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
    console.log('📊 Strategy Usage Stats:', strategyRotation.usageCount);
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
- 150-200 characters maximum
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
- 150-200 characters maximum
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
- 150-200 characters maximum
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
- 150-200 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
- 200-250 characters maximum
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
  
  // 🔄 RETRY-THEN-SKIP: Calculate advanced metrics including skips
  const successRate = Math.round((sessionStats.successful / sessionStats.attempted) * 100) || 0;
  const skipRate = Math.round((sessionStats.skipped / sessionStats.attempted) * 100) || 0;
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
  console.log(`🔄 Attempted: ${sessionStats.attempted} tweets`);
  console.log(`✅ Successful: ${sessionStats.successful}`);
  console.log(`⚠️ Skipped: ${sessionStats.skipped} (AI couldn't generate quality replies)`);
  console.log(`❌ Failed: ${sessionStats.failed}`);
  console.log(`📊 Success Rate: ${successRate}% (${sessionStats.successful}/${sessionStats.attempted})`);
  console.log(`🚫 Skip Rate: ${skipRate}% (${sessionStats.skipped}/${sessionStats.attempted})`);
  console.log(`⚡ Tweets/Hour: ${tweetsPerHour}`);
  console.log(`⏱️ Avg Time/Tweet: ${avgTimePerTweet}s`);
  console.log(`🎭 Strategy Usage: ${strategyStats}`);
  
  // 🔄 RETRY-THEN-SKIP: Enhanced status message with skip statistics
  const summaryMessage = `🎬 Session Complete!\n` +
    `✅ ${sessionStats.successful}/${sessionStats.target} tweets (${successRate}%)\n` +
    `⚠️ ${sessionStats.skipped} skipped due to AI issues\n` +
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
  
  console.log(`🔍 Extracted from URL - minFaves: ${minFaves}, lang: ${lang}`);
  
  const baseUrl = 'https://x.com/search?q=';
  const newUrl = `${baseUrl}${encodeURIComponent(newKeyword)}%20min_faves%3A${minFaves}%20lang%3A${lang}&src=typed_query&f=live`;
  
  console.log(`🔄 Rotating with preserved settings: min_faves:${minFaves}, lang:${lang}`);
  
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
  
  console.log('🧪 Strategy Selection Test:');
  console.log('Test tweet:', testTweet);
  console.log('Has achievement pattern:', hasAchievementPattern);
  console.log('Has negative context:', hasNegativeContext);
  console.log('Has political pattern:', hasPoliticalPattern);
  
  // Expected: Should select Counter strategy (political), NOT Shout-Out (due to negative context)
  if (hasAchievementPattern && !hasNegativeContext) {
    console.log('✅ Test Result: Would select Shout-Out strategy');
  } else if (hasPoliticalPattern) {
    console.log('✅ Test Result: Would select Counter strategy (correct!)');
  } else {
    console.log('❌ Test Result: Would select rotation strategy');
  }
}

// Run test if in debug mode
if (DEBUG_MODE) {
  setTimeout(testStrategySelection, 1000);
}

debugLog('🔥 BoldTake Professional content script loaded and ready!');
