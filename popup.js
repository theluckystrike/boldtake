/**
 * BoldTake Professional - Popup Script
 * Enhanced with BoldTake Brand Kit Design
 */

// Stealth mode - minimal popup logging
const DEBUG_MODE = false;
const debugLog = DEBUG_MODE ? console.log : () => {};

debugLog('🚀 BoldTake Professional popup loaded');

// DOM Elements
let startBtn, stopBtn, sessionStatus, successfulCount, successRate;
let keywordInput, minFavesInput, liveStatus, activityFeed;
let settingsBtn, analyticsBtn, roadmapBtn, settingsPanel, analyticsPanel, roadmapPanel;
let languageSelect, toneSelect;
let nicheSelect, suggestedKeywords;

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

/**
 * Wait for all critical dependencies to load
 * CRITICAL FIX: Prevents race condition errors
 */
async function waitForDependencies() {
    const maxWaitTime = 10000; // 10 seconds max wait
    const checkInterval = 100; // Check every 100ms
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
        const checkDependencies = () => {
            const elapsed = Date.now() - startTime;
            
            // Check if we've exceeded max wait time
            if (elapsed > maxWaitTime) {
                reject(new Error('Timeout waiting for dependencies to load'));
                return;
            }
            
            // Check for required dependencies
            const hasSupabase = typeof window.supabase !== 'undefined';
            const hasBoldTakeAuth = typeof window.BoldTakeAuth !== 'undefined';
            const hasBoldTakeAuthManager = typeof window.BoldTakeAuthManager !== 'undefined';
            
            if (hasSupabase && hasBoldTakeAuth && hasBoldTakeAuthManager) {
                debugLog('✅ All dependencies loaded successfully');
                resolve();
            } else {
                debugLog(`⏳ Waiting for dependencies... Supabase: ${hasSupabase}, Auth: ${hasBoldTakeAuth}, AuthManager: ${hasBoldTakeAuthManager}`);
                setTimeout(checkDependencies, checkInterval);
            }
        };
        
        checkDependencies();
    });
}

/**
 * Show initialization error to user
 */
function showInitializationError(errorMessage) {
    const loginError = document.getElementById('login-error');
    if (loginError) {
        loginError.style.display = 'block';
        loginError.textContent = `Initialization Error: ${errorMessage}. Please refresh and try again.`;
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    debugLog('📱 Initializing BoldTake Professional interface...');
    
    // PHASE 1: Initialize Authentication System with proper loading checks
    try {
        // CRITICAL FIX: Wait for all dependencies to load
        await waitForDependencies();
        
        await window.BoldTakeAuthManager.initializeAuth();
        debugLog('✅ Authentication system initialized');
    } catch (error) {
        console.error('❌ Failed to initialize authentication:', error);
        showInitializationError(error.message);
        // Continue with limited functionality
    }
    
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
    
    // Authentication event listeners
    setupAuthEventListeners();
    // Old button event listeners removed - using tab navigation system now
    clearHistoryBtn.addEventListener('click', clearCommentHistory);
    
    // Launch session from settings button
    const launchFromSettingsBtn = document.getElementById('launch-from-settings-btn');
    if (launchFromSettingsBtn) {
        launchFromSettingsBtn.addEventListener('click', async () => {
            // Save settings first
            savePersonalizationSettings();
            saveFilteringSettings();
            // Switch to dashboard tab
            const dashboardTab = document.querySelector('[data-tab="dashboard"]');
            if (dashboardTab) {
                dashboardTab.click();
            }
            // Start session
            await startSession();
        });
    }
    
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
            // Open settings panel using new tab system
            const settingsTab = document.querySelector('[data-tab="settings"]');
            if (settingsTab) {
                settingsTab.click();
            }
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
        // Open settings panel using new tab system
        const settingsTab = document.querySelector('[data-tab="settings"]');
        if (settingsTab) {
            settingsTab.click();
        }
        debugLog('🎯 Auto-opened settings for new user experience');
    }
    
    // Custom prompt functionality removed
    
    // Set up periodic updates
    setInterval(loadSessionState, 2000);
    setInterval(loadAnalyticsData, 5000); // Update analytics every 5 seconds // Update every 2 seconds
    
    // Setup activity controls
    setupActivityControls();
    
    debugLog('✅ BoldTake Professional popup ready!');
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
    
    // CRITICAL: Prevent rapid clicking and multiple simultaneous sessions
    if (startBtn.disabled) {
        debugLog('⚠️ Start session already in progress, ignoring duplicate click');
        return;
    }
    
    try {
        // IMMEDIATELY disable button to prevent rapid clicking
        startBtn.disabled = true;
        startBtn.innerHTML = '<div class="loading"></div>Launching...';
        
        // Also disable launch-from-settings button if it exists
        const launchFromSettingsBtn = document.getElementById('launch-from-settings-btn');
        if (launchFromSettingsBtn) {
            launchFromSettingsBtn.disabled = true;
            launchFromSettingsBtn.innerHTML = '<div class="loading"></div>Launching...';
        }
        
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
 * ENHANCED: Also resets launch-from-settings button
 */
function resetStartButton() {
    startBtn.disabled = false;
    startBtn.innerHTML = 'Launch Session';
    
    // Also reset launch-from-settings button if it exists
    const launchFromSettingsBtn = document.getElementById('launch-from-settings-btn');
    if (launchFromSettingsBtn) {
        launchFromSettingsBtn.disabled = false;
        launchFromSettingsBtn.innerHTML = '🚀 Launch Session with These Settings';
    }
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

// Old toggle functions removed - using new tab navigation system

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
 * Set up authentication-related event listeners
 */
function setupAuthEventListeners() {
    // Login form submission
    const loginBtn = document.getElementById('login-btn');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const loginBtnText = document.querySelector('.login-btn-text');
    const loginLoading = document.querySelector('.login-loading');
    
    if (loginBtn && loginEmail && loginPassword) {
        // Handle login button click
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleLoginSubmission();
        });
        
        // Handle Enter key in form fields
        loginEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLoginSubmission();
            }
        });
        
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLoginSubmission();
            }
        });
        
        async function handleLoginSubmission() {
            const email = loginEmail.value.trim();
            const password = loginPassword.value;
            
            // Validate inputs
            if (!email || !password) {
                showLoginError('Please enter both email and password');
                return;
            }
            
            if (!isValidEmail(email)) {
                showLoginError('Please enter a valid email address');
                return;
            }
            
            // Show loading state
            loginBtn.disabled = true;
            loginBtnText.style.display = 'none';
            loginLoading.style.display = 'flex';
            hideLoginError();
            
            try {
                // Attempt login
                const result = await window.BoldTakeAuthManager.handleLogin(email, password);
                
                if (result.success) {
                    // Success - UI will be updated by auth manager
                    debugLog('✅ Login successful');
                } else {
                    showLoginError(result.error || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('❌ Login error:', error);
                showLoginError('An unexpected error occurred. Please try again.');
            } finally {
                // Reset button state
                loginBtn.disabled = false;
                loginBtnText.style.display = 'block';
                loginLoading.style.display = 'none';
            }
        }
        
        function showLoginError(message) {
            if (loginError) {
                loginError.textContent = message;
                loginError.style.display = 'block';
            }
        }
        
        function hideLoginError() {
            if (loginError) {
                loginError.style.display = 'none';
            }
        }
        
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }
    }
    
    // Logout functionality (add logout button if needed)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await window.BoldTakeAuthManager.handleLogout();
                debugLog('✅ Logout successful');
            } catch (error) {
                console.error('❌ Logout error:', error);
            }
        });
    }
    
    // Refresh subscription status button
    const refreshSubscriptionBtn = document.getElementById('refresh-subscription');
    if (refreshSubscriptionBtn) {
        refreshSubscriptionBtn.addEventListener('click', async () => {
            try {
                refreshSubscriptionBtn.disabled = true;
                refreshSubscriptionBtn.textContent = 'Checking...';
                
                await window.BoldTakeAuthManager.refreshSubscriptionStatus();
                debugLog('✅ Subscription status refreshed');
                
                refreshSubscriptionBtn.textContent = 'Check Subscription Status';
            } catch (error) {
                console.error('❌ Refresh subscription error:', error);
                refreshSubscriptionBtn.textContent = 'Try Again';
            } finally {
                refreshSubscriptionBtn.disabled = false;
            }
        });
    }
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
                <h3>🎯 Expert Growth Strategies</h3>
                <div class="guide-accordion">
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>1. Quality Over Quantity</strong>
                        </div>
                        <div class="guide-content">
                            Target tweets with 300+ engagement for maximum visibility and authentic conversations. High-engagement tweets = higher reach for your replies.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>2. Double Strategy</strong>
                        </div>
                        <div class="guide-content">
                            Run 2 sessions daily with different keywords (60+60 only) for maximum niche coverage within 120/day limit. Example: "AI startup" morning, "SaaS growth" afternoon.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>3. Niche Authority</strong>
                        </div>
                        <div class="guide-content">
                            Focus on 2-3 specific topics (AI, SaaS, Marketing) to build consistent thought leadership. Scattered engagement dilutes your expertise signal.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>4. Optimal Sessions</strong>
                        </div>
                        <div class="guide-content">
                            Run sessions during peak hours (9-11 AM, 1-3 PM EST) with 2-3 hour breaks between. Higher user activity = more engagement opportunities.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>5. Stealth Operations</strong>
                        </div>
                        <div class="guide-content">
                            Use varied timing and natural breaks - our system mimics human behavior patterns automatically. No manual stealth configuration needed.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>6. Strategic Languages</strong>
                        </div>
                        <div class="guide-content">
                            English for global reach, Spanish for LATAM markets, or target specific regions. Match language to your audience geography for better engagement.
                        </div>
                    </div>
                </div>
                
                <h3>🌐 Browser Optimization Tips</h3>
                <div class="guide-accordion">
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>1. Keep X.com Tab Active</strong>
                        </div>
                        <div class="guide-content">
                            Always keep X.com as the active/focused tab for maximum performance and reliability. Chrome throttles background tabs, reducing success rates.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>2. Use Brave Browser</strong>
                        </div>
                        <div class="guide-content">
                            Run BoldTake in Brave (Chromium-based) while doing other work in different browser. Isolates automation from your regular browsing.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>3. Minimize Window</strong>
                        </div>
                        <div class="guide-content">
                            Minimize entire browser window (not tab) to prevent accidental tab switching. Window minimization doesn't affect performance.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>4. Avoid Tab Switching</strong>
                        </div>
                        <div class="guide-content">
                            Never switch tabs in same window - Chrome throttles background tabs reducing success rate. Use separate browser instances if needed.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>5. Stable Connection</strong>
                        </div>
                        <div class="guide-content">
                            Use wired internet when possible - BoldTake auto-recovers from disconnections but stable connection ensures optimal performance.
                        </div>
                    </div>
                </div>
                
                <h3>🔐 Multi-Account Strategy (Advanced)</h3>
                <div class="guide-accordion">
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>Brave + Proxy Setup</strong>
                        </div>
                        <div class="guide-content">
                            For multiple accounts: Use Brave browser with different proxy configurations per account. Each account should have its own browser profile and proxy to maintain separation.
                        </div>
                    </div>
                    <div class="guide-item">
                        <div class="guide-header">
                            <strong>Account Isolation</strong>
                        </div>
                        <div class="guide-content">
                            Never run multiple accounts from the same IP or browser session. Use separate devices, VPNs, or proxy services to maintain account safety and avoid linking.
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
