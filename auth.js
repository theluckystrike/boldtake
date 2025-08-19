/**
 * BoldTake Professional v5.0 - Authentication Management
 * 
 * This file handles user authentication state, session management,
 * and UI updates based on authentication status.
 */

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
        console.log('🔐 Initializing BoldTake authentication system...');
        
        // Initialize Supabase
        await window.BoldTakeAuth.initializeSupabase();
        
        // Check if user is already logged in
        const isAuth = await window.BoldTakeAuth.isUserAuthenticated();
        
        if (isAuth) {
            const user = await window.BoldTakeAuth.getCurrentUser();
            if (user) {
                authState.isAuthenticated = true;
                authState.user = user;
                
                // Check subscription status
                await refreshSubscriptionStatus();
                
                console.log('✅ User already authenticated:', user.email);
                showAuthenticatedUI();
            } else {
                showLoginUI();
            }
        } else {
            console.log('👤 No authenticated user found');
            showLoginUI();
        }
    } catch (error) {
        console.error('❌ Failed to initialize authentication:', error);
        showLoginUI();
    }
}

/**
 * Handle user login
 */
async function handleLogin(email, password) {
    try {
        console.log('🔐 Attempting to sign in user...');
        
        const result = await window.BoldTakeAuth.signInUser(email, password);
        
        if (result.success) {
            authState.isAuthenticated = true;
            authState.user = result.user;
            
            // Store session locally for persistence
            await chrome.storage.local.set({
                boldtake_user_session: {
                    user: result.user,
                    timestamp: Date.now()
                }
            });
            
            // Check subscription status
            await refreshSubscriptionStatus();
            
            console.log('✅ Login successful');
            showAuthenticatedUI();
            return { success: true };
        } else {
            console.error('❌ Login failed:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        console.log('🔐 Signing out user...');
        
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
            
            console.log('✅ Logout successful - all user data cleared');
            showLoginUI();
            return { success: true };
        } else {
            console.error('❌ Logout failed:', result.error);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('❌ Logout error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Refresh subscription status from backend
 */
async function refreshSubscriptionStatus() {
    try {
        console.log('📊 FORCE CHECKING subscription status (ignoring cache)...');
        console.log('🕐 Timestamp:', new Date().toISOString());
        console.log('📧 User email for webhook debugging: lipmichal@gmail.com');
        
        const result = await window.BoldTakeAuth.checkSubscriptionStatus();
        
        // CRITICAL DEBUG: Log the exact API response for troubleshooting
        console.log('🔍 Subscription API Response:', JSON.stringify(result, null, 2));
        console.log('🔍 Previous status:', authState.subscriptionStatus);
        
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
            
            console.log('✅ Subscription status updated:', authState.subscriptionStatus);
            updateUIForSubscriptionStatus();
            return authState.subscriptionStatus;
        } else {
            console.error('❌ Failed to check subscription:', result.error);
            // CRITICAL FIX: For new users, default to trial instead of inactive
            // This prevents the "Subscription Required" screen for legitimate new users
            const isNewUser = !authState.subscriptionStatus || authState.subscriptionStatus.lastCheck === 0;
            authState.subscriptionStatus = {
                status: isNewUser ? 'trialing' : 'inactive',
                limit: isNewUser ? 5 : 0,
                lastCheck: Date.now()
            };
            console.log(`🔧 Subscription check failed - defaulting to ${authState.subscriptionStatus.status} for ${isNewUser ? 'new' : 'existing'} user`);
            updateUIForSubscriptionStatus();
            return authState.subscriptionStatus;
        }
    } catch (error) {
        console.error('❌ Subscription check error:', error);
        // CRITICAL FIX: For new users, default to trial instead of inactive
        const isNewUser = !authState.subscriptionStatus || authState.subscriptionStatus.lastCheck === 0;
        authState.subscriptionStatus = {
            status: isNewUser ? 'trialing' : 'inactive',
            limit: isNewUser ? 5 : 0,
            lastCheck: Date.now()
        };
        console.log(`🔧 Network error during subscription check - defaulting to ${authState.subscriptionStatus.status} for ${isNewUser ? 'new' : 'existing'} user`);
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
    console.log('🎨 Showing login UI');
    
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
    console.log('🎨 Showing authenticated UI');
    
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
        console.warn('⚠️ updateUIForSubscriptionStatus called but no subscription status available');
        return;
    }
    
    const { status, limit } = authState.subscriptionStatus;
    console.log(`🎨 Updating UI for subscription status: ${status} (limit: ${limit})`);
    
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
            
            // A+++ FEATURE: Show celebration message for upgrade
            console.log('🎉 SUBSCRIPTION ACTIVATED! Welcome to BoldTake Professional!');
            console.log('✅ UI TRANSITION: Trial → Active subscription completed');
            
            // Optional: Show brief success notification
            showUpgradeSuccessNotification();
            break;
            
        case 'inactive':
        default:
            // Show lock screen
            if (subscriptionLocked) subscriptionLocked.style.display = 'flex';
            if (mainContent) mainContent.style.display = 'none';
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
    
    console.log(`🎨 UI updated for ${status} subscription (${limit} replies/day)`);
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
        console.log('⚠️ Upgrade notification failed (non-critical):', error);
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
    canPerformAction,
    getDailyLimit,
    getAuthState,
    showLoginUI,
    showAuthenticatedUI,
    updateUIForSubscriptionStatus
};
