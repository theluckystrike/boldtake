/**
 * BoldTake Professional v5.0 - Supabase Configuration
 * 
 * This file handles the Supabase client initialization and configuration
 * for authentication and subscription management.
 */

// Supabase configuration - BoldTake Production Project
const SUPABASE_CONFIG = {
    url: 'https://ckeuqgiuetlwowjoecku.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZXVxZ2l1ZXRsd293am9lY2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTY0MDMsImV4cCI6MjA3MTA5MjQwM30.OSdzhh41uRfMfkdPXs1UT5p_QpVMNqWMRVmUyRhzwhI'
};

// Initialize Supabase client
let supabaseClient = null;

/**
 * Initialize Supabase client
 * CRITICAL FIX: Handle different contexts (popup vs content script)
 */
async function initializeSupabase() {
    try {
        // CONTEXT DETECTION: Check if we're in popup or content script
        const isPopupContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL && !window.location.hostname;
        const isContentScript = typeof window !== 'undefined' && window.location && window.location.hostname === 'x.com';
        
        if (isPopupContext) {
            if (!window.supabase) {
                throw new Error('Supabase library not loaded from CDN');
            }
            
            // POPUP CONTEXT: Use CDN-loaded Supabase
            supabaseClient = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        storage: {
                            getItem: (key) => chrome.storage.local.get([key]).then(result => result[key]),
                            setItem: (key, value) => chrome.storage.local.set({[key]: value}),
                            removeItem: (key) => chrome.storage.local.remove([key])
                        },
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false
                    }
                }
            );
            console.log('✅ Supabase client initialized in popup context');
            return supabaseClient;
        } else if (isContentScript) {
            // CONTENT SCRIPT CONTEXT: Use simplified approach without direct Supabase
            console.log('📱 Content script detected - using message-based auth');
            // Content scripts will communicate with popup for auth operations
            return { isContentScript: true };
        } else {
            console.warn('⚠️ Unknown context - Supabase may not be available');
            return null;
        }
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        return null;
    }
}

/**
 * Get the current Supabase client instance
 * CRITICAL FIX: Handle content script context gracefully
 */
function getSupabaseClient() {
    if (!supabaseClient) {
        // Check if we're in content script context
        const isContentScript = typeof window !== 'undefined' && window.location && window.location.hostname === 'x.com';
        if (isContentScript) {
            console.log('📱 Content script context - auth operations will use message passing');
            return { isContentScript: true };
        }
        console.warn('⚠️ Supabase client not initialized. Call initializeSupabase() first.');
        return null;
    }
    return supabaseClient;
}

/**
 * Check if user is currently authenticated
 * CRITICAL FIX: Handle content script context
 */
async function isUserAuthenticated() {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        
        // Handle content script context
        if (client.isContentScript) {
            // For content scripts, check chrome storage directly
            const result = await chrome.storage.local.get(['boldtake_user_session']);
            return !!(result.boldtake_user_session && result.boldtake_user_session.user);
        }
        
        const { data: { session } } = await client.auth.getSession();
        return session !== null;
    } catch (error) {
        console.error('❌ Error checking authentication status:', error);
        return false;
    }
}

/**
 * Get current user session
 * CRITICAL FIX: Handle content script context
 */
async function getCurrentUser() {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        
        // Handle content script context
        if (client.isContentScript) {
            // For content scripts, get user from chrome storage
            const result = await chrome.storage.local.get(['boldtake_user_session']);
            return result.boldtake_user_session?.user || null;
        }
        
        const { data: { user } } = await client.auth.getUser();
        return user;
    } catch (error) {
        console.error('❌ Error getting current user:', error);
        return null;
    }
}

/**
 * Sign in user with email and password
 */
async function signInUser(email, password) {
    try {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not initialized');
        
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('✅ User signed in successfully');
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        console.error('❌ Sign in failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign out current user
 */
async function signOutUser() {
    try {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not initialized');
        
        const { error } = await client.auth.signOut();
        
        if (error) throw error;
        
        console.log('✅ User signed out successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Sign out failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check user's subscription status and entitlements
 * This calls your Supabase Edge Function
 */
async function checkSubscriptionStatus() {
    try {
        const client = getSupabaseClient();
        if (!client) throw new Error('Supabase client not initialized');
        
        const { data, error } = await client.functions.invoke('check-subscription-status');
        
        if (error) throw error;
        
        console.log('✅ Subscription status retrieved:', data);
        return {
            success: true,
            status: data.status, // 'trialing', 'active', 'inactive'
            limit: data.limit,   // 5, 120, etc.
            ...data
        };
    } catch (error) {
        console.error('❌ Failed to check subscription status:', error);
        return {
            success: false,
            error: error.message,
            status: 'inactive',
            limit: 0
        };
    }
}

// Export functions for use in other files
window.BoldTakeAuth = {
    initializeSupabase,
    getSupabaseClient,
    isUserAuthenticated,
    getCurrentUser,
    signInUser,
    signOutUser,
    checkSubscriptionStatus
};
