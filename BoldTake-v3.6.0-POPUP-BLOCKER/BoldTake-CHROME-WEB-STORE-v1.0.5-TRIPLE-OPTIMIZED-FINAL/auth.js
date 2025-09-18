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
        
        // EMERGENCY HOTFIX: Manual override for paid user lipmichal@gmail.com
        // TODO: Remove this after webhook is fixed
        if (authState.user && authState.user.email === 'lipmichal@gmail.com') {
            console.log('🔧 EMERGENCY OVERRIDE: Activating premium status for paid user');
            const overrideResult = {
                success: true,
                status: 'active',
                limit: 120
            };
            console.log('🎉 Applied manual override - user should now have premium access');
            
            authState.subscriptionStatus = {
                status: overrideResult.status,
                limit: overrideResult.limit,
                lastCheck: Date.now()
            };
            
            // Store subscription status locally
            await chrome.storage.local.set({
                boldtake_subscription: authState.subscriptionStatus
            });
            
            console.log('✅ Emergency override applied:', authState.subscriptionStatus);
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
            
            console.log('✅ Subscription status updated:', authState.subscriptionStatus);
            updateUIForSubscriptionStatus();
            return authState.subscriptionStatus;
        } else {
            console.error('❌ Failed to check subscription:', result.error);
            
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
                
                console.log(`🛡️ CUSTOMER PROTECTION: ${isNewUser ? 'New user' : 'Grace period'} - maintaining ${fallbackStatus} status`);
            } else {
                // Only after grace period expires
                authState.subscriptionStatus = {
                    status: 'inactive',
                    limit: 0,
                    lastCheck: Date.now()
                };
                console.log('⏰ Grace period expired - showing verification screen');
            }
            
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
 * Create login form dynamically
 */
function createLoginForm() {
    const loginForm = document.createElement('div');
    loginForm.id = 'login-form';
    loginForm.style.cssText = `
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
    
    loginForm.innerHTML = `
        <div style="text-align: center; color: white; max-width: 400px;">
            <h1 style="font-size: 2rem; margin-bottom: 1rem; background: linear-gradient(135deg, #34D399, #10B981); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                <span>Bold</span><span style="color: #34D399;">Take</span>
            </h1>
            <p style="color: #9CA3AF; margin-bottom: 2rem;">Please log in to access BoldTake Professional</p>
            
            <div style="background: #1F2937; padding: 2rem; border-radius: 1rem; border: 1px solid #374151;">
                <input type="email" id="login-email" placeholder="Enter your email" 
                    style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #374151; border-radius: 0.5rem; background: #111827; color: white; font-size: 1rem;">
                
                <input type="password" id="login-password" placeholder="Enter your password"
                    style="width: 100%; padding: 0.75rem; margin-bottom: 1.5rem; border: 1px solid #374151; border-radius: 0.5rem; background: #111827; color: white; font-size: 1rem;">
                
                <button id="login-submit" 
                    style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #34D399, #10B981); border: none; border-radius: 0.5rem; color: white; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.3s ease;">
                    Sign In
                </button>
                
                <div id="login-error" style="color: #EF4444; margin-top: 1rem; text-align: center; display: none;"></div>
            </div>
            
            <p style="color: #6B7280; margin-top: 1.5rem; font-size: 0.875rem;">
                Don't have an account? <a href="#" id="signup-link" style="color: #34D399; text-decoration: none;">Sign up here</a>
            </p>
        </div>
    `;
    
    // Add event listeners
    const submitBtn = loginForm.querySelector('#login-submit');
    const emailInput = loginForm.querySelector('#login-email');
    const passwordInput = loginForm.querySelector('#login-password');
    
    submitBtn.addEventListener('click', handleLogin);
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    return loginForm;
}

/**
 * Handle login form submission
 */
async function handleLogin() {
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit');
    
    if (!email || !password) {
        showLoginError('Please enter both email and password');
        return;
    }
    
    try {
        submitBtn.textContent = 'Signing In...';
        submitBtn.disabled = true;
        
        const success = await window.BoldTakeAuth.signIn(email, password);
        
        if (success) {
            console.log('✅ Login successful');
            await initializeAuth(); // Refresh auth state
        } else {
            showLoginError('Invalid email or password');
        }
    } catch (error) {
        console.error('❌ Login failed:', error);
        showLoginError('Login failed. Please try again.');
    } finally {
        submitBtn.textContent = 'Sign In';
        submitBtn.disabled = false;
    }
}

/**
 * Show login error message
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Show login UI
 */
function showLoginUI() {
    console.log('🎨 Showing login UI');
    
    // Hide main extension UI (use actual class from popup.html)
    const mainContent = document.querySelector('.content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Create and show login form if it doesn't exist
    let loginForm = document.getElementById('login-form');
    if (!loginForm) {
        loginForm = createLoginForm();
        document.body.appendChild(loginForm);
    }
    loginForm.style.display = 'block';
    
    // Update any auth-related UI elements
    updateAuthUI();
}

/**
 * Show authenticated UI
 */
function showAuthenticatedUI() {
    console.log('🎨 Showing authenticated UI');
    
    // Show main extension UI (use actual class from popup.html)
    const mainContent = document.querySelector('.content');
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
            
            // A+++ FEATURE: Show celebration message for upgrade (once only)
            console.log('🎉 SUBSCRIPTION ACTIVATED! Welcome to BoldTake Professional!');
            console.log('✅ UI TRANSITION: Trial → Active subscription completed');
            
            // Success notification disabled to prevent spam
            // showUpgradeSuccessNotification();
            break;
            
        case 'inactive':
        default:
            // CRITICAL BUSINESS PROTECTION: Never lock out users who might be paying
            // Always show refresh button prominently and give benefit of the doubt
            console.warn('⚠️ BUSINESS CRITICAL: User appears inactive - showing verification screen');
            
            // Show lock screen but with customer-friendly messaging
            if (subscriptionLocked) subscriptionLocked.style.display = 'flex';
            if (mainContent) mainContent.style.display = 'none';
            
            // Auto-attempt refresh for potential paying customers
            setTimeout(async () => {
                console.log('🔄 Auto-attempting subscription refresh for customer protection...');
                try {
                    await refreshSubscriptionStatus();
                } catch (error) {
                    console.log('⚠️ Auto-refresh failed, user can manually refresh');
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
