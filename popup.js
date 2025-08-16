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

// Keyword Rotation Elements
let dailyTargetInput, addKeywordBtn, rotationKeywordsList;
let categorySelect, addCategoryBtn, categoryKeywords;
let rotationKeywords = [];

// Custom Prompt Elements
let customPromptToggle, customPromptBuilder, customPromptName, customPromptText;

// Keyword Categories Data
const KEYWORD_CATEGORIES = {
    business: ['startup', 'entrepreneur', 'business', 'founder', 'investment', 'venture', 'growth', 'strategy', 'leadership', 'innovation'],
    technology: ['AI', 'technology', 'software', 'coding', 'machine learning', 'blockchain', 'cybersecurity', 'cloud', 'automation', 'digital'],
    marketing: ['marketing', 'sales', 'branding', 'advertising', 'content', 'SEO', 'social media', 'conversion', 'customer', 'growth hacking'],
    finance: ['investment', 'finance', 'trading', 'stocks', 'portfolio', 'wealth', 'money', 'financial', 'market', 'economy'],
    fitness: ['fitness', 'health', 'workout', 'nutrition', 'wellness', 'exercise', 'diet', 'mental health', 'lifestyle', 'training'],
    education: ['education', 'learning', 'skills', 'development', 'coaching', 'productivity', 'mindset', 'success', 'motivation', 'knowledge'],
    sustainability: ['sustainability', 'environment', 'climate', 'renewable', 'green', 'eco-friendly', 'carbon', 'clean energy', 'conservation', 'sustainable'],
    creative: ['design', 'creative', 'art', 'branding', 'UX', 'UI', 'visual', 'photography', 'illustration', 'creativity'],
    realestate: ['real estate', 'property', 'housing', 'investment', 'mortgage', 'market', 'construction', 'development', 'commercial', 'residential'],
    politics: ['politics', 'economy', 'policy', 'government', 'tax', 'inflation', 'regulation', 'democracy', 'election', 'geopolitics']
};

// Analytics Elements
let totalCommentsAllTime, commentsToday, avgEngagement, bestStreak;
let commentHistoryList, analyticsInsights, clearHistoryBtn;

// Activity log storage
let activityLog = [];

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

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
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
    
    // Keyword rotation elements
    dailyTargetInput = document.getElementById('daily-target-input');
    addKeywordBtn = document.getElementById('add-keyword-btn');
    rotationKeywordsList = document.getElementById('rotation-keywords-list');
    
    // Category elements
    categorySelect = document.getElementById('category-select');
    addCategoryBtn = document.getElementById('add-category-btn');
    categoryKeywords = document.getElementById('category-keywords');
    
    // Custom prompt elements
    customPromptToggle = document.getElementById('customPromptToggle');
    customPromptBuilder = document.getElementById('customPromptBuilder');
    customPromptName = document.getElementById('customPromptName');
    customPromptText = document.getElementById('customPromptText');
    
    // Load saved settings including personalization
    chrome.storage.local.get([
        'boldtake_keyword', 
        'boldtake_min_faves', 
        'boldtake_language', 
        'boldtake_tone'
    ], (result) => {
        if (result.boldtake_keyword) {
            keywordInput.value = result.boldtake_keyword;
        }
        if (result.boldtake_min_faves) {
            minFavesInput.value = result.boldtake_min_faves;
        }
        if (result.boldtake_language) {
            languageSelect.value = result.boldtake_language;
        }
        if (result.boldtake_tone) {
            toneSelect.value = result.boldtake_tone;
        }
    });
    
    // Set up event listeners
    startBtn.addEventListener('click', startSession);
    stopBtn.addEventListener('click', stopSession);
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
    
    // Set up personalization listeners
    languageSelect.addEventListener('change', savePersonalizationSettings);
    toneSelect.addEventListener('change', savePersonalizationSettings);
    
    // Set up keyword rotation listeners
    addKeywordBtn.addEventListener('click', addKeywordToRotation);
    keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addKeywordToRotation();
        }
    });
    
    // Set up category listeners
    categorySelect.addEventListener('change', displayCategoryKeywords);
    addCategoryBtn.addEventListener('click', addAllCategoryKeywords);
    
    // Load saved keyword rotation settings
    loadKeywordRotationSettings();
    
    // Load current session state and analytics
    await loadSessionState();
    await loadAnalyticsData();
    
    // Initialize custom prompt functionality
    initializeCustomPrompts();
    
    // Set up periodic updates
    setInterval(loadSessionState, 2000);
    setInterval(loadAnalyticsData, 5000); // Update analytics every 5 seconds // Update every 2 seconds
    
    debugLog('✅ BoldTake Professional popup ready!');
});

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

        // Construct the search URL with proper language code
        const languageCode = getLanguageCode(languageSelect?.value || 'english');
        const searchURL = `https://x.com/search?q=${encodeURIComponent(keyword)}%20min_faves%3A${minFaves}%20lang%3A${languageCode}&src=typed_query&f=live`;

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
    const dot = liveStatus.querySelector('.status-dot');
    const text = liveStatus.querySelector('span');
    
    text.textContent = status;
    
    if (isRunning) {
        dot.classList.add('running');
    } else {
        dot.classList.remove('running');
    }
}

/**
 * Updates UI for running session state
 */
function updateUIForRunningSession() {
    startBtn.disabled = true;
    startBtn.innerHTML = '⏳ Session Running';
    stopBtn.disabled = false;
    stopBtn.innerHTML = 'Stop Session';
}

/**
 * Updates UI for stopped session state
 */
function updateUIForStoppedSession() {
    startBtn.disabled = false;
    startBtn.innerHTML = 'Launch Session';
    stopBtn.disabled = true;
    stopBtn.innerHTML = 'Stop Session';
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
 * Adds an activity to the live feed
 */
function addActivity(message, type = 'info') {
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
    
    // Keep only last 4 activities
    if (activityLog.length > 4) {
        activityLog = activityLog.slice(0, 4);
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
        return;
    }
    
    activityFeed.innerHTML = activityLog.map(activity => 
        `<div class="activity-item ${activity.type}">
            <span style="opacity: 0.6">${activity.timestamp}</span> ${activity.message}
        </div>`
    ).join('');
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
 * Load analytics data from storage and content script
 */
async function loadAnalyticsData() {
    try {
        // Load stored analytics data
        const result = await chrome.storage.local.get([
            'boldtake_total_comments',
            'boldtake_daily_comments',
            'boldtake_comment_history',
            'boldtake_last_reset_date'
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
        
    } catch (error) {
        debugLog('❌ Error loading analytics:', error);
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

// ========================================
// CUSTOM PROMPT FUNCTIONALITY
// ========================================

/**
 * Initialize custom prompt functionality
 */
function initializeCustomPrompts() {
    // Toggle custom prompt builder visibility
    customPromptToggle.addEventListener('change', () => {
        if (customPromptToggle.checked) {
            customPromptBuilder.classList.remove('hidden');
            loadSavedPrompts();
        } else {
            customPromptBuilder.classList.add('hidden');
        }
    });

    // Test custom prompt
    testCustomPromptBtn.addEventListener('click', testCustomPrompt);
    
    // Save custom prompt
    saveCustomPromptBtn.addEventListener('click', saveCustomPrompt);
    
    // Viral hook example functionality
    viewViralHookBtn.addEventListener('click', toggleViralHookDetails);
    editViralHookBtn.addEventListener('click', editViralHook);
    copyViralHookBtn.addEventListener('click', copyViralHookToEditor);
    useViralHookBtn.addEventListener('click', useViralHookPrompt);
    
    // Load saved prompts on startup
    loadSavedPrompts();
}

/**
 * Test a custom prompt with sample content
 */
async function testCustomPrompt() {
    const promptName = customPromptName.value.trim();
    const promptText = customPromptText.value.trim();
    
    if (!promptName || !promptText) {
        showAlert('Please enter both a prompt name and prompt text before testing.');
        return;
    }
    
    testCustomPromptBtn.disabled = true;
    testCustomPromptBtn.innerHTML = '<div class="loading"></div>Testing...';
    
    try {
        // Sample tweet content for testing
        const sampleTweet = "Just launched my new startup! Excited to change the world with AI technology. #startup #AI #innovation";
        
        // Send test request to background script
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'TEST_CUSTOM_PROMPT',
                prompt: promptText,
                tweetContent: sampleTweet,
                language: 'english',
                tone: 'professional'
            }, resolve);
        });
        
        if (response.success) {
            // Show preview
            const previewDiv = document.getElementById('custom-prompt-preview');
            const responseDiv = document.getElementById('preview-response');
            
            responseDiv.innerHTML = `
                <div class="preview-sample-tweet">
                    <strong>Sample Tweet:</strong> "${sampleTweet}"
                </div>
                <div class="preview-ai-response">
                    <strong>AI Response:</strong> "${response.reply}"
                </div>
                <div class="preview-stats">
                    <span class="stat">✅ Length: ${response.reply.length}/280</span>
                    <span class="stat">🎯 Strategy: Custom</span>
                    <span class="stat">⚡ Generated in ${response.processingTime}ms</span>
                </div>
            `;
            
            previewDiv.classList.remove('hidden');
            
            // Auto-hide preview after 10 seconds
            setTimeout(() => {
                previewDiv.classList.add('hidden');
            }, 10000);
            
        } else {
            showAlert(`Test failed: ${response.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        debugLog('💥 Error testing custom prompt:', error);
        showAlert('Error testing prompt. Please check your API key and try again.');
    }
    
    testCustomPromptBtn.disabled = false;
    testCustomPromptBtn.innerHTML = '🧪 Test Prompt';
}

/**
 * Save a custom prompt
 */
async function saveCustomPrompt() {
    const promptName = customPromptName.value.trim();
    const promptText = customPromptText.value.trim();
    
    if (!promptName || !promptText) {
        showAlert('Please enter both a prompt name and prompt text before saving.');
        return;
    }
    
    // Validate prompt length
    if (promptText.length < 50) {
        showAlert('Prompt is too short. Please provide more detailed instructions (minimum 50 characters).');
        return;
    }
    
    if (promptText.length > 2000) {
        showAlert('Prompt is too long. Please keep it under 2000 characters for optimal performance.');
        return;
    }
    
    saveCustomPromptBtn.disabled = true;
    saveCustomPromptBtn.innerHTML = '<div class="loading"></div>Saving...';
    
    try {
        // Get existing saved prompts
        const storage = await chrome.storage.local.get(['boldtake_custom_prompts']);
        const savedPrompts = storage.boldtake_custom_prompts || [];
        
        // Check for duplicate names
        const existingIndex = savedPrompts.findIndex(p => p.name === promptName);
        
        const newPrompt = {
            id: existingIndex >= 0 ? savedPrompts[existingIndex].id : Date.now().toString(),
            name: promptName,
            text: promptText,
            createdAt: existingIndex >= 0 ? savedPrompts[existingIndex].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: existingIndex >= 0 ? savedPrompts[existingIndex].usageCount : 0
        };
        
        if (existingIndex >= 0) {
            // Update existing prompt
            savedPrompts[existingIndex] = newPrompt;
            showAlert(`✅ Updated prompt "${promptName}" successfully!`);
        } else {
            // Add new prompt
            savedPrompts.push(newPrompt);
            showAlert(`✅ Saved new prompt "${promptName}" successfully!`);
        }
        
        // Save to storage
        await chrome.storage.local.set({ 'boldtake_custom_prompts': savedPrompts });
        
        // Clear form
        customPromptName.value = '';
        customPromptText.value = '';
        
        // Refresh the saved prompts list
        loadSavedPrompts();
        
    } catch (error) {
        debugLog('💥 Error saving custom prompt:', error);
        showAlert('Error saving prompt. Please try again.');
    }
    
    saveCustomPromptBtn.disabled = false;
    saveCustomPromptBtn.innerHTML = '💾 Save Prompt';
}

/**
 * Load and display saved custom prompts
 */
async function loadSavedPrompts() {
    try {
        const storage = await chrome.storage.local.get(['boldtake_custom_prompts']);
        const savedPrompts = storage.boldtake_custom_prompts || [];
        
        if (savedPrompts.length === 0) {
            savedPromptsList.innerHTML = '<div class="no-prompts">No custom prompts saved yet</div>';
            return;
        }
        
        savedPromptsList.innerHTML = savedPrompts.map(prompt => `
            <div class="saved-prompt-item" data-prompt-id="${prompt.id}">
                <div class="prompt-header">
                    <div class="prompt-name">🎯 ${prompt.name}</div>
                    <div class="prompt-meta">
                        <span class="usage-count">Used ${prompt.usageCount} times</span>
                        <span class="created-date">${new Date(prompt.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="prompt-preview">${prompt.text.substring(0, 150)}${prompt.text.length > 150 ? '...' : ''}</div>
                <div class="prompt-actions">
                    <button class="edit-prompt-btn" onclick="editSavedPrompt('${prompt.id}')">✏️ Edit</button>
                    <button class="use-prompt-btn" onclick="useSavedPrompt('${prompt.id}')">🚀 Use</button>
                    <button class="delete-prompt-btn" onclick="deleteSavedPrompt('${prompt.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        debugLog('💥 Error loading saved prompts:', error);
        savedPromptsList.innerHTML = '<div class="no-prompts">Error loading prompts</div>';
    }
}

/**
 * Edit a saved prompt
 */
async function editSavedPrompt(promptId) {
    try {
        const storage = await chrome.storage.local.get(['boldtake_custom_prompts']);
        const savedPrompts = storage.boldtake_custom_prompts || [];
        const prompt = savedPrompts.find(p => p.id === promptId);
        
        if (prompt) {
            customPromptName.value = prompt.name;
            customPromptText.value = prompt.text;
            customPromptToggle.checked = true;
            customPromptBuilder.classList.remove('hidden');
            
            // Scroll to the editor
            customPromptBuilder.scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (error) {
        debugLog('💥 Error editing prompt:', error);
        showAlert('Error loading prompt for editing.');
    }
}

/**
 * Use a saved prompt (activate it for the session)
 */
async function useSavedPrompt(promptId) {
    try {
        const storage = await chrome.storage.local.get(['boldtake_custom_prompts']);
        const savedPrompts = storage.boldtake_custom_prompts || [];
        const prompt = savedPrompts.find(p => p.id === promptId);
        
        if (prompt) {
            // Increment usage count
            prompt.usageCount = (prompt.usageCount || 0) + 1;
            prompt.lastUsed = new Date().toISOString();
            
            // Save updated prompts
            await chrome.storage.local.set({ 'boldtake_custom_prompts': savedPrompts });
            
            // Set as active custom prompt
            await chrome.storage.local.set({ 
                'boldtake_active_custom_prompt': prompt,
                'boldtake_use_custom_prompt': true
            });
            
            customPromptToggle.checked = true;
            showAlert(`✅ Activated custom prompt: "${prompt.name}"`);
            
            // Refresh the list to show updated usage count
            loadSavedPrompts();
        }
        
    } catch (error) {
        debugLog('💥 Error using prompt:', error);
        showAlert('Error activating prompt.');
    }
}

/**
 * Delete a saved prompt
 */
async function deleteSavedPrompt(promptId) {
    if (!confirm('Are you sure you want to delete this custom prompt? This cannot be undone.')) {
        return;
    }
    
    try {
        const storage = await chrome.storage.local.get(['boldtake_custom_prompts']);
        const savedPrompts = storage.boldtake_custom_prompts || [];
        const updatedPrompts = savedPrompts.filter(p => p.id !== promptId);
        
        await chrome.storage.local.set({ 'boldtake_custom_prompts': updatedPrompts });
        
        showAlert('✅ Prompt deleted successfully!');
        loadSavedPrompts();
        
    } catch (error) {
        debugLog('💥 Error deleting prompt:', error);
        showAlert('Error deleting prompt.');
    }
}

// ========================================
// VIRAL HOOK EXAMPLE FUNCTIONALITY
// ========================================

/**
 * Toggle viral hook details visibility
 */
function toggleViralHookDetails() {
    const details = viralHookDetails;
    const isHidden = details.classList.contains('hidden');
    
    if (isHidden) {
        details.classList.remove('hidden');
        viewViralHookBtn.innerHTML = '👁️ Hide Structure';
    } else {
        details.classList.add('hidden');
        viewViralHookBtn.innerHTML = '👁️ View Structure';
    }
}

/**
 * Edit viral hook (load into custom prompt editor)
 */
function editViralHook() {
    const viralHookPrompt = `You are a viral content strategist with deep understanding of social psychology. When replying to tweets about {TWEET}, you should:
1. **HOOK**: Start with a contrarian or surprising angle that makes people stop scrolling
2. **BRIDGE**: Connect your hook to the original tweet's topic with "Here's why..."
3. **VALUE**: Provide a specific insight, statistic, or actionable tip
4. **ENGAGEMENT**: End with a thought-provoking question or bold statement
EXAMPLES:
❌ Bad: "Great point!"
✅ Good: "Actually, 73% of 'overnight successes' took 7+ years. Here's why patience beats speed in startups: [insight]. What's your biggest misconception about success?"
TONE: Confident but not arrogant, insightful, slightly contrarian
LENGTH: 180-280 characters for maximum engagement
GOAL: Make people think "I never thought of it that way" and want to reply`;

    customPromptName.value = 'Viral Hook Master (Custom)';
    customPromptText.value = viralHookPrompt;
    customPromptToggle.checked = true;
    customPromptBuilder.classList.remove('hidden');
    
    // Scroll to the editor
    customPromptBuilder.scrollIntoView({ behavior: 'smooth' });
    
    showAlert('✅ Viral Hook loaded into editor! Customize it and save as your own.');
}

/**
 * Copy viral hook to clipboard
 */
function copyViralHookToEditor() {
    const viralHookPrompt = `You are a viral content strategist with deep understanding of social psychology. When replying to tweets about {TWEET}, you should:
1. **HOOK**: Start with a contrarian or surprising angle that makes people stop scrolling
2. **BRIDGE**: Connect your hook to the original tweet's topic with "Here's why..."
3. **VALUE**: Provide a specific insight, statistic, or actionable tip
4. **ENGAGEMENT**: End with a thought-provoking question or bold statement
EXAMPLES:
❌ Bad: "Great point!"
✅ Good: "Actually, 73% of 'overnight successes' took 7+ years. Here's why patience beats speed in startups: [insight]. What's your biggest misconception about success?"
TONE: Confident but not arrogant, insightful, slightly contrarian
LENGTH: 180-280 characters for maximum engagement
GOAL: Make people think "I never thought of it that way" and want to reply`;

    navigator.clipboard.writeText(viralHookPrompt).then(() => {
        showAlert('✅ Viral Hook structure copied to clipboard!');
    }).catch(() => {
        showAlert('❌ Failed to copy to clipboard. Please copy manually.');
    });
}

/**
 * Use viral hook as active prompt
 */
async function useViralHookPrompt() {
    try {
        const viralHookPrompt = {
            id: 'viral-hook-builtin',
            name: 'Viral Hook Master (Built-in)',
            text: `You are a viral content strategist with deep understanding of social psychology. When replying to tweets about {TWEET}, you should:
1. **HOOK**: Start with a contrarian or surprising angle that makes people stop scrolling
2. **BRIDGE**: Connect your hook to the original tweet's topic with "Here's why..."
3. **VALUE**: Provide a specific insight, statistic, or actionable tip
4. **ENGAGEMENT**: End with a thought-provoking question or bold statement
EXAMPLES:
❌ Bad: "Great point!"
✅ Good: "Actually, 73% of 'overnight successes' took 7+ years. Here's why patience beats speed in startups: [insight]. What's your biggest misconception about success?"
TONE: Confident but not arrogant, insightful, slightly contrarian
LENGTH: 180-280 characters for maximum engagement
GOAL: Make people think "I never thought of it that way" and want to reply`,
            createdAt: new Date().toISOString(),
            usageCount: 0,
            isBuiltIn: true
        };
        
        // Set as active custom prompt
        await chrome.storage.local.set({ 
            'boldtake_active_custom_prompt': viralHookPrompt,
            'boldtake_use_custom_prompt': true
        });
        
        customPromptToggle.checked = true;
        showAlert('✅ Activated Viral Hook Master strategy!');
        
    } catch (error) {
        debugLog('💥 Error using viral hook:', error);
        showAlert('Error activating Viral Hook strategy.');
    }
}

// ========================================
// KEYWORD ROTATION FUNCTIONALITY
// ========================================

/**
 * Add a keyword to the rotation list
 */
function addKeywordToRotation() {
    const keyword = keywordInput.value.trim();
    
    if (!keyword) {
        showAlert('Please enter a keyword');
        return;
    }
    
    if (keyword.length > 50) {
        showAlert('Keyword too long. Keep it under 50 characters.');
        return;
    }
    
    if (rotationKeywords.length >= 5) {
        showAlert('Maximum 5 keywords allowed for optimal rotation');
        return;
    }
    
    if (rotationKeywords.some(k => k.keyword.toLowerCase() === keyword.toLowerCase())) {
        showAlert('This keyword is already in your rotation');
        return;
    }
    
    const keywordObj = {
        id: Date.now().toString(),
        keyword: keyword,
        addedAt: new Date().toISOString(),
        timesUsed: 0,
        lastUsed: null
    };
    
    rotationKeywords.push(keywordObj);
    keywordInput.value = '';
    
    saveKeywordRotationSettings();
    updateKeywordRotationDisplay();
    
    debugLog('✅ Added keyword to rotation:', keyword);
}

/**
 * Remove a keyword from rotation
 */
function removeKeywordFromRotation(keywordId) {
    rotationKeywords = rotationKeywords.filter(k => k.id !== keywordId);
    saveKeywordRotationSettings();
    updateKeywordRotationDisplay();
    debugLog('🗑️ Removed keyword from rotation');
}

/**
 * Load keyword rotation settings from storage
 */
async function loadKeywordRotationSettings() {
    try {
        const result = await chrome.storage.local.get([
            'boldtake_rotation_keywords',
            'boldtake_daily_target',
            'boldtake_current_rotation_index'
        ]);
        
        rotationKeywords = result.boldtake_rotation_keywords || [];
        
        if (dailyTargetInput && result.boldtake_daily_target) {
            dailyTargetInput.value = result.boldtake_daily_target;
        }
        
        updateKeywordRotationDisplay();
        debugLog('📥 Loaded keyword rotation settings');
    } catch (error) {
        debugLog('❌ Error loading keyword rotation settings:', error);
    }
}

/**
 * Save keyword rotation settings to storage
 */
async function saveKeywordRotationSettings() {
    try {
        await chrome.storage.local.set({
            'boldtake_rotation_keywords': rotationKeywords,
            'boldtake_daily_target': dailyTargetInput?.value || 120
        });
        debugLog('💾 Saved keyword rotation settings');
    } catch (error) {
        debugLog('❌ Error saving keyword rotation settings:', error);
    }
}

/**
 * Update the keyword rotation display
 */
function updateKeywordRotationDisplay() {
    if (!rotationKeywordsList) return;
    
    if (rotationKeywords.length === 0) {
        rotationKeywordsList.innerHTML = '<div class="no-keywords">No keywords added yet. Add 3-5 keywords for optimal rotation.</div>';
        return;
    }
    
    rotationKeywordsList.innerHTML = `
        ${rotationKeywords.length > 0 ? `
            <div class="keyword-management">
                <div class="bulk-actions">
                    <button class="bulk-action-btn" onclick="clearAllKeywords()" title="Remove all keywords">🗑️ Clear All</button>
                    <button class="bulk-action-btn" onclick="shuffleKeywords()" title="Randomize order">🔀 Shuffle</button>
                    <button class="bulk-action-btn" onclick="sortKeywords()" title="Sort alphabetically">📝 Sort A-Z</button>
                    <button class="bulk-action-btn" onclick="resetUsageStats()" title="Reset usage counts">📊 Reset Stats</button>
                </div>
            </div>
        ` : ''}
        ${rotationKeywords.map((keyword, index) => `
            <div class="rotation-keyword-item" data-keyword-id="${keyword.id}" data-index="${index}">
                <div class="keyword-info">
                    <button class="reorder-handle" onclick="moveKeyword('${keyword.id}', 'up')" ${index === 0 ? 'disabled' : ''} title="Move up">▲</button>
                    <button class="reorder-handle" onclick="moveKeyword('${keyword.id}', 'down')" ${index === rotationKeywords.length - 1 ? 'disabled' : ''} title="Move down">▼</button>
                    <div class="keyword-name" onclick="editKeywordInline('${keyword.id}')" title="Click to edit">${keyword.keyword}</div>
                    <div class="keyword-status">Used ${keyword.timesUsed} times</div>
                </div>
                <div class="keyword-actions">
                    <button class="edit-keyword-btn" onclick="editKeywordInline('${keyword.id}')" title="Edit keyword">✏️</button>
                    <button class="remove-keyword-btn" onclick="removeKeywordFromRotation('${keyword.id}')" title="Remove keyword">×</button>
                </div>
            </div>
        `).join('')}
    `;
    
    // Add rotation stats
    const statsHtml = `
        <div class="rotation-stats">
            <span>${rotationKeywords.length}/5 keywords added</span>
            <span>Ready for rotation</span>
        </div>
    `;
    
    rotationKeywordsList.innerHTML += statsHtml;
}

/**
 * Get next keyword in rotation
 */
function getNextRotationKeyword() {
    if (rotationKeywords.length === 0) {
        return null;
    }
    
    // Find least used keyword
    const leastUsedCount = Math.min(...rotationKeywords.map(k => k.timesUsed));
    const availableKeywords = rotationKeywords.filter(k => k.timesUsed === leastUsedCount);
    
    // Select randomly from least used
    const randomIndex = Math.floor(Math.random() * availableKeywords.length);
    const selectedKeyword = availableKeywords[randomIndex];
    
    // Update usage stats
    selectedKeyword.timesUsed++;
    selectedKeyword.lastUsed = new Date().toISOString();
    
    saveKeywordRotationSettings();
    
    return selectedKeyword.keyword;
}

/**
 * Display keywords for selected category
 */
function displayCategoryKeywords() {
    const selectedCategory = categorySelect.value;
    
    if (!selectedCategory || !KEYWORD_CATEGORIES[selectedCategory]) {
        categoryKeywords.innerHTML = '<p class="no-category">Select a category above to see keyword suggestions</p>';
        return;
    }
    
    const keywords = KEYWORD_CATEGORIES[selectedCategory];
    categoryKeywords.innerHTML = keywords.map(keyword => 
        `<span class="keyword-chip" data-keyword="${keyword}" onclick="addSingleKeywordFromChip('${keyword}')">${keyword}</span>`
    ).join('');
    
    debugLog('📋 Displayed keywords for category:', selectedCategory);
}

/**
 * Add all keywords from selected category to rotation
 */
function addAllCategoryKeywords() {
    const selectedCategory = categorySelect.value;
    
    if (!selectedCategory || !KEYWORD_CATEGORIES[selectedCategory]) {
        showAlert('Please select a category first');
        return;
    }
    
    const keywords = KEYWORD_CATEGORIES[selectedCategory];
    let addedCount = 0;
    
    keywords.forEach(keyword => {
        if (rotationKeywords.length >= 5) {
            return; // Stop if we reach the limit
        }
        
        if (!rotationKeywords.some(k => k.keyword.toLowerCase() === keyword.toLowerCase())) {
            const keywordObj = {
                id: Date.now().toString() + Math.random(),
                keyword: keyword,
                addedAt: new Date().toISOString(),
                timesUsed: 0,
                lastUsed: null
            };
            rotationKeywords.push(keywordObj);
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        saveKeywordRotationSettings();
        updateKeywordRotationDisplay();
        showAlert(`Added ${addedCount} keywords from ${selectedCategory} category!`);
        debugLog(`✅ Added ${addedCount} keywords from category:`, selectedCategory);
    } else {
        showAlert('No new keywords to add (limit reached or already exists)');
    }
    
    // Reset category selection
    categorySelect.value = '';
    displayCategoryKeywords();
}

/**
 * Add single keyword from chip click
 */
function addSingleKeywordFromChip(keyword) {
    if (rotationKeywords.length >= 5) {
        showAlert('Maximum 5 keywords allowed for optimal rotation');
        return;
    }
    
    if (rotationKeywords.some(k => k.keyword.toLowerCase() === keyword.toLowerCase())) {
        showAlert('This keyword is already in your rotation');
        return;
    }
    
    const keywordObj = {
        id: Date.now().toString(),
        keyword: keyword,
        addedAt: new Date().toISOString(),
        timesUsed: 0,
        lastUsed: null
    };
    
    rotationKeywords.push(keywordObj);
    saveKeywordRotationSettings();
    updateKeywordRotationDisplay();
    
    showAlert(`Added "${keyword}" to rotation!`);
    debugLog('✅ Added keyword from chip:', keyword);
}

// Make functions globally available
window.editSavedPrompt = editSavedPrompt;
window.useSavedPrompt = useSavedPrompt;
window.deleteSavedPrompt = deleteSavedPrompt;
window.removeKeywordFromRotation = removeKeywordFromRotation;
window.addSingleKeywordFromChip = addSingleKeywordFromChip;

debugLog('✅ BoldTake Professional popup script ready!');
