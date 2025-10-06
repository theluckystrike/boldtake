/**
 * BoldTake Professional - Configuration Management
 * Centralized configuration for all extension components
 * 
 * This file provides a single source of truth for all configuration values
 * and ensures proper separation of concerns across the extension.
 */

// === PRODUCTION CONFIGURATION ===
const BOLDTAKE_CONFIG = {
    // Supabase Configuration
    supabase: {
        url: 'https://ckeuqgiuetlwowjoecku.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZXVxZ2l1ZXRsd293am9lY2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTY0MDMsImV4cCI6MjA3MTA5MjQwM30.OSdzhh41uRfMfkdPXs1UT5p_QpVMNqWMRVmUyRhzwhI'
    },
    
    // API Endpoints
    api: {
        generateReply: '/functions/v1/generate-reply',
        checkSubscription: '/functions/v1/extension-check-subscription',
        timeout: 30000 // 30 seconds
    },
    
    // Extension Settings
    extension: {
        version: '1.0.8',
        name: 'BoldTake Professional',
        productionMode: true,
        debugMode: false
    },
    
    // Session Management
    session: {
        maxRetries: 3,
        retryDelay: 1000, // 1 second base delay
        defaultTarget: 120,
        maxRepliesPerDay: 120
    },
    
    // Storage Keys (for consistency)
    storage: {
        userSession: 'boldtake_user_session',
        authToken: 'sb-ckeuqgiuetlwowjoecku-auth-token',
        keyword: 'boldtake_keyword',
        minFaves: 'boldtake_min_faves',
        language: 'boldtake_language',
        tone: 'boldtake_tone',
        usageStats: 'boldtake_usage_stats',
        totalComments: 'boldtake_total_comments',
        dailyComments: 'boldtake_daily_comments',
        commentHistory: 'boldtake_comment_history',
        lastResetDate: 'boldtake_last_reset_date',
        autoRestartSettings: 'boldtake_auto_restart_settings',
        autoRestartLog: 'boldtake_auto_restart_log',
        lastAutoRestart: 'boldtake_last_auto_restart'
    },
    
    // Auto-Restart Configuration
    autoRestart: {
        enabled: true,
        defaultIntervalMs: 60 * 60 * 1000, // 1 hour
        minIntervalMs: 15 * 60 * 1000, // 15 minutes minimum
        maxIntervalMs: 4 * 60 * 60 * 1000, // 4 hours maximum
        intervals: [
            { label: '15 minutes', value: 15 * 60 * 1000 },
            { label: '30 minutes', value: 30 * 60 * 1000 },
            { label: '1 hour', value: 60 * 60 * 1000 },
            { label: '2 hours', value: 2 * 60 * 60 * 1000 },
            { label: '3 hours', value: 3 * 60 * 60 * 1000 },
            { label: '4 hours', value: 4 * 60 * 60 * 1000 }
        ]
    }
};

// === VALIDATION FUNCTIONS ===

/**
 * Validates that all required configuration values are present
 * @returns {Object} Validation result with success status and any errors
 */
function validateConfiguration() {
    const errors = [];
    
    // Validate Supabase configuration
    if (!BOLDTAKE_CONFIG.supabase.url || BOLDTAKE_CONFIG.supabase.url === '') {
        errors.push('Supabase URL is missing or empty');
    }
    
    if (!BOLDTAKE_CONFIG.supabase.anonKey || BOLDTAKE_CONFIG.supabase.anonKey === '') {
        errors.push('Supabase anonymous key is missing or empty');
    }
    
    // Validate URL format
    try {
        new URL(BOLDTAKE_CONFIG.supabase.url);
    } catch (e) {
        errors.push('Supabase URL format is invalid');
    }
    
    // Validate JWT token format (basic check)
    if (BOLDTAKE_CONFIG.supabase.anonKey && !BOLDTAKE_CONFIG.supabase.anonKey.includes('.')) {
        errors.push('Supabase anonymous key format appears invalid (not a JWT token)');
    }
    
    return {
        success: errors.length === 0,
        errors: errors
    };
}

/**
 * Gets the full API URL for a given endpoint
 * @param {string} endpoint - The endpoint path (e.g., '/functions/v1/generate-reply')
 * @returns {string} Full API URL
 */
function getApiUrl(endpoint) {
    return `${BOLDTAKE_CONFIG.supabase.url}${endpoint}`;
}

/**
 * Gets configuration for a specific component
 * @param {string} component - Component name ('supabase', 'api', 'extension', 'session', 'storage')
 * @returns {Object} Component configuration
 */
function getConfig(component) {
    return BOLDTAKE_CONFIG[component] || {};
}

/**
 * Debug logging function that respects production mode
 * @param {...any} args - Arguments to log
 */
function debugLog(...args) {
    if (!BOLDTAKE_CONFIG.extension.productionMode || BOLDTAKE_CONFIG.extension.debugMode) {
        console.log('[BoldTake]', ...args);
    }
}

/**
 * Error logging function (always logs regardless of mode)
 * @param {...any} args - Arguments to log
 */
function errorLog(...args) {
    console.error('[BoldTake Error]', ...args);
}

// === EXPORT CONFIGURATION ===

// Make configuration available globally for all extension components
if (typeof window !== 'undefined') {
    window.BoldTakeConfig = {
        config: BOLDTAKE_CONFIG,
        validateConfiguration,
        getApiUrl,
        getConfig,
        debugLog,
        errorLog
    };
}

// For Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        config: BOLDTAKE_CONFIG,
        validateConfiguration,
        getApiUrl,
        getConfig,
        debugLog,
        errorLog
    };
}

// Validate configuration on load
const validation = validateConfiguration();
if (!validation.success) {
    console.error('🚨 BoldTake Configuration Errors:', validation.errors);
    throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
} else {
    console.log('✅ BoldTake configuration validated successfully');
}
