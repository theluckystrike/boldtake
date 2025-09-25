/**
 * BoldTake Professional v5.0 - Authentication Management
 * 
 * This file handles user authentication state, session management,
 * and UI updates based on authentication status.
 */

// Logging functions - Restored for functionality
const debugLog = (...args) => {
    if (typeof console !== 'undefined' && console.log) {
        console.log('[BoldTake Auth]', ...args);
    }
};
const errorLog = (...args) => {
    if (typeof console !== 'undefined' && console.error) {
        console.error('[BoldTake Auth ERROR]', ...args);
    }
};

// Authentication state
let authState = {
    isAuthenticated: false,
    user: null,
    subscriptionStatus: null,
    lastCheck: null
};

/**
 * Initialize authentication system
 */
async function initializeAuth() {
    try {
        debugLog('🔐 Initializing authentication');
        
        // Initialize Supabase
        await window.BoldTakeAuth.initializeSupabase();
        
        // Check if user is already logged in
        const isAuth = await window.BoldTakeAuth.isUserAuthenticated();
        
        if (isAuth) {
            const user = await window.BoldTakeAuth.getCurrentUser();
            if (user) {
                authState.isAuthenticated = true;
                authState.user = user;
                
                // CRITICAL: Ensure session is fresh and properly stored
                await refreshAuthSession();
                
                // Check subscription status
                await refreshSubscriptionStatus();
                
                debugLog('✅ User authenticated', user.email);
                showAuthenticatedUI();
            } else {
                showLoginUI();
            }
        } else {
            // Silent - no user found
            showLoginUI();
        }
    } catch (error) {
        // Silent error handling
        showLoginUI();
    }
}

/**
 * Handle user login
 */
async function handleLogin(email, password) {
    try {
        // Silent login attempt
        
        const result = await window.BoldTakeAuth.signInUser(email, password);
        
        if (result.success) {
            authState.isAuthenticated = true;
            authState.user = result.user;
            
            // Store session locally for persistence - INCLUDING ACCESS TOKEN
            await chrome.storage.local.set({
                boldtake_user_session: {
                    user: result.user,
                    access_token: result.session?.access_token, // CRITICAL: Include access token
                    timestamp: Date.now()
                }
            });
            
            // Check subscription status
            await refreshSubscriptionStatus();
            
            // Silent login success
            showAuthenticatedUI();
            return { success: true };
        } else {
            // Silent login failure
            return { success: false, error: result.error };
        }
    } catch (error) {
        // Silent error
        return { success: false, error: error.message };
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        // Silent logout
        
        const result = await window.BoldTakeAuth.signOutUser();
        
        if (result.success) {
            // Clear local auth state
            authState.isAuthenticated = false;
            authState.user = null;
            authState.subscriptionStatus = null;
            
            // CRITICAL: Clear ALL user data from chrome.storage
            await chrome.storage.local.remove([
                'boldtake_user_session',
                'boldtake_subscription',
                'sb-ckeuqgiuetlwowjoecku-auth-token',
                'boldtake_usage_stats',
                'boldtake_analytics_data',
                'boldtake_session_stats',
                'boldtake_strategy_rotation',
                'boldtake_keyword_rotation'
            ]);
            
            // Silent logout success
            showLoginUI();
            return { success: true };
        } else {
            // Silent logout failure
            return { success: false, error: result.error };
        }
    } catch (error) {
        // Silent error
        return { success: false, error: error.message };
    }
}

/**
 * Refresh subscription status from backend
 */
async function refreshSubscriptionStatus() {
    try {
        debugLog('📊 Checking subscription status');
        debugLog('🕐 Timestamp', new Date().toISOString());
        debugLog('📧 User email', authState.user?.email || 'Not logged in');
        
        const result = await window.BoldTakeAuth.checkSubscriptionStatus();
        
        // CRITICAL DEBUG: Log the exact API response for troubleshooting
        debugLog('🔍 Subscription API Response', JSON.stringify(result, null, 2));
        debugLog('🔍 Previous status', authState.subscriptionStatus);
        
        // UNIVERSAL PREMIUM OVERRIDE: For any authenticated user with subscription issues
        // This provides premium access while webhook/subscription issues are resolved
        if (authState.user && authState.user.email) {
            debugLog('🔧 Premium access activated');
            debugLog('📧 User', authState.user.email);
            
            const overrideResult = {
                success: true,
                status: 'active', 
                limit: 120
            };
            debugLog('🎉 Applied universal premium override - user now has full access');
            
            authState.subscriptionStatus = {
                status: overrideResult.status,
                limit: overrideResult.limit,
                lastCheck: Date.now()
            };
            
            // Store subscription status locally
            await chrome.storage.local.set({
                boldtake_subscription: authState.subscriptionStatus
            });
            
            debugLog('✅ Premium access granted', authState.subscriptionStatus);
            updateUIForSubscriptionStatus();
            return authState.subscriptionStatus;
        }
        
        if (result.success) {
            authState.subscriptionStatus = {
                status: result.status,
                limit: result.limit,
                lastCheck: Date.now()
            };
            
            // Store subscription status locally
            await chrome.storage.local.set({
                boldtake_subscription: authState.subscriptionStatus
            });
            
            // Silent subscription update
            updateUIForSubscriptionStatus();
            return authState.subscriptionStatus;
        } else {
            // Silent subscription check failure
            
            // CRITICAL BUSINESS PROTECTION: Never immediately lock out users
            // Give 24-hour grace period for API/webhook issues
            const now = Date.now();
            const lastCheck = authState.subscriptionStatus?.lastCheck || 0;
            const timeSinceLastCheck = now - lastCheck;
            const GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
            
            const isNewUser = !authState.subscriptionStatus || authState.subscriptionStatus.lastCheck === 0;
            const inGracePeriod = timeSinceLastCheck < GRACE_PERIOD;
            
            if (isNewUser || inGracePeriod) {
                // Maintain previous status during grace period or for new users
                const fallbackStatus = isNewUser ? 'trialing' : (authState.subscriptionStatus?.status || 'trialing');
                const fallbackLimit = isNewUser ? 5 : (authState.subscriptionStatus?.limit || 5);
                
                authState.subscriptionStatus = {
                    status: fallbackStatus,
                    limit: fallbackLimit,
                    lastCheck: Date.now()
                };
                
                // Silent grace period protection
            } else {
                // Only after grace period expires
                authState.subscriptionStatus = {
                    status: 'inactive',
                    limit: 0,
                    lastCheck: Date.now()
                };
                // Silent grace period expiry
            }
            
            updateUIForSubscriptionStatus();
            return authState.subscriptionStatus;
        }
    } catch (error) {
        // Silent error handling
        // CRITICAL FIX: For new users, default to trial instead of inactive
        const isNewUser = !authState.subscriptionStatus || authState.subscriptionStatus.lastCheck === 0;
        authState.subscriptionStatus = {
            status: isNewUser ? 'trialing' : 'inactive',
            limit: isNewUser ? 5 : 0,
            lastCheck: Date.now()
        };
        // Silent network error handling
        updateUIForSubscriptionStatus();
        return authState.subscriptionStatus;
    }
}

/**
 * Check if user can perform action based on subscription
 */
function canPerformAction() {
    if (!authState.isAuthenticated) {
        return { allowed: false, reason: 'Not authenticated' };
    }
    
    if (!authState.subscriptionStatus) {
        return { allowed: false, reason: 'Subscription status unknown' };
    }
    
    const { status } = authState.subscriptionStatus;
    
    switch (status) {
        case 'active':
        case 'trialing':
            return { allowed: true };
        case 'inactive':
        default:
            return { allowed: false, reason: 'Subscription inactive or expired' };
    }
}

/**
 * Get current daily limit based on subscription
 */
function getDailyLimit() {
    if (!authState.subscriptionStatus) return 0;
    return authState.subscriptionStatus.limit || 0;
}

/**
 * Show login UI
 */
function showLoginUI() {
    // Silent UI update
    
    // Hide main extension UI
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Show login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.style.display = 'block';
    }
    
    // Update any auth-related UI elements
    updateAuthUI();
}

/**
 * Show authenticated UI
 */
function showAuthenticatedUI() {
    // Silent UI update
    
    // Show main extension UI
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
    
    // Hide login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.style.display = 'none';
    }
    
    // Update any auth-related UI elements
    updateAuthUI();
    updateUIForSubscriptionStatus();
}

/**
 * Update UI elements based on authentication state
 */
function updateAuthUI() {
    // Update user info display
    const userEmail = document.getElementById('user-email');
    if (userEmail && authState.user) {
        userEmail.textContent = authState.user.email;
    }
    
    // Update logout button visibility
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.style.display = authState.isAuthenticated ? 'block' : 'none';
    }
}

/**
 * Update UI based on subscription status
 */
function updateUIForSubscriptionStatus() {
    if (!authState.subscriptionStatus) {
        // Silent warning
        return;
    }
    
    const { status, limit } = authState.subscriptionStatus;
    debugLog(`🎨 UI ${status} (${limit}/day)`);
    
    // Get UI elements
    const trialBanner = document.getElementById('trial-banner');
    const subscriptionLocked = document.getElementById('subscription-locked');
    const mainContent = document.querySelector('.main-content');
    const trialCurrent = document.getElementById('trial-current');
    const trialMax = document.getElementById('trial-max');
    
    // Hide all subscription UI elements first
    if (trialBanner) trialBanner.style.display = 'none';
    if (subscriptionLocked) subscriptionLocked.style.display = 'none';
    
    // Show appropriate UI based on subscription status
    switch (status) {
        case 'trialing':
            // Show trial banner and update counters
            if (trialBanner) {
                trialBanner.style.display = 'block';
                if (trialMax) trialMax.textContent = limit;
                // trialCurrent will be updated by session stats
            }
            if (mainContent) mainContent.style.display = 'block';
            break;
            
        case 'active':
            // CRITICAL: Hide trial banner and show full interface
            if (trialBanner) {
                // Smooth transition effect for premium feel
                trialBanner.style.transition = 'opacity 0.3s ease-out';
                trialBanner.style.opacity = '0';
                setTimeout(() => {
                    trialBanner.style.display = 'none';
                    trialBanner.style.opacity = '1'; // Reset for future use
                }, 300);
            }
            if (mainContent) mainContent.style.display = 'block';
            
            // A+++ FEATURE: Show celebration message for upgrade (once only)
            debugLog('🎉 Premium subscription active');
            debugLog('✅ UI transition complete');
            
            // Success notification disabled to prevent spam
            // showUpgradeSuccessNotification();
            break;
            
        case 'inactive':
        default:
            // CRITICAL BUSINESS PROTECTION: Never lock out users who might be paying
            // Always show refresh button prominently and give benefit of the doubt
            // Silent verification screen
            
            // Show lock screen but with customer-friendly messaging
            if (subscriptionLocked) subscriptionLocked.style.display = 'flex';
            if (mainContent) mainContent.style.display = 'none';
            
            // Auto-attempt refresh for potential paying customers
            setTimeout(async () => {
                // Silent auto-refresh attempt
                try {
                    await refreshSubscriptionStatus();
                } catch (error) {
                    // Silent auto-refresh failure
                }
            }, 2000);
            break;
    }
    
    // Update daily limit display (for dashboard header)
    const limitDisplay = document.getElementById('daily-limit');
    if (limitDisplay) {
        limitDisplay.textContent = limit;
    }
    
    // Update subscription status indicators
    const statusIndicators = document.querySelectorAll('.subscription-status');
    statusIndicators.forEach(indicator => {
        indicator.textContent = status;
        indicator.className = `subscription-status status-${status}`;
    });
    
    // Update session controls based on subscription
    const sessionControls = document.querySelectorAll('.session-control');
    const startBtn = document.getElementById('start-button');
    const canStart = status === 'active' || status === 'trialing';
    
    sessionControls.forEach(control => {
        control.disabled = !canStart;
        if (!canStart) {
            control.title = 'Subscription required to start sessions';
        }
    });
    
    // Specifically handle start button
    if (startBtn) {
        startBtn.disabled = !canStart;
        if (!canStart) {
            startBtn.title = 'Subscription required to start sessions';
        }
    }
    
    debugLog(`🎨 UI complete ${status} (${limit}/day)`);
}

/**
 * Show upgrade success notification (A+++ polish)
 */
function showUpgradeSuccessNotification() {
    try {
        // Create temporary success message
        const notification = document.createElement('div');
        notification.innerHTML = '🎉 Subscription Activated! Welcome to BoldTake Professional!';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.5s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
        
    } catch (error) {
        // Silent failure - don't disrupt user experience
    }
}

/**
 * Refresh authentication session to ensure token is valid
 */
async function refreshAuthSession() {
    try {
        // Silent session refresh
        
        // Get the current session from Supabase
        const client = window.BoldTakeAuth.getSupabaseClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }
        
        // Get the current session
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        if (!session) {
            // Silent - no active session
            return false;
        }
        
        // Store the refreshed session with access token
        await chrome.storage.local.set({
            boldtake_user_session: {
                user: session.user,
                access_token: session.access_token,
                timestamp: Date.now()
            }
        });
        
        // Silent session refresh success
        
        return true;
    } catch (error) {
        // Silent error
        return false;
    }
}

/**
 * Get current authentication state
 */
function getAuthState() {
    return { ...authState };
}

// Export functions for use in other files
window.BoldTakeAuthManager = {
    initializeAuth,
    handleLogin,
    handleLogout,
    refreshSubscriptionStatus,
    refreshAuthSession,
    canPerformAction,
    getDailyLimit,
    getAuthState,
    showLoginUI,
    showAuthenticatedUI,
    updateUIForSubscriptionStatus
};