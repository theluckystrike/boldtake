/**
 * BoldTake - Professional X.com Automation
 * Background Service Worker
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
          const result = await generateReplyWithOpenAI(message.prompt);
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
          
          const result = await generateReplyWithOpenAI(testPrompt);
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
 * Generates a reply using the OpenAI API.
 * Reads the API key securely from chrome.storage.local.
 * @param {string} prompt - The full prompt to send to the AI.
 * @returns {Promise<string|object>} The AI-generated reply string on success, or an object with an error key on failure.
 */
async function generateReplyWithOpenAI(prompt) {
  // STABILITY: Input validation
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return { error: 'Invalid or empty prompt provided' };
  }

  // STABILITY: Prompt length validation (OpenAI has limits)
  if (prompt.length > 8000) {
    return { error: 'Prompt too long - exceeds API limits' };
  }

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 OpenAI API attempt ${attempt}/${maxRetries}`);
      
      // STABILITY: API key validation
      const apiKey = 'REPLACE_WITH_OPENAI_KEY';
      
      if (!apiKey || apiKey === 'REPLACE_WITH_OPENAI_KEY' || apiKey.length < 10) {
        return { error: 'CRITICAL: OpenAI API key not configured or invalid' };
      }

      // STABILITY: Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `You are BoldTake, an AI expert at crafting engaging, human-like replies for X.com.
Your replies MUST follow these rules:
- STRICTLY NO @ mentions, # hashtags, or emojis.
- DO NOT use special characters like em dashes (—); use standard hyphens (-) for pauses.
- Write in pure, plain text only.
- Keep the reply concise, between 200 and 250 characters.
- Sound authentic, confident, and avoid generic phrases.
- Adopt the specific persona and goal described in the user's prompt.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 100,
            temperature: 0.8
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // STABILITY: Enhanced error handling
        if (!response.ok) {
          if (response.status === 401) {
            return { error: 'CRITICAL: Your OpenAI API key is invalid or has expired.' };
          }
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter) : Math.pow(2, attempt);
            if (attempt < maxRetries) {
              console.log(`⏳ Rate limited. Waiting ${waitTime}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
              continue;
            }
            return { error: 'OpenAI API rate limit exceeded. Try again later.' };
          }
          if (response.status >= 500) {
            if (attempt < maxRetries) {
              console.log(`🔄 Server error (${response.status}). Retrying in ${attempt * 2}s...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              continue;
            }
          }

          let errorBody;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = { error: { message: 'Unknown API error' } };
          }
          
          const errorMessage = errorBody.error?.message || `HTTP Error: ${response.status}`;
          throw new Error(`OpenAI API error: ${errorMessage}`);
        }

        const data = await response.json();
        
        // STABILITY: Validate response structure
        if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
          throw new Error('Invalid API response structure');
        }

        const content = data.choices[0]?.message?.content?.trim();
        
        // STABILITY: Validate content
        if (!content || content.length === 0) {
          throw new Error('Empty response from OpenAI API');
        }

        if (content.length > 1000) {
          throw new Error('Response too long - potential API error');
        }

        console.log(`✅ OpenAI API success on attempt ${attempt}`);
        return content;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          lastError = new Error('Request timeout - OpenAI API took too long to respond');
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

  console.error("BoldTake - All OpenAI API attempts failed:", lastError);
  return { error: `API failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}` };
}
