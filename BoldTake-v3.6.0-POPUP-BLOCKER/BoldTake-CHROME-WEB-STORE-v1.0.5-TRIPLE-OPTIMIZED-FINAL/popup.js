/**
 * BoldTake Professional - Popup Script
 * Enhanced with BoldTake Brand Kit Design
 */

// Stealth mode - minimal popup logging
const DEBUG_MODE = false;
const debugLog = DEBUG_MODE ? console.log : () => {};

debugLog('🚀 BoldTake Professional popup loaded');

// Authentication state
let isAuthenticated = false;
let currentUser = null;

// DOM Elements
let startBtn, stopBtn, sessionStatus, successfulCount, successRate;
let keywordInput, minFavesInput, liveStatus, activityFeed;
let settingsBtn, analyticsBtn, roadmapBtn, settingsPanel, analyticsPanel, roadmapPanel;
let languageSelect, toneSelect;
let nicheSelect, suggestedKeywords;

// Authentication elements
let loginForm, emailInput, passwordInput, loginBtn, loginError;
let mainContent, logoutBtn;

// Settings Elements
let dailyTargetInput;

// Custom Prompt Elements (removed)

// Comprehensive Keyword Suggestions by Niche
const NICHE_KEYWORDS = {
    fitness: {
        title: 'Fitness & Health',
        description: 'Target health-conscious audiences with fitness, nutrition, and wellness content',
        keywords: ['fitness', 'workout', 'nutrition', 'health', 'wellness', 'exercise', 'diet', 'training', 'mental health', 'lifestyle']
    },
    tech: {
        title: 'Technology & AI',
        description: 'Engage with tech enthusiasts, developers, and AI innovators',
        keywords: ['AI', 'technology', 'software', 'coding', 'machine learning', 'blockchain', 'cybersecurity', 'automation', 'startup', 'innovation']
    },
    business: {
        title: 'Business & Entrepreneurship', 
        description: 'Connect with entrepreneurs, founders, and business leaders',
        keywords: ['startup', 'entrepreneur', 'business', 'founder', 'leadership', 'strategy', 'growth', 'venture', 'investment', 'innovation']
    },
    finance: {
        title: 'Finance & Investing',
        description: 'Reach investors, traders, and financial advisors',
        keywords: ['investment', 'finance', 'trading', 'stocks', 'crypto', 'portfolio', 'wealth', 'money', 'market', 'economy']
    },
    marketing: {
        title: 'Marketing & Growth',
        description: 'Target marketers, growth hackers, and brand builders',
        keywords: ['marketing', 'growth', 'branding', 'content', 'SEO', 'social media', 'advertising', 'conversion', 'sales', 'customer']
    },
    lifestyle: {
        title: 'Lifestyle & Wellness',
        description: 'Connect with lifestyle influencers and wellness enthusiasts',
        keywords: ['lifestyle', 'wellness', 'mindfulness', 'productivity', 'motivation', 'self care', 'minimalism', 'happiness', 'balance', 'mindset']
    },
    education: {
        title: 'Education & Learning',
        description: 'Engage with educators, students, and lifelong learners',
        keywords: ['education', 'learning', 'skills', 'development', 'coaching', 'teaching', 'knowledge', 'training', 'online course', 'study']
    },
    travel: {
        title: 'Travel & Adventure',
        description: 'Reach travel enthusiasts and adventure seekers',
        keywords: ['travel', 'adventure', 'vacation', 'explore', 'wanderlust', 'backpacking', 'culture', 'tourism', 'destination', 'journey']
    },
    food: {
        title: 'Food & Cooking',
        description: 'Connect with food lovers, chefs, and cooking enthusiasts',
        keywords: ['food', 'cooking', 'recipe', 'chef', 'cuisine', 'restaurant', 'foodie', 'nutrition', 'baking', 'culinary']
    },
    gaming: {
        title: 'Gaming & Entertainment',
        description: 'Engage with gamers and entertainment enthusiasts',
        keywords: ['gaming', 'esports', 'streamer', 'entertainment', 'video games', 'twitch', 'content creator', 'streaming', 'gamer', 'game dev']
    }
};

// Analytics Elements
let totalCommentsAllTime, commentsToday, avgEngagement, bestStreak;
let commentHistoryList, analyticsInsights, clearHistoryBtn;

// Activity log storage
let activityLog = [];
let activityUpdatesPaused = false;
let totalActivityEvents = 0;

/**
 * Get language code for X.com search URL
 * @param {string} language - The language name
 * @returns {string} The language code for X.com
 */
function getLanguageCode(language) {
    const languageCodes = {
        'english': 'en',
        'spanish': 'es',
        'french': 'fr',
        'german': 'de',
        'italian': 'it',
        'portuguese': 'pt',
        'chinese_simplified': 'zh',
        'chinese_traditional': 'zh-tw',
        'japanese': 'ja',
        'korean': 'ko',
        'arabic': 'ar',
        'russian': 'ru',
        'hindi': 'hi',
        'dutch': 'nl',
        'swedish': 'sv',
        'norwegian': 'no',
        'danish': 'da',
        'finnish': 'fi',
        'polish': 'pl',
        'turkish': 'tr',
        'greek': 'el',
        'hebrew': 'he',
        'thai': 'th',
        'vietnamese': 'vi',
        'indonesian': 'id',
        'malay': 'ms',
        'filipino': 'tl',
        'czech': 'cs',
        'slovak': 'sk',
        'hungarian': 'hu',
        'romanian': 'ro',
        'bulgarian': 'bg',
        'croatian': 'hr',
        'serbian': 'sr',
        'ukrainian': 'uk',
        'lithuanian': 'lt',
        'latvian': 'lv',
        'estonian': 'et'
    };
    
    return languageCodes[language?.toLowerCase()] || 'en';
}

// --- Standalone Authentication Functions ---

/**
 * Check authentication status on popup load
 */
async function checkAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });
    
    if (response && response.success && response.isAuthenticated) {
      // Check if session is expired
      if (response.session && response.session._expired) {
        console.warn('🔄 Session expired, showing re-authentication form');
        isAuthenticated = false;
        currentUser = null;
        showLoginForm('Your session has expired. Please sign in again to continue.');
        return;
      }
      
      isAuthenticated = true;
      currentUser = response.user;
      showMainContent();
    } else {
      isAuthenticated = false;
      currentUser = null;
      showLoginForm();
    }
  } catch (error) {
    console.error('❌ Error checking auth status:', error);
    showLoginForm();
  }
}

/**
 * Show login form
 */
function showLoginForm() {
  // Hide main content
  const mainContent = document.querySelector('.content');
  if (mainContent) {
    mainContent.style.display = 'none';
  }
  
  // Create or show login form
  let loginContainer = document.getElementById('login-container');
  if (!loginContainer) {
    loginContainer = createLoginForm();
    document.body.appendChild(loginContainer);
  } else {
    loginContainer.style.display = 'flex';
  }
}

/**
 * Show main content
 */
function showMainContent() {
  // Hide login form
  const loginContainer = document.getElementById('login-container');
  if (loginContainer) {
    loginContainer.style.display = 'none';
  }
  
  // Show main content
  const mainContent = document.querySelector('.content');
  if (mainContent) {
    mainContent.style.display = 'block';
  }
  
  // Update user info if available
  if (currentUser) {
    updateUserInfo();
  }
}

/**
 * Create login form
 */
function createLoginForm() {
  const loginContainer = document.createElement('div');
  loginContainer.id = 'login-container';
  loginContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #111827, #1F2937);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    z-index: 1000;
  `;
  
  loginContainer.innerHTML = `
    <div style="text-align: center; color: white; max-width: 350px; width: 100%;">
      <div style="margin-bottom: 2rem;">
        <h1 style="font-size: 1.8rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, #34D399, #10B981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700;">
          BoldTake
        </h1>
        <p style="color: #9CA3AF; font-size: 0.9rem;">Sign in to your account</p>
      </div>
      
      <div style="background: #1F2937; padding: 1.5rem; border-radius: 1rem; border: 1px solid #374151;">
        <input type="email" id="login-email" placeholder="Email address" 
          style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #374151; border-radius: 0.5rem; background: #111827; color: white; font-size: 0.9rem; outline: none;">
        
        <input type="password" id="login-password" placeholder="Password"
          style="width: 100%; padding: 0.75rem; margin-bottom: 1.5rem; border: 1px solid #374151; border-radius: 0.5rem; background: #111827; color: white; font-size: 0.9rem; outline: none;">
        
        <button id="login-submit" 
          style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #34D399, #10B981); border: none; border-radius: 0.5rem; color: white; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.3s ease;">
          Sign In
        </button>
        
        <div id="login-error" style="color: #EF4444; margin-top: 1rem; text-align: center; display: none; font-size: 0.8rem;"></div>
      </div>
    </div>
  `;
  
  // Add event listeners
  const submitBtn = loginContainer.querySelector('#login-submit');
  const emailInput = loginContainer.querySelector('#login-email');
  const passwordInput = loginContainer.querySelector('#login-password');
  
  submitBtn.addEventListener('click', handleLogin);
  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  
  return loginContainer;
}

/**
 * Handle login form submission
 */
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorDiv = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  
  // Validation
  if (!email || !password) {
    showLoginError('Please enter both email and password');
    return;
  }
  
  // Show loading
  submitBtn.textContent = 'Signing in...';
  submitBtn.disabled = true;
  errorDiv.style.display = 'none';
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SIGN_IN',
      email: email,
      password: password
    });
    
    if (response && response.success) {
      console.log('✅ Login successful');
      isAuthenticated = true;
      currentUser = response.user;
      showMainContent();
    } else {
      showLoginError(response?.error || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    showLoginError('Login failed: ' + error.message);
  } finally {
    submitBtn.textContent = 'Sign In';
    submitBtn.disabled = false;
  }
}

/**
 * Show login error
 */
function showLoginError(message) {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'SIGN_OUT' });
    
    if (response && response.success) {
      isAuthenticated = false;
      currentUser = null;
      showLoginForm();
    }
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}

/**
 * Update user info in main content
 */
function updateUserInfo() {
  // This can be expanded to show user email, subscription status, etc.
  if (currentUser && currentUser.email) {
    console.log('👤 Logged in as:', currentUser.email);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    await checkAuthStatus();
    
    // Then initialize popup if authenticated
    if (isAuthenticated) {
        debugLog('📱 Initializing BoldTake Professional interface...');
    
    // Get DOM elements
    startBtn = document.getElementById('start-button');
    stopBtn = document.getElementById('stop-button');
    sessionStatus = document.getElementById('sessionStatus');
    successfulCount = document.getElementById('successfulCount');
    successRate = document.getElementById('successRate');
    keywordInput = document.getElementById('keyword-input');
    minFavesInput = document.getElementById('min-faves-input');
    liveStatus = document.getElementById('liveStatus');
    activityFeed = document.getElementById('activityFeed');
    settingsBtn = document.getElementById('settings-button');
    analyticsBtn = document.getElementById('analytics-button');
    roadmapBtn = document.getElementById('roadmap-button');
    settingsPanel = document.getElementById('settings-panel');
    analyticsPanel = document.getElementById('analytics-panel');
    roadmapPanel = document.getElementById('roadmap-panel');
    
    // Analytics elements
    totalCommentsAllTime = document.getElementById('totalCommentsAllTime');
    commentsToday = document.getElementById('commentsToday');
    avgEngagement = document.getElementById('avgEngagement');
    bestStreak = document.getElementById('bestStreak');
    commentHistoryList = document.getElementById('commentHistoryList');
    analyticsInsights = document.getElementById('analyticsInsights');
    clearHistoryBtn = document.getElementById('clearHistory');
    
    // Personalization elements
    languageSelect = document.getElementById('language-select');
    toneSelect = document.getElementById('tone-select');
    
    // Keyword suggestions elements
    nicheSelect = document.getElementById('niche-select');
    suggestedKeywords = document.getElementById('suggested-keywords');
    
    // Settings elements
    dailyTargetInput = document.getElementById('daily-target-input');
    
    // Prompt Library elements
    const promptSelects = {
        'Engagement Indie Voice': document.getElementById('indie-voice-select'),
        'Engagement Spark Reply': document.getElementById('spark-reply-select'),
        'Engagement The Counter': document.getElementById('counter-select'),
        'The Riff': document.getElementById('riff-select'),
        'The Viral Shot': document.getElementById('viral-shot-select'),
        'The Shout-Out': document.getElementById('shout-out-select')
    };
    const resetPromptsBtn = document.getElementById('reset-prompts-btn');
    
    // Load saved settings including personalization, prompt preferences, and filtering options
    chrome.storage.local.get([
        'boldtake_keyword', 
        'boldtake_min_faves', 
        'boldtake_language', 
        'boldtake_tone',
        'boldtake_timing_range',
        'boldtake_prompt_preferences',
        'boldtake_exclude_links_media',
        'boldtake_prioritize_questions',
        'boldtake_min_char_count',
        'boldtake_spam_keywords',
        'boldtake_negative_keywords'
    ], (result) => {
        if (result.boldtake_keyword) {
            keywordInput.value = result.boldtake_keyword;
        }
        if (result.boldtake_min_faves) {
            minFavesInput.value = result.boldtake_min_faves;
        }
        // Load language preference (restrict to English only for current tier)
        if (result.boldtake_language) {
            if (result.boldtake_language === 'english') {
                languageSelect.value = result.boldtake_language;
            } else {
                languageSelect.value = 'english'; // Force English for current tier
                debugLog('🚫 Language restricted to English for current tier');
            }
        }
        if (result.boldtake_tone) {
            toneSelect.value = result.boldtake_tone;
        }
        
        // Load timing preference (restrict to allowed options)
        const timingSelect = document.getElementById('timing-range');
        if (result.boldtake_timing_range && timingSelect) {
            const allowedTimings = ['60-300', '120-600']; // Safe and Stealth only
            if (allowedTimings.includes(result.boldtake_timing_range)) {
                timingSelect.value = result.boldtake_timing_range;
            } else {
                timingSelect.value = '60-300'; // Default to Safe
            }
        }
        
        // Load advanced filtering settings
        if (result.boldtake_exclude_links_media !== undefined) {
            document.getElementById('exclude-links-media').checked = result.boldtake_exclude_links_media;
        }
        if (result.boldtake_prioritize_questions !== undefined) {
            document.getElementById('prioritize-questions').checked = result.boldtake_prioritize_questions;
        }
        if (result.boldtake_min_char_count) {
            document.getElementById('min-char-count').value = result.boldtake_min_char_count;
        }
        if (result.boldtake_spam_keywords) {
            document.getElementById('spam-keywords').value = result.boldtake_spam_keywords;
        }
        if (result.boldtake_negative_keywords) {
            document.getElementById('negative-keywords').value = result.boldtake_negative_keywords;
        }
    });
    
    // Set up event listeners
    startBtn.addEventListener('click', startSession);
    stopBtn.addEventListener('click', stopSession);
    
    // CRITICAL SAFETY: Stop button ALWAYS enabled for panic stops
    stopBtn.disabled = false;
    stopBtn.classList.remove('btn-disabled');
    settingsBtn.addEventListener('click', toggleSettings);
    analyticsBtn.addEventListener('click', toggleAnalytics);
    roadmapBtn.addEventListener('click', toggleRoadmap);
    clearHistoryBtn.addEventListener('click', clearCommentHistory);
    
    // Set up keyword chip listeners
    document.querySelectorAll('.keyword-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            keywordInput.value = chip.dataset.keyword;
        });
    });
    
    // Set up personalization listeners with premium restrictions
    languageSelect.addEventListener('change', (e) => {
        // Prevent selection of disabled options
        if (e.target.selectedOptions[0].disabled) {
            e.target.value = 'english'; // Reset to English
            debugLog('🚫 Premium feature: Language selection restricted to English for current tier');
            return;
        }
        savePersonalizationSettings();
    });
    
    toneSelect.addEventListener('change', savePersonalizationSettings);
    
    // Set up timing restrictions
    const timingSelect = document.getElementById('timing-range');
    if (timingSelect) {
        timingSelect.addEventListener('change', (e) => {
            // Prevent selection of disabled options
            if (e.target.selectedOptions[0].disabled) {
                e.target.value = '60-300'; // Reset to Safe
                debugLog('🚫 Premium feature: Advanced timing options restricted to current tier');
                return;
            }
            // Save timing preference if valid
            chrome.storage.local.set({ 'boldtake_timing_range': e.target.value });
            debugLog('⏱️ Timing range updated:', e.target.value);
        });
    }
    
    // Set up advanced filtering listeners
    document.getElementById('exclude-links-media').addEventListener('change', saveFilteringSettings);
    document.getElementById('prioritize-questions').addEventListener('change', saveFilteringSettings);
    document.getElementById('min-char-count').addEventListener('change', saveFilteringSettings);
    document.getElementById('spam-keywords').addEventListener('change', saveFilteringSettings);
    document.getElementById('negative-keywords').addEventListener('change', saveFilteringSettings);
    
    // Set up keyword suggestions listener
    nicheSelect.addEventListener('change', handleNicheSelection);
    
    // Set up Main Tabs Navigation
    setupTabNavigation();
    
    // Set up Quick Start Guide listeners
    const dismissGuideBtn = document.getElementById('dismiss-guide');
    const quickSettingsBtn = document.getElementById('quick-settings-btn');
    const quickStartGuide = document.getElementById('quick-start-guide');
    
    if (dismissGuideBtn) {
        dismissGuideBtn.addEventListener('click', () => {
            quickStartGuide.classList.add('hidden');
            // Save preference to not show again
            chrome.storage.local.set({ boldtake_hide_quick_guide: true });
            debugLog('🚫 Quick start guide dismissed permanently');
        });
    }
    
    if (quickSettingsBtn) {
        quickSettingsBtn.addEventListener('click', () => {
            // Open settings panel
            toggleSettings();
            // Hide the quick start guide
            quickStartGuide.classList.add('hidden');
            // Save preference
            chrome.storage.local.set({ boldtake_hide_quick_guide: true });
            debugLog('⚡ Quick setup opened, guide hidden');
        });
    }
    
    // Set up prompt library listeners
    Object.entries(promptSelects).forEach(([strategyName, selectElement]) => {
        if (selectElement) {
            selectElement.addEventListener('change', (e) => {
                savePromptPreference(strategyName, e.target.value);
            });
        }
    });
    
    // Set up reset prompts button
    if (resetPromptsBtn) {
        resetPromptsBtn.addEventListener('click', resetPromptPreferences);
    }
    
    // Load prompt preferences
    loadPromptPreferences();
    
    // Keyword rotation removed - using simple single keyword now
    
    // Load current session state and analytics
    await loadSessionState();
    await loadAnalyticsData();
    
    // Auto-trigger analytics scraping on startup (once per session)
    triggerAnalyticsScrapingOnStartup();
    
    // Check if Quick Start Guide should be shown
    const result = await chrome.storage.local.get(['boldtake_hide_quick_guide']);
    if (result.boldtake_hide_quick_guide && quickStartGuide) {
        quickStartGuide.classList.add('hidden');
        debugLog('🚫 Quick start guide hidden per user preference');
    }
    
    // AUTO-OPEN SETTINGS for better UX - help users get started immediately
    const shouldAutoOpenSettings = await checkIfShouldAutoOpenSettings();
    if (shouldAutoOpenSettings) {
        toggleSettings(); // Open settings panel
        debugLog('🎯 Auto-opened settings for new user experience');
    }
    
    // Custom prompt functionality removed
    
    // Set up periodic updates
    setInterval(loadSessionState, 2000);
    setInterval(loadAnalyticsData, 5000); // Update analytics every 5 seconds // Update every 2 seconds
    
    // Setup activity controls
    setupActivityControls();
    
        debugLog('✅ BoldTake Professional popup ready!');
    }
});

/**
 * Setup activity control buttons and functionality
 */
function setupActivityControls() {
    const pauseBtn = document.getElementById('pauseActivityBtn');
    const clearBtn = document.getElementById('clearActivityBtn');
    const exportBtn = document.getElementById('exportActivityBtn');
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            activityUpdatesPaused = !activityUpdatesPaused;
            pauseBtn.textContent = activityUpdatesPaused ? '▶️' : '⏸️';
            pauseBtn.title = activityUpdatesPaused ? 'Resume Activity Updates' : 'Pause Activity Updates';
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            activityLog = [];
            updateActivityFeed();
            updateActivityStats();
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportActivityLog);
    }
    
    // Update activity stats initially
    updateActivityStats();
}

/**
 * Export activity log to clipboard
 */
function exportActivityLog() {
    const timestamp = new Date().toISOString();
    const logText = `BoldTake Activity Log - ${timestamp}\n\n` + 
        activityLog.map(item => `[${item.timestamp}] ${item.message}`).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
        // Show temporary success message
        const exportBtn = document.getElementById('exportActivityBtn');
        const originalText = exportBtn.textContent;
        exportBtn.textContent = '✅';
        setTimeout(() => {
            exportBtn.textContent = originalText;
        }, 1000);
    }).catch(err => {
        console.error('Failed to copy activity log:', err);
    });
}

/**
 * Update activity statistics display
 */
function updateActivityStats() {
    const countElement = document.getElementById('activityCount');
    const updateElement = document.getElementById('lastUpdate');
    
    if (countElement) {
        countElement.textContent = `${activityLog.length} events`;
    }
    
    if (updateElement && activityLog.length > 0) {
        const lastActivity = activityLog[0]; // Most recent is first
        updateElement.textContent = `Last: ${lastActivity.timestamp}`;
    } else if (updateElement) {
        updateElement.textContent = 'Never';
    }
}

/**
 * Check if settings should auto-open for better UX
 */
async function checkIfShouldAutoOpenSettings() {
    return new Promise(resolve => {
        chrome.storage.local.get(['boldtake_keyword', 'boldtake_first_time'], (result) => {
            // Auto-open if:
            // 1. No keyword is set (new user)
            // 2. First time flag is not set
            // 3. Keyword is empty or default
            const hasKeyword = result.boldtake_keyword && result.boldtake_keyword.trim() && result.boldtake_keyword !== 'startup';
            const isFirstTime = !result.boldtake_first_time;
            
            if (!hasKeyword || isFirstTime) {
                // Mark as not first time anymore
                chrome.storage.local.set({ boldtake_first_time: true });
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

/**
 * Starts a new BoldTake automation session
 */
async function startSession() {
    debugLog('🎬 Starting BoldTake session...');
    
    try {
        // SMART DEFAULTS: Make it easy for users - just click and go!
        let keyword = keywordInput.value.trim();
        let minFaves = minFavesInput.value;

        // Default keyword if none provided
        if (!keyword) {
            // Check if user has rotation keywords, use first one
            if (rotationKeywords && rotationKeywords.length > 0) {
                keyword = rotationKeywords[0].keyword;
                debugLog('🎯 Using first rotation keyword:', keyword);
            } else {
                // Use popular default keyword
                keyword = 'startup';
                debugLog('🎯 Using default keyword: startup');
            }
        }

        // Default engagement if none provided
        if (!minFaves || minFaves === '') {
            minFaves = '500'; // Sweet spot for quality engagement
            debugLog('🎯 Using default engagement: 500+ likes');
        }

        // Auto-fill the inputs so user can see what's being used
        keywordInput.value = keyword;
        minFavesInput.value = minFaves;
        
        // Update UI to show starting state
        startBtn.disabled = true;
        startBtn.innerHTML = '<div class="loading"></div>Launching...';
        
        // Save settings and set the flag to auto-start the session
        await chrome.storage.local.set({
            boldtake_keyword: keyword,
            boldtake_min_faves: minFaves,
            isNewSession: true
        });

        // Construct the ENHANCED search URL with "Broad Net" filters
        const languageCode = getLanguageCode(languageSelect?.value || 'english');
        
        // Get current filtering settings
        const excludeLinksMedia = document.getElementById('exclude-links-media')?.checked ?? true;
        
        // ENHANCED QUERY: Use X.com's built-in filters as first line of defense
        const broadNetFilters = [];
        
        if (excludeLinksMedia) {
            broadNetFilters.push('-filter:links');        // Exclude tweets with links (often spam/promotional)
            broadNetFilters.push('-filter:media');        // Exclude tweets with media (focus on text discussions)
        }
        
        // Always exclude these for quality
        broadNetFilters.push('-filter:replies');      // Exclude reply threads (focus on original content)
        broadNetFilters.push('-filter:retweets');     // Exclude retweets (focus on original thoughts)
        
        const filtersString = broadNetFilters.length > 0 ? '%20' + broadNetFilters.join('%20') : '';
        const enhancedQuery = `${encodeURIComponent(keyword)}%20min_faves%3A${minFaves}%20lang%3A${languageCode}${filtersString}`;
        const searchURL = `https://x.com/search?q=${enhancedQuery}&src=typed_query&f=live`;
        
        debugLog('🎯 Enhanced query:', enhancedQuery);

        // Find an existing X.com tab or create a new one
        chrome.tabs.query({ url: "*://x.com/*" }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.update(tabs[0].id, { url: searchURL });
            } else {
                chrome.tabs.create({ url: searchURL });
            }
        });

        updateSessionStatus('Launching session...', 'status-running');
        setTimeout(() => window.close(), 800); // Close popup after launching
        
    } catch (error) {
        debugLog('💥 Error starting session:', error);
        showAlert('Error starting session. Please try again.');
        resetStartButton();
    }
}

/**
 * Stops the current BoldTake automation session
 */
async function stopSession() {
    console.log('🛑 Stopping BoldTake session...');
    
    try {
        // Update UI to show stopping state
        stopBtn.disabled = true;
        stopBtn.innerHTML = '<div class="loading"></div>Stopping...';
        
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Send stop message to content script
        chrome.tabs.sendMessage(tab.id, { type: 'BOLDTAKE_STOP' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Content script not available, session likely already stopped');
            }
            updateUIForStoppedSession();
        });
        
    } catch (error) {
        console.error('💥 Error stopping session:', error);
        updateUIForStoppedSession(); // Still update UI
    }
}

/**
 * Loads and displays current session state
 */
async function loadSessionState() {
    try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Skip if not on X.com
        if (!tab.url.includes('x.com') && !tab.url.includes('twitter.com')) {
            updateUIForWrongSite();
            return;
        }
        
        // Request session stats from content script
        chrome.tabs.sendMessage(tab.id, { type: 'GET_SESSION_STATS' }, (response) => {
            if (chrome.runtime.lastError) {
                // Content script might not be loaded yet
                return;
            }
            
            if (response && response.stats) {
                updateSessionDisplay(response.stats);
            }
        });
        
    } catch (error) {
        // Silently handle errors
        console.log('📊 Content script not ready yet...');
    }
}

/**
 * Updates the session statistics display
 * @param {Object} stats - Session statistics
 */
function updateSessionDisplay(stats) {
    // Update counters
    successfulCount.textContent = stats.successful || 0;
    
    // Update progress bar
    updateProgressBar(stats.successful || 0, stats.target || 120);
    
    // Calculate and update success rate
    const rate = stats.processed > 0 
        ? Math.round((stats.successful / stats.processed) * 100) 
        : 0;
    successRate.textContent = `${rate}%`;
    
    // Update session status and buttons
    if (stats.isRunning) {
        updateSessionStatus('Running', 'status-running');
        updateLiveStatus('Active', true);
        updateUIForRunningSession();
        
        // CRITICAL FIX: Ensure stop button is properly enabled
        if (stopBtn) {
            stopBtn.disabled = false;
            stopBtn.classList.remove('btn-disabled');
            stopBtn.classList.add('btn-stop');
        }
        
        // Add recent activities if available
        if (stats.recentActivities && stats.recentActivities.length > 0) {
            // Clear current log and add new activities
            activityLog = [...stats.recentActivities];
            updateActivityFeed();
        }
    } else {
        const status = stats.processed > 0 ? 'Completed' : 'Ready';
        const statusClass = stats.processed > 0 ? 'status-idle' : 'status-idle';
        updateSessionStatus(status, statusClass);
        updateLiveStatus('Ready', false);
        updateUIForStoppedSession();
    }
}

/**
 * Updates session status with styling
 */
function updateSessionStatus(message, statusClass) {
    sessionStatus.textContent = message;
    sessionStatus.className = `status-value ${statusClass}`;
}

/**
 * Updates the live status indicator in top-right corner
 */
function updateLiveStatus(status, isRunning = false) {
    const statusElement = document.getElementById('sessionStatus');
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = isRunning ? 'stat-status running' : 'stat-status';
    }
}

/**
 * Updates UI for running session state
 */
function updateUIForRunningSession() {
    const startBtn = document.getElementById('start-button');
    const pauseBtn = document.getElementById('pause-button');
    const stopBtn = document.getElementById('stop-button');
    
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.innerHTML = 'Session Active';
        startBtn.classList.add('btn-disabled');
    }
    
    if (pauseBtn) {
        pauseBtn.disabled = false;
        pauseBtn.classList.remove('btn-disabled');
    }
    
    // CRITICAL: Stop button ALWAYS active for panic stops
    if (stopBtn) {
        stopBtn.disabled = false;
        stopBtn.innerHTML = 'Stop Session';
        stopBtn.classList.add('btn-stop');
        stopBtn.classList.remove('btn-disabled');
    }
}

/**
 * Updates UI for stopped session state
 */
function updateUIForStoppedSession() {
    const startBtn = document.getElementById('start-button');
    const pauseBtn = document.getElementById('pause-button');
    const stopBtn = document.getElementById('stop-button');
    
    if (startBtn) {
        startBtn.disabled = false;
        startBtn.innerHTML = 'Start Session';
        startBtn.classList.remove('btn-disabled');
    }
    
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.classList.add('btn-disabled');
    }
    
    if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.innerHTML = 'Stop Session';
        stopBtn.classList.remove('btn-stop');
        stopBtn.classList.add('btn-disabled');
    }
}

/**
 * Updates UI when not on X.com
 */
function updateUIForWrongSite() {
    updateSessionStatus('Navigate to X.com', 'status-error');
    updateLiveStatus('Offline', false);
    startBtn.disabled = true;
    startBtn.innerHTML = 'Go to X.com First';
    stopBtn.disabled = true;
}

/**
 * Resets the start button to default state
 */
function resetStartButton() {
    startBtn.disabled = false;
    startBtn.innerHTML = 'Launch Session';
}

/**
 * Shows alert with brand styling
 */
function showAlert(message) {
    // Use native alert for now, could be enhanced with custom modal
    alert(message);
}

/**
 * Save prompt preference for a strategy
 */
function savePromptPreference(strategyName, variationId) {
    chrome.storage.local.get(['boldtake_prompt_preferences'], (result) => {
        const preferences = result.boldtake_prompt_preferences || {};
        preferences[strategyName] = variationId;
        
        chrome.storage.local.set({ boldtake_prompt_preferences: preferences }, () => {
            debugLog(`💾 Saved prompt preference: ${strategyName} -> ${variationId}`);
        });
    });
}

/**
 * Load prompt preferences and update UI
 */
function loadPromptPreferences() {
    chrome.storage.local.get(['boldtake_prompt_preferences'], (result) => {
        const preferences = result.boldtake_prompt_preferences || {};
        
        // Update each dropdown with saved preference
        const promptSelects = {
            'Engagement Indie Voice': document.getElementById('indie-voice-select'),
            'Engagement Spark Reply': document.getElementById('spark-reply-select'),
            'Engagement The Counter': document.getElementById('counter-select'),
            'The Riff': document.getElementById('riff-select'),
            'The Viral Shot': document.getElementById('viral-shot-select'),
            'The Shout-Out': document.getElementById('shout-out-select')
        };
        
        Object.entries(promptSelects).forEach(([strategyName, selectElement]) => {
            if (selectElement && preferences[strategyName]) {
                selectElement.value = preferences[strategyName];
            }
        });
    });
}

/**
 * Reset all prompt preferences to defaults
 */
function resetPromptPreferences() {
    if (confirm('Reset all prompt variations to defaults?')) {
        chrome.storage.local.remove('boldtake_prompt_preferences', () => {
            // Reset all dropdowns to first option
            document.querySelectorAll('.prompt-variation-select').forEach(select => {
                select.selectedIndex = 0;
            });
            
            showAlert('✅ Prompt preferences reset to defaults');
            debugLog('🔄 Reset all prompt preferences to defaults');
        });
    }
}

/**
 * Adds an activity to the live feed
 */
function addActivity(message, type = 'info') {
    // Skip if activity updates are paused
    if (activityUpdatesPaused) return;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const activity = {
        message: message.replace('contentScript.js:', '').replace(/^\d+\s*/, ''),
        timestamp,
        type
    };
    
    activityLog.unshift(activity);
    totalActivityEvents++;
    
    // Keep only last 8 activities (increased for better enterprise visibility)
    if (activityLog.length > 8) {
        activityLog = activityLog.slice(0, 8);
    }
    
    updateActivityFeed();
}

/**
 * Updates the activity feed display
 */
function updateActivityFeed() {
    if (!activityFeed) return;
    
    if (activityLog.length === 0) {
        activityFeed.innerHTML = '<div class="activity-item">Ready to start...</div>';
        updateActivityStats();
        return;
    }
    
    activityFeed.innerHTML = activityLog.map(activity => 
        `<div class="activity-item ${activity.type}">
            <span style="opacity: 0.6">${activity.timestamp}</span> ${activity.message}
        </div>`
    ).join('');
    
    // Update activity stats
    updateActivityStats();
    
    // Auto-scroll to bottom to show latest activity
    activityFeed.scrollTop = activityFeed.scrollHeight;
}

/**
 * Toggle settings panel visibility
 */
function toggleSettings() {
    const isHidden = settingsPanel.classList.contains('hidden');
    
    // Hide other panels
    analyticsPanel.classList.add('hidden');
    analyticsBtn.classList.remove('active');
    roadmapPanel.classList.add('hidden');
    roadmapBtn.classList.remove('active');
    
    if (isHidden) {
        settingsPanel.classList.remove('hidden');
        settingsBtn.classList.add('active');
    } else {
        settingsPanel.classList.add('hidden');
        settingsBtn.classList.remove('active');
    }
}

/**
 * Toggle analytics panel visibility
 */
function toggleAnalytics() {
    const isHidden = analyticsPanel.classList.contains('hidden');
    
    // Hide other panels
    settingsPanel.classList.add('hidden');
    settingsBtn.classList.remove('active');
    roadmapPanel.classList.add('hidden');
    roadmapBtn.classList.remove('active');
    
    if (isHidden) {
        analyticsPanel.classList.remove('hidden');
        analyticsBtn.classList.add('active');
        // Refresh analytics when opened
        loadAnalyticsData();
    } else {
        analyticsPanel.classList.add('hidden');
        analyticsBtn.classList.remove('active');
    }
}

/**
 * Toggle roadmap panel visibility
 */
function toggleRoadmap() {
    const isHidden = roadmapPanel.classList.contains('hidden');
    
    // Hide settings if open
    settingsPanel.classList.add('hidden');
    settingsBtn.classList.remove('active');
    
    if (isHidden) {
        roadmapPanel.classList.remove('hidden');
        roadmapBtn.classList.add('active');
    } else {
        roadmapPanel.classList.add('hidden');
        roadmapBtn.classList.remove('active');
    }
}

/**
 * Save personalization settings (language and tone)
 */
function savePersonalizationSettings() {
    const language = languageSelect.value;
    const tone = toneSelect.value;
    
    chrome.storage.local.set({
        'boldtake_language': language,
        'boldtake_tone': tone
    });
    
    debugLog(`🌍 Personalization updated: Language=${language}, Tone=${tone}`);
}

/**
 * Set up main tabs navigation system
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Hide all panels initially
    const allPanels = [
        document.getElementById('settings-panel'),
        document.getElementById('analytics-panel'),
        document.getElementById('roadmap-panel'),
        document.getElementById('guide-panel')
    ];
    
    // Main dashboard content (activity log, etc.)
    const dashboardContent = document.querySelector('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Hide all panels first
            allPanels.forEach(panel => {
                if (panel) {
                    panel.classList.add('hidden');
                    panel.style.display = 'none';
                }
            });
            
            // Show the appropriate content based on tab
            if (targetTab === 'dashboard') {
                // Show main dashboard content
                if (dashboardContent) dashboardContent.style.display = 'block';
            } else if (targetTab === 'settings') {
                // Hide dashboard, show settings
                if (dashboardContent) dashboardContent.style.display = 'none';
                const settingsPanel = document.getElementById('settings-panel');
                if (settingsPanel) {
                    settingsPanel.classList.remove('hidden');
                    settingsPanel.style.display = 'block';
                }
            } else if (targetTab === 'analytics') {
                // Hide dashboard, show analytics
                if (dashboardContent) dashboardContent.style.display = 'none';
                const analyticsPanel = document.getElementById('analytics-panel');
                if (analyticsPanel) {
                    analyticsPanel.classList.remove('hidden');
                    analyticsPanel.style.display = 'block';
                }
            } else if (targetTab === 'roadmap') {
                // Hide dashboard, show roadmap
                if (dashboardContent) dashboardContent.style.display = 'none';
                const roadmapPanel = document.getElementById('roadmap-panel');
                if (roadmapPanel) {
                    roadmapPanel.classList.remove('hidden');
                    roadmapPanel.style.display = 'block';
                }
            } else if (targetTab === 'guide') {
                // Hide dashboard, show guide (we'll create this)
                if (dashboardContent) dashboardContent.style.display = 'none';
                showGuideContent();
            }
            
            debugLog(`📑 Switched to ${targetTab} tab`);
        });
    });
}

/**
 * CSV Reply Analysis System
 * Processes performance data to improve AI quality
 */
function setupReplyAnalysis() {
    // Add CSV upload functionality to Analytics tab
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && !document.getElementById('csv-analyzer')) {
        const analyzerHTML = `
            <div id="csv-analyzer" class="csv-analyzer-section">
                <div class="analyzer-header">
                    <h3>🧠 AI Learning System</h3>
                    <p class="analyzer-description">Upload your reply performance CSV to improve AI quality</p>
                </div>
                
                <div class="csv-upload-area">
                    <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
                    <button id="upload-csv-btn" class="btn btn-secondary">
                        📊 Upload Performance CSV
                    </button>
                    <div class="upload-hint">Upload your X.com analytics CSV to analyze reply patterns</div>
                </div>
                
                <div id="analysis-results" class="analysis-results hidden">
                    <div class="results-header">
                        <h4>🎯 Performance Insights</h4>
                        <button id="apply-insights-btn" class="btn btn-start">Apply AI Improvements</button>
                    </div>
                    <div id="insights-display" class="insights-display"></div>
                </div>
            </div>
        `;
        
        analyticsPanel.insertAdjacentHTML('afterbegin', analyzerHTML);
        setupCSVAnalysisListeners();
    }
}

/**
 * Set up CSV analysis event listeners
 */
function setupCSVAnalysisListeners() {
    const uploadBtn = document.getElementById('upload-csv-btn');
    const fileInput = document.getElementById('csv-file-input');
    const applyBtn = document.getElementById('apply-insights-btn');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleCSVUpload);
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyAIImprovements);
    }
}

/**
 * Handle CSV file upload and analysis
 */
async function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const csvText = await readFileAsText(file);
        const csvData = parseCSV(csvText);
        
        debugLog('📊 CSV uploaded:', csvData.length, 'replies');
        
        // Send data to content script for analysis
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab?.url?.includes('x.com') || tab?.url?.includes('twitter.com')) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'ANALYZE_REPLY_PERFORMANCE',
                data: csvData
            }, (response) => {
                if (response?.success) {
                    displayAnalysisResults(response.insights);
                } else {
                    debugLog('❌ Analysis failed:', response?.error);
                }
            });
        } else {
            // Fallback: analyze locally
            const insights = analyzeRepliesLocally(csvData);
            displayAnalysisResults(insights);
        }
        
    } catch (error) {
        debugLog('❌ CSV processing error:', error);
        showNotification('Error processing CSV file', 'error');
    }
}

/**
 * Read file as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Parse CSV data into structured format
 */
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const reply = {};
        
        headers.forEach((header, index) => {
            const value = values[index]?.trim() || '';
            
            // Map common CSV column names
            if (header.includes('text') || header.includes('reply')) {
                reply.text = value;
            } else if (header.includes('like')) {
                reply.likes = parseInt(value) || 0;
            } else if (header.includes('retweet')) {
                reply.retweets = parseInt(value) || 0;
            } else if (header.includes('reply') || header.includes('comment')) {
                reply.replies = parseInt(value) || 0;
            } else if (header.includes('strategy')) {
                reply.strategy = value;
            } else if (header.includes('impression')) {
                reply.impressions = parseInt(value) || 0;
            }
        });
        
        return reply;
    }).filter(reply => reply.text && reply.text.length > 10);
}

/**
 * Local reply analysis (fallback)
 */
function analyzeRepliesLocally(csvData) {
    // Simple local analysis
    const totalReplies = csvData.length;
    const avgLikes = csvData.reduce((sum, r) => sum + (r.likes || 0), 0) / totalReplies;
    const topPerformers = csvData
        .sort((a, b) => ((b.likes || 0) + (b.retweets || 0)) - ((a.likes || 0) + (a.retweets || 0)))
        .slice(0, 5);
    
    return {
        totalReplies,
        avgLikes: Math.round(avgLikes),
        topPerformers,
        recommendations: [
            {
                type: 'general',
                priority: 'medium',
                message: `Analyzed ${totalReplies} replies with ${avgLikes} avg likes`,
                action: 'info'
            }
        ]
    };
}

/**
 * Display analysis results in the UI
 */
function displayAnalysisResults(insights) {
    const resultsDiv = document.getElementById('analysis-results');
    const displayDiv = document.getElementById('insights-display');
    
    if (!resultsDiv || !displayDiv) return;
    
    resultsDiv.classList.remove('hidden');
    
    let html = `
        <div class="insights-summary">
            <div class="insight-card">
                <div class="insight-icon">📊</div>
                <div class="insight-content">
                    <div class="insight-number">${insights.totalReplies || 0}</div>
                    <div class="insight-label">Replies Analyzed</div>
                </div>
            </div>
            <div class="insight-card">
                <div class="insight-icon">👍</div>
                <div class="insight-content">
                    <div class="insight-number">${insights.avgLikes || 0}</div>
                    <div class="insight-label">Avg Likes</div>
                </div>
            </div>
        </div>
        
        <div class="recommendations-list">
            <h5>🎯 AI Improvement Recommendations:</h5>
    `;
    
    if (insights.recommendations && insights.recommendations.length > 0) {
        insights.recommendations.forEach(rec => {
            const priorityClass = rec.priority === 'high' ? 'priority-high' : 
                                 rec.priority === 'medium' ? 'priority-medium' : 'priority-low';
            
            html += `
                <div class="recommendation-item ${priorityClass}">
                    <div class="rec-priority">${rec.priority.toUpperCase()}</div>
                    <div class="rec-message">${rec.message}</div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    
    if (insights.topPerformers && insights.topPerformers.length > 0) {
        html += `
            <div class="top-performers">
                <h5>🏆 Top Performing Replies:</h5>
        `;
        
        insights.topPerformers.slice(0, 3).forEach((reply, index) => {
            const engagement = (reply.likes || 0) + (reply.retweets || 0) + (reply.replies || 0);
            html += `
                <div class="performer-item">
                    <div class="performer-rank">#${index + 1}</div>
                    <div class="performer-content">
                        <div class="performer-text">"${reply.text.substring(0, 80)}..."</div>
                        <div class="performer-stats">${engagement} total engagement</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    displayDiv.innerHTML = html;
    
    // Store insights for application
    chrome.storage.local.set({
        'boldtake_pending_insights': insights,
        'boldtake_analysis_timestamp': Date.now()
    });
    
    debugLog('🧠 Analysis results displayed:', insights);
}

/**
 * Apply AI improvements based on insights
 */
async function applyAIImprovements() {
    try {
        const result = await chrome.storage.local.get(['boldtake_pending_insights']);
        const insights = result.boldtake_pending_insights;
        
        if (!insights) {
            showNotification('No insights available to apply', 'error');
            return;
        }
        
        // Send insights to content script for application
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab?.url?.includes('x.com') || tab?.url?.includes('twitter.com')) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'APPLY_AI_INSIGHTS',
                insights: insights
            }, (response) => {
                if (response?.success) {
                    showNotification('AI improvements applied successfully!', 'success');
                    debugLog('🚀 AI improvements applied:', response.enhancements);
                } else {
                    showNotification('Failed to apply improvements', 'error');
                }
            });
        }
        
    } catch (error) {
        debugLog('❌ Error applying insights:', error);
        showNotification('Error applying AI improvements', 'error');
    }
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Show guide content (Expert Growth Strategies + Browser Tips)
 */
function showGuideContent() {
    // Create guide panel if it doesn't exist
    let guidePanel = document.getElementById('guide-panel');
    if (!guidePanel) {
        guidePanel = document.createElement('div');
        guidePanel.id = 'guide-panel';
        guidePanel.className = 'guide-panel';
        guidePanel.innerHTML = `
            <div class="guide-section">
                <h3>📈 Expert Growth Strategies</h3>
                <div class="guide-accordion">
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>Principle: Niche Authority</strong>
                        </div>
                        <div class="guide-content">
                            Reply to tweets in your expertise area. BoldTake's AI adapts to your niche, building you as a thought leader in that space.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>The "60+60" Strategy</strong>
                        </div>
                        <div class="guide-content">
                            Run 2 separate sessions with different keywords. Example: 60 replies on "AI" in morning, 60 on "startup" in evening. Maximum daily limit: 120 replies total.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>Timing is Everything</strong>
                        </div>
                        <div class="guide-content">
                            Use "Safe" timing (1-5min delays) during peak hours (9am-5pm EST). Switch to "Stealth" (2-10min) for overnight sessions.
                        </div>
                    </div>
                </div>
                
                <h3>🌐 Browser Optimization Tips</h3>
                <div class="guide-accordion">
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>Pro Tip: Isolate in Brave</strong>
                        </div>
                        <div class="guide-content">
                            Use Brave browser for BoldTake sessions. Its built-in privacy features provide additional protection from tracking.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>Rule #1: Keep Tab in Focus</strong>
                        </div>
                        <div class="guide-content">
                            Keep the X.com tab active and visible. Minimize other windows but keep X.com tab as the active tab for optimal performance.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>Warning: Avoid Tab Switching</strong>
                        </div>
                        <div class="guide-content">
                            Don't switch between multiple X.com tabs during a session. This can confuse the automation and reduce success rates.
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert guide panel after the main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(guidePanel);
        }
    }
    
    // Show guide panel
    guidePanel.classList.remove('hidden');
    guidePanel.style.display = 'block';
}

/**
 * Update progress bar based on replies sent
 */
function updateProgressBar(current, goal = 120) {
    const progressFill = document.getElementById('progressFill');
    const statGoal = document.querySelector('.stat-goal');
    
    if (progressFill) {
        const percentage = Math.min((current / goal) * 100, 100);
        progressFill.style.width = `${percentage}%`;
    }
    
    if (statGoal) {
        statGoal.textContent = `/ ${goal}`;
    }
}

/**
 * Save advanced filtering settings
 */
function saveFilteringSettings() {
    const excludeLinksMedia = document.getElementById('exclude-links-media').checked;
    const prioritizeQuestions = document.getElementById('prioritize-questions').checked;
    const minCharCount = parseInt(document.getElementById('min-char-count').value) || 80;
    const spamKeywords = document.getElementById('spam-keywords').value;
    const negativeKeywords = document.getElementById('negative-keywords').value;
    
    chrome.storage.local.set({
        'boldtake_exclude_links_media': excludeLinksMedia,
        'boldtake_prioritize_questions': prioritizeQuestions,
        'boldtake_min_char_count': minCharCount,
        'boldtake_spam_keywords': spamKeywords,
        'boldtake_negative_keywords': negativeKeywords
    });
    
    debugLog('🎯 Filtering settings saved:', { 
        excludeLinksMedia, 
        prioritizeQuestions, 
        minCharCount, 
        spamKeywords: spamKeywords.split('\n').length + ' keywords',
        negativeKeywords: negativeKeywords.split('\n').length + ' keywords'
    });
}

/**
 * Load analytics data from storage and content script
 */
async function loadAnalyticsData() {
    try {
        // Load stored analytics data
        const result = await chrome.storage.local.get([
            'boldtake_total_comments',
            'boldtake_daily_comments',
            'boldtake_comment_history',
            'boldtake_last_reset_date',
            'boldtake_xcom_analytics',
            'boldtake_analytics'
        ]);
        
        // Update total comments
        const totalComments = result.boldtake_total_comments || 0;
        totalCommentsAllTime.textContent = totalComments;
        
        // Handle daily reset
        const today = new Date().toDateString();
        const lastReset = result.boldtake_last_reset_date;
        
        let dailyComments = result.boldtake_daily_comments || 0;
        if (lastReset !== today) {
            dailyComments = 0;
            chrome.storage.local.set({
                'boldtake_daily_comments': 0,
                'boldtake_last_reset_date': today
            });
        }
        
        commentsToday.textContent = dailyComments;
        
        // Calculate success rate from current session
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab?.url?.includes('x.com') || tab?.url?.includes('twitter.com')) {
            try {
                const response = await chrome.tabs.sendMessage(tab.id, {type: 'GET_SESSION_STATS'});
                if (response?.stats) {
                    const successRate = response.stats.processed > 0 
                        ? Math.round((response.stats.successful / response.stats.processed) * 100)
                        : 0;
                    avgEngagement.textContent = `${successRate}%`;
                }
            } catch (e) {
                avgEngagement.textContent = '0%';
            }
        }
        
        // Load comment history
        const history = result.boldtake_comment_history || [];
        updateCommentHistory(history);
        
        // Update 7-day performance dashboard
        updatePerformanceDashboard(result);
        
    } catch (error) {
        debugLog('❌ Error loading analytics:', error);
    }
}

/**
 * Update the 7-day performance dashboard with real data
 */
function updatePerformanceDashboard(data) {
    // Analytics are now a Bold Tier premium feature
    // Show compelling demo data to encourage upgrades
    debugLog('📊 Analytics dashboard is now a Bold Tier premium feature - showing demo data');
}

/**
 * Format numbers for display (e.g., 1234 -> 1.2K)
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Trigger analytics scraping on startup (once per session)
 */
function triggerAnalyticsScrapingOnStartup() {
    // Check if we've already scraped this session
    const sessionKey = `analytics_scraped_${Date.now()}`;
    const lastScraped = sessionStorage.getItem('boldtake_analytics_scraped');
    
    // Only scrape once per browser session
    if (!lastScraped) {
        setTimeout(async () => {
            try {
                // Check if we're on X.com
                const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                if (tab?.url?.includes('x.com') || tab?.url?.includes('twitter.com')) {
                    // Send message to content script to scrape analytics
                    chrome.tabs.sendMessage(tab.id, {type: 'SCRAPE_ANALYTICS'}, (response) => {
                        if (response?.success) {
                            debugLog('📊 Analytics scraping triggered on startup');
                            sessionStorage.setItem('boldtake_analytics_scraped', 'true');
                        }
                    });
                }
            } catch (error) {
                debugLog('Analytics scraping not available:', error.message);
            }
        }, 3000); // Wait 3 seconds after popup loads
    }
}

/**
 * Update comment history display
 */
function updateCommentHistory(history) {
    if (!history || history.length === 0) {
        commentHistoryList.innerHTML = `
            <div class="history-item placeholder">
                <div class="history-icon">💬</div>
                <div class="history-content">
                    <div class="history-text">No comments yet. Start a session to see your activity!</div>
                    <div class="history-meta">Ready to engage</div>
                </div>
            </div>
        `;
        return;
    }
    
    // Show latest 10 comments
    const recentHistory = history.slice(-10).reverse();
    
    commentHistoryList.innerHTML = recentHistory.map(comment => `
        <div class="history-item">
            <div class="history-icon">${comment.success ? '✅' : '❌'}</div>
            <div class="history-content">
                <div class="history-text">${comment.text.substring(0, 80)}${comment.text.length > 80 ? '...' : ''}</div>
                <div class="history-meta">${comment.timestamp} • ${comment.strategy}</div>
            </div>
        </div>
    `).join('');
}

/**
 * Clear comment history
 */
function clearCommentHistory() {
    if (confirm('Are you sure you want to clear all comment history? This cannot be undone.')) {
        chrome.storage.local.set({
            'boldtake_comment_history': [],
            'boldtake_total_comments': 0,
            'boldtake_daily_comments': 0
        });
        
        loadAnalyticsData();
        debugLog('🗑️ Comment history cleared');
    }
}

/**
 * Handle niche selection and display keyword suggestions
 */
function handleNicheSelection() {
    const selectedNiche = nicheSelect.value;
    
    if (!selectedNiche || !NICHE_KEYWORDS[selectedNiche]) {
        // Show default message when no niche is selected
        suggestedKeywords.innerHTML = `
            <div class="no-niche">Select a niche above to see popular keyword suggestions for that category</div>
        `;
        return;
    }
    
    const niche = NICHE_KEYWORDS[selectedNiche];
    
    // Create keyword suggestions display
    suggestedKeywords.innerHTML = `
        <div class="niche-title">${niche.title}</div>
        <div class="niche-description">${niche.description}</div>
        <div class="suggestion-keywords-grid">
            ${niche.keywords.map(keyword => `
                <div class="suggestion-keyword-chip" data-keyword="${keyword}">
                    ${keyword}
                </div>
            `).join('')}
        </div>
    `;
    
    // Add click listeners to keyword chips
    suggestedKeywords.querySelectorAll('.suggestion-keyword-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const keyword = chip.dataset.keyword;
            keywordInput.value = keyword;
            
            // Add visual feedback
            chip.style.background = 'hsl(var(--brand-green))';
            chip.style.color = 'hsl(var(--bg-primary))';
            chip.style.borderColor = 'hsl(var(--brand-green))';
            
            // Reset after a short delay
            setTimeout(() => {
                chip.style.background = '';
                chip.style.color = '';
                chip.style.borderColor = '';
            }, 200);
            
            debugLog(`📝 Keyword suggestion selected: ${keyword}`);
        });
    });
}

// ========================================

debugLog('✅ BoldTake Professional popup script ready!');
