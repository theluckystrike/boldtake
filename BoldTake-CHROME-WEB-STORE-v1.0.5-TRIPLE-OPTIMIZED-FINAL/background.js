/**
 * BoldTake - Professional X.com Automation
 * Background Service Worker - STANDALONE AUTHENTICATION ARCHITECTURE
 * 
 * This service worker handles:
 * - Standalone authentication with Supabase
 * - Automatic token refresh
 * - Session management in chrome.storage.local
 * - AI reply generation with proper JWT tokens
 */

// Supabase configuration
const SUPABASE_CONFIG = {
    url: 'https://ckeuqgiuetlwowjoecku.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZXVxZ2l1ZXRsd293am9lY2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTY0MDMsImV4cCI6MjA3MTA5MjQwM30.OSdzhh41uRfMfkdPXs1UT5p_QpVMNqWMRVmUyRhzwhI'
};

// Session storage keys
const STORAGE_KEYS = {
    SESSION: 'boldtake_session',
    USER: 'boldtake_user'
};

// --- Standalone Authentication System ---

/**
 * Sign in user with email and password
 */
async function signInUser(email, password) {
  try {
    console.log('🔐 Signing in user:', email);
    
    const response = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.message || 'Sign in failed');
    }

    const data = await response.json();
    
    // Store session in chrome.storage.local
    await chrome.storage.local.set({
      [STORAGE_KEYS.SESSION]: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        expires_in: data.expires_in,
        token_type: data.token_type,
        user: data.user
      },
      [STORAGE_KEYS.USER]: data.user
    });

    console.log('✅ User signed in successfully');
    
    // Schedule token refresh
    scheduleTokenRefresh(data.expires_in);
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ Sign in failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sign out user
 */
async function signOutUser() {
  try {
    // Clear stored session
    await chrome.storage.local.remove([STORAGE_KEYS.SESSION, STORAGE_KEYS.USER]);
    
    // Clear any scheduled token refresh
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
      tokenRefreshTimer = null;
    }
    
    console.log('✅ User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Sign out failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get current session from storage
 */
async function getCurrentSession() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SESSION]);
    return result[STORAGE_KEYS.SESSION] || null;
  } catch (error) {
    console.error('❌ Error getting session:', error.message);
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken() {
  try {
    const session = await getCurrentSession();
    if (!session || !session.refresh_token) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing access token...');

    const response = await fetch(`${SUPABASE_CONFIG.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.anonKey
      },
      body: JSON.stringify({
        refresh_token: session.refresh_token
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.message || 'Token refresh failed');
    }

    const data = await response.json();
    
    // Update session in storage
    const updatedSession = {
      ...session,
      access_token: data.access_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
      // Keep existing refresh_token if not provided
      refresh_token: data.refresh_token || session.refresh_token
    };

    await chrome.storage.local.set({
      [STORAGE_KEYS.SESSION]: updatedSession
    });

    console.log('✅ Access token refreshed successfully');
    
    // Schedule next refresh
    scheduleTokenRefresh(data.expires_in);
    
    return { success: true, session: updatedSession };
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    
    // If refresh fails, user needs to log in again
    await signOutUser();
    
    return { success: false, error: error.message };
  }
}

/**
 * Schedule automatic token refresh
 */
let tokenRefreshTimer = null;

function scheduleTokenRefresh(expiresIn) {
  // Clear existing timer
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }
  
  // Schedule refresh 5 minutes before expiration
  const refreshIn = (expiresIn - 300) * 1000; // Convert to milliseconds, subtract 5 minutes
  
  if (refreshIn > 0) {
    tokenRefreshTimer = setTimeout(async () => {
      console.log('⏰ Automatic token refresh triggered');
      await refreshAccessToken();
    }, refreshIn);
    
    console.log(`⏰ Token refresh scheduled in ${Math.round(refreshIn / 1000 / 60)} minutes`);
  }
}

/**
 * Initialize session on startup
 */
async function initializeSession() {
  try {
    const session = await getCurrentSession();
    if (session) {
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at > now) {
        // Token is still valid, schedule refresh
        const expiresIn = session.expires_at - now;
        scheduleTokenRefresh(expiresIn);
        console.log('✅ Existing session restored');
      } else {
        // Token is expired, try to refresh
        console.log('🔄 Token expired, attempting refresh...');
        await refreshAccessToken();
      }
    }
  } catch (error) {
    console.error('❌ Session initialization failed:', error.message);
  }
}

// --- AI Reply Generation Handler ---

/**
 * Handle GENERATE_REPLY messages by calling Supabase Edge Function
 * @param {object} message - The message with tweetText, persona, etc.
 * @param {function} sendResponse - Response callback
 */
async function handleGenerateReply(message, sendResponse) {
  try {
    console.log('🤖 Processing AI reply generation request...');
    
    // Extract parameters from message
    const { 
      tweetText, 
      persona, 
      language = 'english',
      tone = 'professional',
      strategy = 'Engagement Indie Voice'
    } = message;

    // GAUNTLET TEST 1: Comprehensive input validation
    const validationErrors = [];
    
    if (!tweetText || typeof tweetText !== 'string' || tweetText.trim().length === 0) {
      validationErrors.push('Tweet text is required and must be a non-empty string');
    }
    
    if (tweetText && tweetText.length > 2000) {
      validationErrors.push('Tweet text exceeds maximum length of 2000 characters');
    }
    
    if (persona && typeof persona !== 'string') {
      validationErrors.push('Persona must be a string if provided');
    }
    
    if (language && typeof language !== 'string') {
      validationErrors.push('Language must be a string if provided');
    }
    
    if (tone && typeof tone !== 'string') {
      validationErrors.push('Tone must be a string if provided');
    }
    
    if (strategy && typeof strategy !== 'string') {
      validationErrors.push('Strategy must be a string if provided');
    }
    
    if (validationErrors.length > 0) {
      const errorMessage = `Input validation failed: ${validationErrors.join(', ')}`;
      console.error('❌ GENERATE_REPLY validation error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('✅ Input validation passed for GENERATE_REPLY request');

    // Get Supabase client from global scope (injected by content script)
    // Note: We'll need to initialize Supabase in background script or get it from content script
    const supabaseResponse = await callSupabaseGenerateReply({
      tweetText,
      persona,
      language,
      tone,
      strategy
    });

    if (supabaseResponse.success && supabaseResponse.reply) {
      console.log('✅ AI reply generated successfully');
      sendResponse({
        success: true,
        reply: supabaseResponse.reply,
        strategy: supabaseResponse.strategy || strategy
      });
    } else {
      throw new Error(supabaseResponse.error || 'Reply generation failed');
    }

  } catch (error) {
    console.error('❌ AI reply generation failed:', error.message);
    
    // GAUNTLET TEST 1: Categorize error types for better handling
    const errorType = error.message.includes('Input validation failed') ? 'validation' : 
                     error.message.includes('HTTP') ? 'network' :
                     error.message.includes('Supabase') ? 'backend' : 'unknown';
    
    sendResponse({
      success: false,
      error: error.message,
      errorType: errorType,
      fallback: true, // Indicate that content script should use fallback
      timestamp: Date.now() // For debugging
    });
  }
}

/**
 * Call Supabase Edge Function for reply generation
 * @param {object} params - Generation parameters
 * @returns {Promise<object>} Generation result
 */
async function callSupabaseGenerateReply(params) {
  try {
    // STANDALONE AUTH: Get JWT token from our own session management
    const session = await getCurrentSession();
    
    if (!session || !session.access_token) {
      throw new Error('Authentication required: No valid session found. Please log in.');
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at <= now) {
      console.log('🔄 Token expired, refreshing...');
      const refreshResult = await refreshAccessToken();
      
      if (!refreshResult.success) {
        throw new Error('Authentication expired: Please log in again.');
      }
      
      // Use the refreshed session
      session = refreshResult.session;
    }
    
    console.log('🔐 Making authenticated API call with standalone session');
    
    const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/generate-reply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originalTweet: params.tweetText,
        persona: params.persona || 'professional',
        context: `Language: ${params.language || 'english'}, Tone: ${params.tone || 'professional'}, Strategy: ${params.strategy || 'Engagement Indie Voice'}`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      success: true,
      reply: data.reply,
      strategy: data.strategy,
      metadata: data.metadata
    };

  } catch (error) {
    console.error('❌ Supabase Edge Function call failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// --- Message Handling ---

// GAUNTLET TEST 2: Track concurrent requests for debugging
let activeRequests = new Map();
let requestCounter = 0;

// Listen for messages from the content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // GAUNTLET TEST 2: Assign unique ID to each request for tracking
  const requestId = ++requestCounter;
  const startTime = Date.now();
  
  console.log(`📨 [${requestId}] Incoming message: ${message?.type} from ${sender.tab ? 'content' : 'popup'}`);
  
  // Validate message format
  if (!message || typeof message.type !== 'string') {
    console.error(`❌ [${requestId}] Invalid message received:`, message);
    sendResponse({ error: 'Invalid message format', requestId });
    return false;
  }

  // GAUNTLET TEST 2: Track this request
  activeRequests.set(requestId, {
    type: message.type,
    source: sender.tab ? 'content' : 'popup',
    startTime,
    status: 'processing'
  });

  try {
    // Handle status requests from popup
    if (message.type === 'BOLDTAKE_GET_STATUS') {
      // GAUNTLET TEST 2: Instant popup response - no blocking
      console.log(`🚀 [${requestId}] Fast-tracking status request for popup`);
      
      // Forward to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_SESSION_STATUS' }, (response) => {
            const duration = Date.now() - startTime;
            console.log(`✅ [${requestId}] Status request completed in ${duration}ms`);
            activeRequests.delete(requestId);
            sendResponse({ ...(response || { error: 'No response from content script' }), requestId, duration });
          });
        } else {
          const duration = Date.now() - startTime;
          console.log(`⚠️ [${requestId}] No active tab found - ${duration}ms`);
          activeRequests.delete(requestId);
          sendResponse({ error: 'No active tab found', requestId, duration });
        }
      });
      return true; // Async response
    }

    if (message.type === 'BOLDTAKE_GET_COUNTDOWN') {
      // Forward to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_COUNTDOWN_STATUS' }, (response) => {
            sendResponse(response || { error: 'No response from content script' });
          });
        } else {
          sendResponse({ error: 'No active tab found' });
        }
      });
      return true; // Async response
    }

    // Handle authentication requests
    if (message.type === 'SIGN_IN') {
      const wrappedSendResponse = (response) => {
        const duration = Date.now() - startTime;
        console.log(`✅ [${requestId}] SIGN_IN completed in ${duration}ms`);
        activeRequests.delete(requestId);
        sendResponse({ ...response, requestId, duration });
      };
      
      (async () => {
        const result = await signInUser(message.email, message.password);
        wrappedSendResponse(result);
      })();
      return true; // Async response
    }

    if (message.type === 'SIGN_OUT') {
      const wrappedSendResponse = (response) => {
        const duration = Date.now() - startTime;
        console.log(`✅ [${requestId}] SIGN_OUT completed in ${duration}ms`);
        activeRequests.delete(requestId);
        sendResponse({ ...response, requestId, duration });
      };
      
      (async () => {
        const result = await signOutUser();
        wrappedSendResponse(result);
      })();
      return true; // Async response
    }

    if (message.type === 'GET_SESSION') {
      const wrappedSendResponse = (response) => {
        const duration = Date.now() - startTime;
        console.log(`✅ [${requestId}] GET_SESSION completed in ${duration}ms`);
        activeRequests.delete(requestId);
        sendResponse({ ...response, requestId, duration });
      };
      
      (async () => {
        const session = await getCurrentSession();
        const user = session ? await chrome.storage.local.get([STORAGE_KEYS.USER]) : null;
        wrappedSendResponse({ 
          success: true, 
          session: session, 
          user: user ? user[STORAGE_KEYS.USER] : null,
          isAuthenticated: !!session
        });
      })();
      return true; // Async response
    }

    // Handle AI reply generation requests
    if (message.type === 'GENERATE_REPLY') {
      // GAUNTLET TEST 2: Wrap with completion tracking
      const wrappedSendResponse = (response) => {
        const duration = Date.now() - startTime;
        console.log(`✅ [${requestId}] GENERATE_REPLY completed in ${duration}ms`);
        activeRequests.delete(requestId);
        sendResponse({ ...response, requestId, duration });
      };
      
      handleGenerateReply(message, wrappedSendResponse);
      return true; // Async response
    }

    // Handle session control messages
    if (message.type === 'BOLDTAKE_START' || message.type === 'BOLDTAKE_STOP') {
      // GAUNTLET TEST 3: Prioritize STOP commands for instant response
      if (message.type === 'BOLDTAKE_STOP') {
        console.log(`🛑 [${requestId}] EMERGENCY STOP - Highest priority processing`);
      }
      
      // Forward to content script with priority handling
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { ...message, requestId, priority: message.type === 'BOLDTAKE_STOP' ? 'high' : 'normal' }, (response) => {
            const duration = Date.now() - startTime;
            console.log(`✅ [${requestId}] ${message.type} completed in ${duration}ms`);
            activeRequests.delete(requestId);
            sendResponse({ ...(response || { success: true }), requestId, duration });
          });
        } else {
          const duration = Date.now() - startTime;
          console.log(`⚠️ [${requestId}] No active tab found - ${duration}ms`);
          activeRequests.delete(requestId);
          sendResponse({ error: 'No active tab found', requestId, duration });
        }
      });
      return true; // Async response
    }

    // Handle emergency notifications to popup
    if (message.type === 'EMERGENCY_MODE_ACTIVATED' || message.type === 'EMERGENCY_STOP') {
      // Broadcast to all extension contexts (popup, etc.)
      chrome.runtime.sendMessage(message).catch(() => {
        // Ignore errors if popup is closed
      });
      sendResponse({ success: true });
      return false;
    }

    // Handle unknown message types
    const duration = Date.now() - startTime;
    console.warn(`⚠️ [${requestId}] Unknown message type: ${message.type} - ${duration}ms`);
    activeRequests.delete(requestId);
    sendResponse({ error: `Unknown message type: ${message.type}`, requestId, duration });
    return false;

  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`💥 [${requestId}] Message handler crashed in ${duration}ms:`, e);
    activeRequests.delete(requestId);
    sendResponse({ error: `Message handler error: ${e.message}`, requestId, duration });
    return false;
  }
});

// --- Extension Lifecycle ---

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🚀 BoldTake Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('✅ Welcome to BoldTake Professional!');
  } else if (details.reason === 'update') {
    console.log('🔄 BoldTake updated to version:', chrome.runtime.getManifest().version);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('🔄 BoldTake Extension starting up...');
});

// GAUNTLET DIAGNOSTICS: Add monitoring function
function logActiveRequests() {
  if (activeRequests.size > 0) {
    console.log(`📊 Active requests: ${activeRequests.size}`);
    activeRequests.forEach((req, id) => {
      const duration = Date.now() - req.startTime;
      console.log(`  [${id}] ${req.type} from ${req.source} - ${duration}ms`);
    });
  }
}

// Monitor every 10 seconds for debugging
setInterval(logActiveRequests, 10000);

// Initialize session on startup
initializeSession();

console.log('🎯 BoldTake Background Service Worker loaded - Standalone Authentication Ready!');