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
 * This should be called once when the extension loads
 */
async function initializeSupabase() {
    try {
        // Import Supabase from CDN (for Chrome extension compatibility)
        if (!window.supabase) {
            console.error('❌ Supabase library not loaded. Please include supabase-js in your extension.');
            return null;
        }
        
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        
        console.log('✅ Supabase client initialized successfully');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        return null;
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
