/**
 * BoldTake v5.0 - BULLETPROOF STATE MACHINE
 * Eliminates infinite loops, guarantees progress, handles 100+ replies
 */

// 🎯 FINITE STATE MACHINE - BULLETPROOF ARCHITECTURE
class BulletproofStateMachine {
  constructor() {
    this.currentState = 'IDLE';
    this.stateStartTime = Date.now();
    this.recoveryStack = [];
    this.progressTracker = {
      totalAttempts: 0,
      successfulReplies: 0,
      consecutiveFailures: 0,
      lastProgressTime: Date.now(),
      sessionStartTime: Date.now()
    };
    
    // Circuit breaker to prevent system overload
    this.circuitBreaker = {
      failureCount: 0,
      lastFailureTime: 0,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      threshold: 5,
      timeout: 600000 // 10 minutes
    };
    
    // Adaptive difficulty based on progress
    this.difficultyLevel = 'EASY';
    this.adaptiveSystem = {
      strategies: ['stealth', 'conservative', 'aggressive'],
      currentStrategy: 'conservative',
      lastAdaptation: Date.now()
    };
    
    this.initializeStateMachine();
  }
  
  // 🛡️ STATE DEFINITIONS WITH GUARANTEED TIMEOUTS
  get STATE_TIMEOUTS() {
    return {
      IDLE: 5000,          // 5s max in idle
      SEARCHING: 30000,    // 30s max to find tweets
      PROCESSING: 60000,   // 60s max to process a tweet  
      REPLYING: 120000,    // 2min max to complete reply
      COOLDOWN: 15000,     // 15s cooldown between actions
      ERROR: 10000,        // 10s max in error state
      STUCK: 5000,         // 5s max in stuck state
      CIRCUIT_OPEN: 600000 // 10min circuit breaker
    };
  }
  
  // 🎯 DIFFICULTY SCALING FOR 100+ REPLIES
  get DIFFICULTY_LEVELS() {
    return {
      EASY: {     // Replies 1-20
        minFaves: 100,
        maxRetries: 3,
        timeout: 60000,
        cooldown: 15000
      },
      MEDIUM: {   // Replies 21-50  
        minFaves: 200,
        maxRetries: 2,
        timeout: 90000,
        cooldown: 30000
      },
      HARD: {     // Replies 51-100
        minFaves: 500,
        maxRetries: 1,
        timeout: 120000,
        cooldown: 60000
      },
      EXPERT: {   // Replies 100+
        minFaves: 1000,
        maxRetries: 1,
        timeout: 180000,
        cooldown: 120000
      }
    };
  }
  
  // 🚀 INITIALIZE STATE MACHINE
  initializeStateMachine() {
    // Set up automatic state timeout protection
    this.stateTimeoutInterval = setInterval(() => {
      this.checkStateTimeout();
    }, 1000);
    
    // Set up progress monitoring
    this.progressInterval = setInterval(() => {
      this.checkProgress();
    }, 30000);
    
    // Set up adaptive learning
    this.adaptiveInterval = setInterval(() => {
      this.adaptStrategy();
    }, 60000);
    
    sessionLog('🛡️ Bulletproof State Machine initialized', 'success');
  }
  
  // 🔄 GUARANTEED STATE TRANSITIONS
  transitionTo(newState, context = {}) {
    const previousState = this.currentState;
    const transitionTime = Date.now();
    
    // Log transition for debugging
    this.recoveryStack.push({
      from: previousState,
      to: newState,
      timestamp: transitionTime,
      context: context,
      duration: transitionTime - this.stateStartTime
    });
    
    // Keep only last 50 transitions
    if (this.recoveryStack.length > 50) {
      this.recoveryStack = this.recoveryStack.slice(-50);
    }
    
    this.currentState = newState;
    this.stateStartTime = transitionTime;
    
    sessionLog(`🔄 State: ${previousState} → ${newState}`, 'info');
    
    // Set automatic timeout for new state
    this.setStateTimeout(newState);
    
    // Execute state-specific logic
    this.executeStateLogic(newState, context);
  }
  
  // ⏰ STATE TIMEOUT PROTECTION
  setStateTimeout(state) {
    const timeout = this.STATE_TIMEOUTS[state];
    if (timeout) {
      setTimeout(() => {
        if (this.currentState === state) {
          this.handleStateTimeout(state);
        }
      }, timeout);
    }
  }
  
  // 🚨 HANDLE STATE TIMEOUTS
  handleStateTimeout(state) {
    sessionLog(`⏰ State timeout: ${state} (${this.STATE_TIMEOUTS[state]}ms)`, 'warning');
    
    switch (state) {
      case 'SEARCHING':
        this.transitionTo('ERROR', { reason: 'Search timeout', recovery: 'retry_search' });
        break;
      case 'PROCESSING':
        this.transitionTo('ERROR', { reason: 'Processing timeout', recovery: 'skip_tweet' });
        break;
      case 'REPLYING':
        this.transitionTo('ERROR', { reason: 'Reply timeout', recovery: 'abort_reply' });
        break;
      case 'ERROR':
        this.transitionTo('COOLDOWN', { reason: 'Error timeout', recovery: 'force_cooldown' });
        break;
      case 'STUCK':
        this.forceResetToIdle('Stuck state timeout');
        break;
      default:
        this.transitionTo('IDLE', { reason: 'Generic timeout' });
    }
  }
  
  // 🔍 CHECK STATE TIMEOUT
  checkStateTimeout() {
    const stateAge = Date.now() - this.stateStartTime;
    const maxAge = this.STATE_TIMEOUTS[this.currentState];
    
    if (maxAge && stateAge > maxAge) {
      this.handleStateTimeout(this.currentState);
    }
  }
  
  // 📊 PROGRESS MONITORING
  checkProgress() {
    const timeSinceProgress = Date.now() - this.progressTracker.lastProgressTime;
    
    // CRITICAL: If no progress for 5 minutes, force reset
    if (timeSinceProgress > 300000) {
      this.forceResetToIdle('No progress for 5 minutes');
      return;
    }
    
    // Check circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceFailure > this.circuitBreaker.timeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        sessionLog('🔄 Circuit breaker HALF_OPEN - attempting recovery', 'info');
      }
    }
  }
  
  // 🎯 ADAPTIVE STRATEGY SYSTEM
  adaptStrategy() {
    const { totalAttempts, successfulReplies } = this.progressTracker;
    
    if (totalAttempts < 5) return; // Need data to adapt
    
    const successRate = successfulReplies / totalAttempts;
    const timeSinceAdaptation = Date.now() - this.adaptiveSystem.lastAdaptation;
    
    // Only adapt every 5 minutes
    if (timeSinceAdaptation < 300000) return;
    
    let newStrategy = this.adaptiveSystem.currentStrategy;
    
    if (successRate < 0.3) {
      newStrategy = 'stealth';    // Ultra conservative
      this.difficultyLevel = 'EASY';
    } else if (successRate > 0.8) {
      newStrategy = 'aggressive'; // Push harder
      this.updateDifficultyLevel();
    } else {
      newStrategy = 'conservative'; // Balanced
    }
    
    if (newStrategy !== this.adaptiveSystem.currentStrategy) {
      this.adaptiveSystem.currentStrategy = newStrategy;
      this.adaptiveSystem.lastAdaptation = Date.now();
      sessionLog(`🧠 Strategy adapted: ${newStrategy} (success rate: ${Math.round(successRate * 100)}%)`, 'info');
    }
  }
  
  // 📈 UPDATE DIFFICULTY LEVEL
  updateDifficultyLevel() {
    const replies = this.progressTracker.successfulReplies;
    
    if (replies >= 100) {
      this.difficultyLevel = 'EXPERT';
    } else if (replies >= 51) {
      this.difficultyLevel = 'HARD';
    } else if (replies >= 21) {
      this.difficultyLevel = 'MEDIUM';
    } else {
      this.difficultyLevel = 'EASY';
    }
  }
  
  // 🔄 CIRCUIT BREAKER METHODS
  shouldAttemptAction() {
    if (this.circuitBreaker.state === 'OPEN') {
      sessionLog('🔴 Circuit breaker OPEN - skipping action', 'warning');
      return false;
    }
    return true;
  }
  
  recordSuccess() {
    this.progressTracker.successfulReplies++;
    this.progressTracker.totalAttempts++;
    this.progressTracker.consecutiveFailures = 0;
    this.progressTracker.lastProgressTime = Date.now();
    
    // Reset circuit breaker on success
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failureCount = 0;
      sessionLog('✅ Circuit breaker CLOSED - system recovered', 'success');
    }
    
    this.updateDifficultyLevel();
  }
  
  recordFailure(reason = 'Unknown') {
    this.progressTracker.totalAttempts++;
    this.progressTracker.consecutiveFailures++;
    
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
      sessionLog(`🔴 Circuit breaker OPEN - too many failures (${reason})`, 'error');
      this.transitionTo('CIRCUIT_OPEN', { reason: reason });
    }
  }
  
  // 🚨 FORCE RESET TO IDLE (NUCLEAR OPTION)
  forceResetToIdle(reason) {
    sessionLog(`🚨 FORCE RESET: ${reason}`, 'error');
    
    // Clear all timeouts and intervals
    this.clearAllTimers();
    
    // Reset state
    this.currentState = 'IDLE';
    this.stateStartTime = Date.now();
    
    // Add to recovery stack
    this.recoveryStack.push({
      from: 'UNKNOWN',
      to: 'IDLE',
      timestamp: Date.now(),
      context: { reason: reason, type: 'FORCE_RESET' }
    });
    
    // Restart state machine
    this.initializeStateMachine();
  }
  
  // 🧹 CLEANUP
  clearAllTimers() {
    if (this.stateTimeoutInterval) {
      clearInterval(this.stateTimeoutInterval);
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    if (this.adaptiveInterval) {
      clearInterval(this.adaptiveInterval);
    }
  }
  
  // 🎯 STATE-SPECIFIC LOGIC
  executeStateLogic(state, context) {
    switch (state) {
      case 'IDLE':
        this.handleIdleState(context);
        break;
      case 'SEARCHING':
        this.handleSearchingState(context);
        break;
      case 'PROCESSING':
        this.handleProcessingState(context);
        break;
      case 'REPLYING':
        this.handleReplyingState(context);
        break;
      case 'COOLDOWN':
        this.handleCooldownState(context);
        break;
      case 'ERROR':
        this.handleErrorState(context);
        break;
      case 'CIRCUIT_OPEN':
        this.handleCircuitOpenState(context);
        break;
    }
  }
  
  // 🎯 STATE HANDLERS (TO BE IMPLEMENTED)
  handleIdleState(context) {
    // Start next action if circuit breaker allows
    if (this.shouldAttemptAction()) {
      setTimeout(() => {
        if (this.currentState === 'IDLE') {
          this.transitionTo('SEARCHING', { trigger: 'auto_start' });
        }
      }, 2000);
    }
  }
  
  handleSearchingState(context) {
    // This will be integrated with existing tweet search logic
    sessionLog('🔍 Searching for tweets...', 'info');
  }
  
  handleProcessingState(context) {
    // This will be integrated with existing tweet processing logic
    sessionLog('⚙️ Processing tweet...', 'info');
  }
  
  handleReplyingState(context) {
    // This will be integrated with existing reply logic
    sessionLog('💬 Generating reply...', 'info');
  }
  
  handleCooldownState(context) {
    const cooldownTime = this.DIFFICULTY_LEVELS[this.difficultyLevel].cooldown;
    sessionLog(`⏸️ Cooldown for ${cooldownTime/1000}s`, 'info');
    
    setTimeout(() => {
      if (this.currentState === 'COOLDOWN') {
        this.transitionTo('IDLE', { trigger: 'cooldown_complete' });
      }
    }, cooldownTime);
  }
  
  handleErrorState(context) {
    const { reason, recovery } = context;
    sessionLog(`❌ Error: ${reason} - Recovery: ${recovery}`, 'warning');
    
    // Implement recovery logic based on recovery type
    setTimeout(() => {
      if (this.currentState === 'ERROR') {
        this.transitionTo('COOLDOWN', { trigger: 'error_recovery' });
      }
    }, 5000);
  }
  
  handleCircuitOpenState(context) {
    sessionLog('🔴 Circuit breaker open - system cooling down', 'error');
    // Just wait for circuit breaker to reset automatically
  }
  
  // 📊 GET CURRENT STATUS
  getStatus() {
    return {
      state: this.currentState,
      stateAge: Date.now() - this.stateStartTime,
      progress: this.progressTracker,
      circuitBreaker: this.circuitBreaker,
      difficulty: this.difficultyLevel,
      strategy: this.adaptiveSystem.currentStrategy
    };
  }
}

// 🚀 GLOBAL STATE MACHINE INSTANCE
window.BulletproofStateMachine = BulletproofStateMachine;
