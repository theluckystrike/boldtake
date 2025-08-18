/**
 * BoldTake Professional v5.0 - Background Service Worker
 * Secure Architecture: All AI generation routed through Supabase Edge Functions
 */

// --- Message Handling ---

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // STABILITY: Add comprehensive message validation
  if (!message || typeof message.type !== 'string') {
    console.error('CRITICAL: Invalid message received:', message);
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
          console.error("CRITICAL: Unhandled exception in GENERATE_REPLY listener:", e);
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
          console.error("CRITICAL: Error testing custom prompt:", e);
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
        console.error('Error getting session stats:', e);
        sendResponse({ error: 'Failed to get session stats' });
      }
      return false;
    }

    // STABILITY: Handle unknown message types
    console.warn('Unknown message type:', message.type);
    sendResponse({ error: `Unknown message type: ${message.type}` });
    return false;

  } catch (e) {
    console.error('CRITICAL: Message handler crashed:', e);
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

  // Get user session for authentication with token refresh handling
  let userSession = null;
  try {
    // First, try to get current session from Supabase (handles token refresh automatically)
    const currentUser = await window.BoldTakeAuth.getCurrentUser();
    if (currentUser) {
      userSession = { user: currentUser, access_token: currentUser.access_token };
    } else {
      // Fallback to local storage if Supabase session unavailable
      const storage = await chrome.storage.local.get(['boldtake_user_session']);
      userSession = storage.boldtake_user_session;
    }
    
    if (!userSession || !userSession.user) {
      return { error: 'User not authenticated - please login' };
    }
  } catch (error) {
    console.error('Failed to get user session:', error);
    return { error: 'Authentication error - please login again' };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Supabase Edge Function attempt ${attempt}/${maxRetries}`);
      
      // STABILITY: Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('https://ckeuqgiuetlwowjoecku.supabase.co/functions/v1/generate-reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userSession.access_token || userSession.user.access_token}`
          },
          body: JSON.stringify({
            originalTweet: tweetContext.originalText || prompt,
            persona: mapStrategyToPersona(tweetContext.strategy || 'witty'),
            context: tweetContext.url ? `URL: ${tweetContext.url}` : undefined
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
            const errorMsg = errorBody.error || 'Bad request';
            if (errorMsg.includes('authorization header')) {
              return { error: 'Authentication failed - please login again' };
            }
            if (errorMsg.includes('subscription required')) {
              return { error: 'Active subscription required - please upgrade your plan' };
            }
            if (errorMsg.includes('Daily reply limit reached')) {
              return { error: errorMsg }; // Show the exact limit message from your API
            }
            if (errorMsg.includes('Missing required fields')) {
              return { error: 'Invalid request format - missing originalTweet or persona' };
            }
            return { error: errorMsg };
          }
          
          if (response.status === 401) {
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
          console.log(`📊 Daily usage: ${used}/${limit} replies (${remaining} remaining)`);
          
          // Store usage stats for potential UI updates
          try {
            await chrome.storage.local.set({
              'boldtake_usage_stats': {
                used: used,
                limit: limit,
                remaining: remaining,
                lastUpdated: new Date().toISOString()
              }
            });
          } catch (storageError) {
            console.warn('⚠️ Failed to store usage stats:', storageError);
          }
        }

        console.log(`✅ Supabase Edge Function success on attempt ${attempt}`);
        return content;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          lastError = new Error('Request timeout - Edge Function took too long to respond');
        } else {
          lastError = fetchError;
        }
        
        if (attempt < maxRetries) {
          console.log(`⚠️ Attempt ${attempt} failed: ${lastError.message}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }

    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`⚠️ Attempt ${attempt} failed: ${error.message}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
    }
  }

  console.error("BoldTake - All Edge Function attempts failed:", lastError);
  return { error: `AI generation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}` };
}

/**
 * Maps BoldTake extension strategies to Supabase Edge Function personas
 * @param {string} strategy - The strategy name from the extension
 * @returns {string} The corresponding persona for the Edge Function (one of 9 supported)
 */
function mapStrategyToPersona(strategy) {
  const strategyToPersonaMap = {
    "Engagement Indie Voice": "thought-leader",  // Independent, analytical responses
    "Engagement Spark Reply": "witty",           // Engaging, conversation starters  
    "Engagement The Counter": "contrarian",      // Challenge opinions, counter-arguments
    "The Viral Shot": "storyteller",             // Hooks, trending, narrative content
    "The Riff": "casual",                        // Comedy, light-hearted, casual tone
    "The Shout-Out": "supportive",               // Encouraging, achievement-focused
    "Unknown": "witty",                          // Default fallback
    "Fallback": "professional"                   // Safe, professional default
  };

  // Ensure we only return supported personas from your API
  const supportedPersonas = [
    "witty", "contrarian", "supportive", "expert", "casual", 
    "professional", "thought-leader", "storyteller", "data-driven"
  ];
  
  const mappedPersona = strategyToPersonaMap[strategy] || "witty";
  
  // Validate the persona is supported
  if (!supportedPersonas.includes(mappedPersona)) {
    console.warn(`⚠️ Unsupported persona '${mappedPersona}', falling back to 'witty'`);
    return "witty";
  }
  
  return mappedPersona;
}
