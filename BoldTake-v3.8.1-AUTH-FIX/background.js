/**
 * BoldTake Professional v5.0 - Background Service Worker
 * Secure Architecture: All AI generation routed through Supabase Edge Functions
 * 
 * This service worker handles:
 * - AI reply generation through Supabase Edge Functions
 * - Session management and authentication
 * - Message routing between content script and popup
 * - Error handling and retry logic
 */

// Configuration for service worker
const SUPABASE_URL = 'https://ckeuqgiuetlwowjoecku.supabase.co';
const API_ENDPOINT = '/functions/v1/generate-reply';

// Storage keys
const STORAGE_CONFIG = {
  userSession: 'boldtake_user_session',
  authToken: 'sb-ckeuqgiuetlwowjoecku-auth-token',
  usageStats: 'boldtake_usage_stats'
};

// API configuration
const API_CONFIG = {
  timeout: 30000
};

// Session configuration  
const SESSION_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000
};

// Logging functions
const debugLog = (...args) => console.log('[BoldTake]', ...args);
const errorLog = (...args) => console.error('[BoldTake Error]', ...args);

// --- Message Handling ---

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // STABILITY: Add comprehensive message validation
  if (!message || typeof message.type !== 'string') {
    errorLog('CRITICAL: Invalid message received:', message);
    sendResponse({ error: 'Invalid message format' });
    return false;
  }

  try {
    if (message.type === 'GENERATE_REPLY') {
      // STABILITY: Validate required fields
      if (!message.prompt || typeof message.prompt !== 'string') {
        sendResponse({ error: 'Missing or invalid prompt' });
        return false;
      }

      (async () => {
        try {
          const result = await generateReplyWithSupabase(message.prompt, message.tweetContext);
          if (result && result.error) {
            sendResponse(result);
          } else {
            sendResponse({ reply: result });
          }
        } catch (e) {
          errorLog("CRITICAL: Unhandled exception in GENERATE_REPLY listener:", e);
          sendResponse({ error: `FATAL: Background script crashed: ${e.message}` });
        }
      })();
      return true; // Indicates asynchronous response
    }
    
    if (message.type === 'TEST_CUSTOM_PROMPT') {
      // STABILITY: Validate test prompt fields
      if (!message.prompt || !message.tweetContent) {
        sendResponse({ success: false, error: 'Missing required test fields' });
        return false;
      }

      (async () => {
        try {
          const startTime = Date.now();
          
          // Build the test prompt
          const testPrompt = `${message.prompt}\n\nTweet to respond to: "${message.tweetContent}"\n\nLanguage: ${message.language || 'English'}\nTone: ${message.tone || 'Professional'}\n\nGenerate an engaging reply following your instructions.`;
          
          const result = await generateReplyWithSupabase(testPrompt, { isTest: true });
          const processingTime = Date.now() - startTime;
          
          if (result && result.error) {
            sendResponse({ success: false, error: result.error });
          } else {
            sendResponse({ 
              success: true, 
              reply: result,
              processingTime: processingTime
            });
          }
        } catch (e) {
          errorLog("CRITICAL: Error testing custom prompt:", e);
          sendResponse({ success: false, error: `Test failed: ${e.message}` });
        }
      })();
      return true; // Indicates asynchronous response
    }

    if (message.type === 'GET_SESSION_STATS') {
      // STABILITY: Handle session stats request safely
      try {
        sendResponse({
          stats: {
            processed: 0,
            successful: 0,
            failed: 0,
            target: 120,
            isRunning: false,
            recentActivities: []
          }
        });
      } catch (e) {
        errorLog('Error getting session stats:', e);
        sendResponse({ error: 'Failed to get session stats' });
      }
      return false;
    }

    // STABILITY: Handle unknown message types
    debugLog('Unknown message type:', message.type);
    sendResponse({ error: `Unknown message type: ${message.type}` });
    return false;

  } catch (e) {
    errorLog('CRITICAL: Message handler crashed:', e);
    sendResponse({ error: `Message handler error: ${e.message}` });
    return false;
  }
});

/**
 * Generates a reply using Supabase Edge Function (Secure Architecture)
 * Routes all AI generation through your secure backend
 * @param {string} prompt - The full prompt to send to the AI
 * @param {Object} tweetContext - Additional context about the tweet
 * @returns {Promise<string|object>} The AI-generated reply string on success, or an object with an error key on failure
 */
async function generateReplyWithSupabase(prompt, tweetContext = {}) {
  // STABILITY: Input validation
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { error: 'Invalid or empty prompt provided' };
  }

  // STABILITY: Prompt length validation
  if (prompt.length > 8000) {
    return { error: 'Prompt too long - exceeds limits' };
  }

  const maxRetries = 3;
  let lastError = null;

  // Get user session for authentication - BACKGROUND SCRIPT COMPATIBLE
  let userSession = null;
  let accessToken = null;
  
  try {
    // Background scripts must use chrome.storage directly (no window/DOM access)
    const storage = await chrome.storage.local.get([
      STORAGE_CONFIG.userSession, 
      STORAGE_CONFIG.authToken,
      'boldtake_subscription'
    ]);
    
    userSession = storage[STORAGE_CONFIG.userSession];
    
    // Priority 1: Check for Supabase auth token in storage (most reliable)
    const authToken = storage[STORAGE_CONFIG.authToken];
    if (authToken) {
      try {
        const tokenData = typeof authToken === 'string' ? JSON.parse(authToken) : authToken;
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          debugLog('✅ Found Supabase auth token');
          
          // Check if token is expired
          if (tokenData.expires_at) {
            const expiresAt = new Date(tokenData.expires_at * 1000);
            const now = new Date();
            if (expiresAt <= now) {
              errorLog('⚠️ Auth token expired at:', expiresAt);
              return { error: 'Authentication token expired - please login again' };
            }
          }
        }
      } catch (parseError) {
        errorLog('Failed to parse auth token:', parseError);
      }
    }
    
    // Priority 2: Check user session for access token
    if (!accessToken && userSession) {
      if (userSession.access_token) {
        accessToken = userSession.access_token;
        debugLog('✅ Found token in user session (direct)');
      } else if (userSession.user?.access_token) {
        accessToken = userSession.user.access_token;
        debugLog('✅ Found token in user session (nested)');
      } else if (userSession.session?.access_token) {
        accessToken = userSession.session.access_token;
        debugLog('✅ Found token in user session (session nested)');
      }
    }
    
    // Validation: Ensure we have a valid token
    if (!accessToken) {
      errorLog('❌ No valid access token found');
      debugLog('Storage contents:', {
        hasUserSession: !!userSession,
        hasAuthToken: !!authToken,
        userEmail: userSession?.user?.email || 'Unknown'
      });
      return { error: 'Authentication failed - please login again' };
    }
    
    // Debug: Log authentication status
    console.log('🔑 Authentication Status:');
    console.log('  Token:', `${accessToken.substring(0, 20)}...`);
    console.log('  User:', userSession?.user?.email || 'Unknown');
    console.log('  Subscription:', storage.boldtake_subscription?.status || 'Unknown');
    
  } catch (error) {
    errorLog('Critical authentication error:', error);
    return { error: 'Authentication system error - please refresh and try again' };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debugLog(`🔄 Supabase Edge Function attempt ${attempt}/${maxRetries}`);
      
      // STABILITY: Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      try {
        const response = await fetch(`${SUPABASE_URL}${API_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZXVxZ2l1ZXRsd293am9lY2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTY0MDMsImV4cCI6MjA3MTA5MjQwM30.OSdzhh41uRfMfkdPXs1UT5p_QpVMNqWMRVmUyRhzwhI'
          },
          body: JSON.stringify({
            originalTweet: tweetContext.originalText || prompt,
            persona: mapStrategyToPersona(tweetContext.strategy || 'Engagement Indie Voice'),
            context: tweetContext.url ? `URL: ${tweetContext.url}` : undefined,
            // NEW: Language support fields
            language: tweetContext.language || 'english',
            languageInstructions: tweetContext.languageInstructions || undefined,
            debugMode: tweetContext.debugMode || false
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // STABILITY: Enhanced error handling based on your API specification
        if (!response.ok) {
          let errorBody;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = { error: 'Unknown server error' };
          }

          // Handle specific error cases from your API
          if (response.status === 400) {
            const errorMsg = errorBody.error || errorBody.message || 'Bad request';
            errorLog(`400 Error: ${errorMsg}`);
            
            // Handle various authentication/authorization errors
            if (errorMsg.toLowerCase().includes('auth') || 
                errorMsg.toLowerCase().includes('token') ||
                errorMsg.toLowerCase().includes('unauthorized')) {
              // Clear potentially stale auth data
              try {
                await chrome.storage.local.remove([STORAGE_CONFIG.authToken]);
              } catch (e) {
                debugLog('Failed to clear auth token:', e);
              }
              return { error: 'Authentication failed - please login again' };
            }
            
            if (errorMsg.includes('subscription required')) {
              return { error: 'Active subscription required - please upgrade your plan' };
            }
            if (errorMsg.includes('Daily reply limit reached')) {
              return { error: errorMsg }; // Show the exact limit message from your API
            }
            if (errorMsg.includes('Missing required fields')) {
              debugLog('Missing fields in request:', { originalTweet: !!tweetContext.originalText, persona: !!tweetContext.strategy });
              return { error: 'Invalid request format - missing required data' };
            }
            return { error: errorMsg };
          }
          
          if (response.status === 401) {
            errorLog('401 Unauthorized - clearing auth data');
            // Clear auth data to force re-login
            try {
              await chrome.storage.local.remove([STORAGE_CONFIG.authToken, STORAGE_CONFIG.userSession]);
            } catch (e) {
              debugLog('Failed to clear auth data:', e);
            }
            return { error: 'Authentication failed - please login again' };
          }
          
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter) : Math.pow(2, attempt);
            if (attempt < maxRetries) {
              console.log(`⏳ Rate limited. Waiting ${waitTime}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
              continue;
            }
            return { error: 'Rate limit exceeded. Please try again later.' };
          }
          
          if (response.status >= 500) {
            if (attempt < maxRetries) {
              console.log(`🔄 Server error (${response.status}). Retrying in ${attempt * 2}s...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              continue;
            }
          }

          const errorMessage = errorBody.error || `HTTP Error: ${response.status}`;
          throw new Error(`API Error: ${errorMessage}`);
        }

        const data = await response.json();
        
        // STABILITY: Validate response structure
        if (!data || typeof data.reply !== 'string') {
          throw new Error('Invalid response structure from Edge Function');
        }

        const content = data.reply.trim();
        
        // STABILITY: Validate content
        if (!content || content.length === 0) {
          throw new Error('Empty response from AI service');
        }

        if (content.length > 1000) {
          throw new Error('Response too long - potential error');
        }

        // Log usage statistics from your API response format
        if (data.usage) {
          const { used, limit, remaining } = data.usage;
          debugLog(`📊 Daily usage ${used}/${limit} replies (${remaining} remaining)`);
          
          // Store usage stats for potential UI updates
          try {
            await chrome.storage.local.set({
              [STORAGE_CONFIG.usageStats]: {
                used: used,
                limit: limit,
                remaining: remaining,
                lastUpdated: new Date().toISOString()
              }
            });
          } catch (storageError) {
            errorLog('⚠️ Failed to store usage stats:', storageError);
          }
        }

        debugLog(`✅ Supabase Edge Function success on attempt ${attempt}`);
        return content;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          lastError = new Error('Request timeout - Edge Function took too long to respond');
        } else {
          lastError = fetchError;
        }
        
        if (attempt < SESSION_CONFIG.maxRetries) {
          debugLog(`⚠️ Attempt ${attempt} failed: ${lastError.message}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, attempt * SESSION_CONFIG.retryDelay));
          continue;
        }
      }

    } catch (error) {
      lastError = error;
      
      if (attempt < SESSION_CONFIG.maxRetries) {
        debugLog(`⚠️ Attempt ${attempt} failed: ${error.message}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, attempt * SESSION_CONFIG.retryDelay));
        continue;
      }
    }
  }

  errorLog("BoldTake - All Edge Function attempts failed:", lastError);
  return { error: `AI generation failed after ${SESSION_CONFIG.maxRetries} attempts: ${lastError?.message || 'Unknown error'}` };
}

/**
 * Maps BoldTake extension strategies to Supabase Edge Function personas
 * @param {string} strategy - The strategy name from the extension
 * @returns {string} The corresponding persona for the Edge Function (one of 9 supported)
 */
function mapStrategyToPersona(strategy) {
  // ✅ RESTORED: Backend now supports ALL original personas (9 total)
  const strategyToPersonaMap = {
    "Engagement Indie Voice": "indie-voice",     // ✅ Matches backend
    "Engagement Spark Reply": "spark-reply",     // ✅ Matches backend  
    "Engagement The Counter": "counter",         // ✅ Matches backend (note: 'counter' not 'the-counter')
    "The Viral Shot": "viral-shot",              // ✅ Matches backend
    "The Riff": "riff",                          // ✅ Matches backend
    "The Shout-Out": "shout-out",                // ✅ Matches backend
    "Unknown": "indie-voice",                    // ✅ Safe default
    "Fallback": "indie-voice"                    // ✅ Safe default
  };

  // ✅ ALL 9 PERSONAS: Backend team added all original personas
  const supportedPersonas = [
    "indie-voice", "spark-reply", "counter", "riff", 
    "viral-shot", "shout-out", "tech-enthusiast", "business-minded", 
    "supportive-community"
  ];
  
  const mappedPersona = strategyToPersonaMap[strategy] || "indie-voice";
  
  // Validate the persona is supported
  if (!supportedPersonas.includes(mappedPersona)) {
    console.warn(`⚠️ Unsupported persona '${mappedPersona}', falling back to 'indie-voice'`);
    return "indie-voice";
  }
  
  console.log(`🎯 Persona mapping ${strategy} → ${mappedPersona}`);
  return mappedPersona;
}
