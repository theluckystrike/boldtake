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
        // CRITICAL FIX: Check for Supabase library availability
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase library not loaded. Make sure supabase.min.js is included.');
        }
        
        // Create Supabase client with Chrome extension storage
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    storage: {
                        getItem: async (key) => {
                            try {
                                const result = await chrome.storage.local.get([key]);
                                return result[key] || null;
                            } catch (error) {
                                console.error('Storage getItem error:', error);
                                return null;
                            }
                        },
                        setItem: async (key, value) => {
                            try {
                                await chrome.storage.local.set({[key]: value});
                            } catch (error) {
                                console.error('Storage setItem error:', error);
                            }
                        },
                        removeItem: async (key) => {
                            try {
                                await chrome.storage.local.remove([key]);
                            } catch (error) {
                                console.error('Storage removeItem error:', error);
                            }
                        }
                    },
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false
                }
            }
        );
        
        // Supabase client initialized successfully
        return supabaseClient;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        throw error; // Re-throw to be handled by calling code
    }
}

/**
 * Get the current Supabase client instance
 */
function getSupabaseClient() {
    if (!supabaseClient) {
        console.warn('⚠️ Supabase client not initialized. Call initializeSupabase() first.');
        return null;
    }
    return supabaseClient;
}

/**
 * Check if user is currently authenticated
 */
async function isUserAuthenticated() {
    try {
        const client = getSupabaseClient();
        if (!client) return false;
        
        const { data: { session } } = await client.auth.getSession();
        return session !== null;
    } catch (error) {
        console.error('❌ Error checking authentication status:', error);
        return false;
    }
}

/**
 * Get current user session
 */
async function getCurrentUser() {
    try {
        const client = getSupabaseClient();
        if (!client) return null;
        
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
        
        // User signed in successfully
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
        
        // User signed out successfully
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
        
        // Subscription status retrieved successfully
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
