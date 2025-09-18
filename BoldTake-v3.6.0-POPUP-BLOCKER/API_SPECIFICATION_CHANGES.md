# 📡 API Specification Changes for Multi-Language Support

## Overview
This document specifies the exact API changes required for the Supabase Edge Function to support multi-language reply generation. These changes are **backward compatible** and will not break existing functionality.

## 🔄 Current API vs. Enhanced API

### Current Request Format (Working)
```json
POST /functions/v1/generate-reply
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "originalTweet": "Just launched our new AI startup! Excited to change the world 🚀",
  "persona": "indie-voice",
  "context": "URL: https://x.com/user/status/123456789"
}
```

### Enhanced Request Format (Required)
```json
POST /functions/v1/generate-reply
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "originalTweet": "Just launched our new AI startup! Excited to change the world 🚀",
  "persona": "indie-voice", 
  "context": "URL: https://x.com/user/status/123456789",
  
  // NEW OPTIONAL FIELDS (backward compatible):
  "language": "spanish",
  "languageInstructions": "RESPOND ENTIRELY IN SPANISH. Use natural, conversational Spanish with proper grammar. Be culturally appropriate for Spanish-speaking audiences.",
  "debugMode": false
}
```

### Current Response Format (Working)
```json
{
  "reply": "Love the energy! Building something meaningful is the best feeling. What problem are you solving?",
  "usage": {
    "used": 47,
    "limit": 120,
    "remaining": 73
  }
}
```

### Enhanced Response Format (Required)
```json
{
  "reply": "¡Me encanta la energía! Construir algo significativo es la mejor sensación. ¿Qué problema están resolviendo?",
  "usage": {
    "used": 47,
    "limit": 120,
    "remaining": 73
  },
  
  // NEW FIELDS (always present):
  "language": "spanish",              // Language actually used in response
  "languageRequested": "spanish",     // Language originally requested
  "method": "enhanced",               // "enhanced" | "fallback" | "standard"
  "confidence": 0.94,                 // AI confidence in language accuracy (0-1)
  
  // DEBUG FIELDS (only when debugMode: true):
  "debug": {
    "promptLength": 2847,
    "processingTime": 1.4,
    "modelUsed": "gpt-4",
    "tokenCount": 156,
    "languageDetected": "spanish",
    "fallbackReason": null
  }
}
```

## 🔧 Implementation Requirements

### 1. Request Validation
```javascript
// Validate incoming request
function validateRequest(body) {
  const { originalTweet, persona, language, languageInstructions } = body;
  
  // Required fields (existing validation)
  if (!originalTweet || !persona) {
    throw new Error('Missing required fields: originalTweet and persona');
  }
  
  // Optional language validation
  if (language && !isSupportedLanguage(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }
  
  // Language instructions should be provided for non-English
  if (language && language !== 'english' && !languageInstructions) {
    console.warn(`Language ${language} requested but no instructions provided`);
  }
  
  return true;
}

// Supported languages list
const SUPPORTED_LANGUAGES = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'dutch', 'russian',
  'japanese', 'korean', 'chinese_simplified', 'chinese_traditional', 'hindi', 'arabic',
  'thai', 'vietnamese', 'indonesian', 'malay', 'filipino', 'turkish', 'polish',
  'swedish', 'norwegian', 'danish', 'finnish', 'czech', 'slovak', 'hungarian',
  'romanian', 'bulgarian', 'croatian', 'serbian', 'ukrainian', 'lithuanian',
  'latvian', 'estonian', 'greek', 'hebrew'
];
```

### 2. Prompt Building Logic
```javascript
// Build AI prompt with language support
function buildPrompt({ originalTweet, persona, language = 'english', languageInstructions }) {
  // Get base persona prompt
  const basePrompt = getPersonaPrompt(persona);
  
  // Replace tweet placeholder
  let prompt = basePrompt.replace('{TWEET}', originalTweet);
  
  // Add language instructions for non-English
  if (language !== 'english' && languageInstructions) {
    prompt += `\n\n${languageInstructions}`;
  }
  
  // Ensure prompt isn't too long (AI model limits)
  if (prompt.length > 6000) {
    console.warn('Prompt too long, truncating:', prompt.length);
    prompt = prompt.substring(0, 5900) + '...';
  }
  
  return prompt;
}
```

### 3. Language Generation with Fallback
```javascript
// Main generation function with fallback logic
export async function generateReply(request) {
  const startTime = Date.now();
  const { 
    originalTweet, 
    persona, 
    language = 'english', 
    languageInstructions,
    debugMode = false 
  } = request;

  try {
    // STEP 1: Try enhanced language generation
    if (language !== 'english' && languageInstructions) {
      const enhancedPrompt = buildPrompt({
        originalTweet,
        persona,
        language,
        languageInstructions
      });
      
      const result = await callAIModel(enhancedPrompt);
      
      // Validate language quality
      const confidence = validateLanguageQuality(result, language);
      
      if (result && result.length > 10 && confidence > 0.7) {
        return buildSuccessResponse({
          reply: result,
          language,
          method: 'enhanced',
          confidence,
          debugMode,
          startTime
        });
      } else {
        console.warn(`Language generation quality too low: ${confidence}`);
      }
    }
    
    // STEP 2: Fallback to standard generation
    console.log(`Using fallback generation for language: ${language}`);
    const standardPrompt = buildPrompt({ originalTweet, persona });
    const fallbackResult = await callAIModel(standardPrompt);
    
    return buildSuccessResponse({
      reply: fallbackResult,
      language: 'english',
      languageRequested: language,
      method: language !== 'english' ? 'fallback' : 'standard',
      confidence: 0.9,
      debugMode,
      startTime,
      fallbackReason: language !== 'english' ? 'Language generation failed quality check' : null
    });
    
  } catch (error) {
    console.error('AI generation failed:', error);
    throw new Error(`Reply generation failed: ${error.message}`);
  }
}
```

### 4. Response Building
```javascript
// Build standardized response
function buildSuccessResponse({
  reply,
  language,
  languageRequested = language,
  method,
  confidence,
  debugMode,
  startTime,
  fallbackReason = null
}) {
  const response = {
    reply: reply,
    language: language,
    languageRequested: languageRequested,
    method: method,
    confidence: confidence,
    usage: getCurrentUsageStats() // Existing usage tracking
  };
  
  // Add debug info if requested
  if (debugMode) {
    response.debug = {
      promptLength: reply.length, // Approximate
      processingTime: (Date.now() - startTime) / 1000,
      modelUsed: getModelName(),
      tokenCount: estimateTokenCount(reply),
      languageDetected: detectLanguage(reply),
      fallbackReason: fallbackReason
    };
  }
  
  return response;
}
```

### 5. Language Quality Validation
```javascript
// Validate that AI response is in expected language
function validateLanguageQuality(text, expectedLanguage) {
  if (expectedLanguage === 'english') {
    return 0.95; // Always high confidence for English
  }
  
  try {
    // Use language detection library or simple heuristics
    const detectedLanguage = detectLanguage(text);
    
    // Calculate confidence based on language patterns
    const confidence = calculateLanguageConfidence(text, expectedLanguage);
    
    // Log for monitoring and improvement
    logLanguageValidation({
      expected: expectedLanguage,
      detected: detectedLanguage,
      confidence: confidence,
      textSample: text.substring(0, 50)
    });
    
    return confidence;
    
  } catch (error) {
    console.error('Language validation failed:', error);
    return 0.5; // Low confidence if validation fails
  }
}

// Simple language detection heuristics
function detectLanguage(text) {
  // Implement basic language detection
  // Could use external library like 'franc' or simple pattern matching
  
  const patterns = {
    spanish: /\b(que|con|una|para|por|como|muy|más|sí|está|son)\b/gi,
    french: /\b(que|avec|une|pour|par|comme|très|plus|oui|est|sont)\b/gi,
    german: /\b(das|mit|eine|für|durch|wie|sehr|mehr|ja|ist|sind)\b/gi,
    // Add more patterns...
  };
  
  let maxMatches = 0;
  let detectedLang = 'unknown';
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = (text.match(pattern) || []).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedLang = lang;
    }
  }
  
  return detectedLang;
}
```

## 🧪 New Testing Endpoints

### 1. Language Testing Endpoint
```javascript
POST /functions/v1/test-language
Content-Type: application/json
Authorization: Bearer {access_token}

// Request
{
  "originalTweet": "Test tweet for language generation",
  "language": "spanish",
  "persona": "indie-voice",
  "debugMode": true
}

// Response
{
  "reply": "Respuesta de prueba en español",
  "language": "spanish",
  "confidence": 0.92,
  "debug": {
    "promptUsed": "Full prompt text here...",
    "processingTime": 1.4,
    "modelUsed": "gpt-4",
    "tokenCount": 45,
    "languageDetected": "spanish"
  },
  "testMode": true  // Indicates this was a test request
}
```

### 2. Supported Languages Endpoint
```javascript
GET /functions/v1/supported-languages

// Response
{
  "languages": [
    {
      "code": "spanish",
      "name": "Spanish (Español)",
      "xComCode": "es",
      "flagEmoji": "🇪🇸",
      "isActive": true,
      "qualityScore": 0.89,
      "avgConfidence": 0.91,
      "totalRequests": 1247,
      "successRate": 0.94
    },
    {
      "code": "french", 
      "name": "French (Français)",
      "xComCode": "fr",
      "flagEmoji": "🇫🇷",
      "isActive": true,
      "qualityScore": 0.86,
      "avgConfidence": 0.88,
      "totalRequests": 892,
      "successRate": 0.91
    }
    // ... more languages
  ],
  "totalSupported": 35,
  "activeLanguages": 32,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

## 🚨 Error Handling Specifications

### Error Response Format
```json
{
  "error": "Error message here",
  "code": "LANGUAGE_GENERATION_FAILED",
  "language": "spanish",
  "fallbackAvailable": true,
  "retryAfter": null,
  "debug": {
    "originalError": "AI model timeout",
    "attemptedLanguage": "spanish",
    "fallbackUsed": false
  }
}
```

### Error Codes
```javascript
const ERROR_CODES = {
  // Language-specific errors
  LANGUAGE_NOT_SUPPORTED: 'Requested language is not supported',
  LANGUAGE_GENERATION_FAILED: 'Failed to generate response in requested language',
  LANGUAGE_QUALITY_LOW: 'Generated response did not meet quality standards',
  LANGUAGE_INSTRUCTIONS_MISSING: 'Language instructions required for non-English',
  
  // Existing errors (unchanged)
  MISSING_REQUIRED_FIELDS: 'Missing originalTweet or persona',
  DAILY_LIMIT_REACHED: 'Daily reply limit reached',
  AUTHENTICATION_FAILED: 'Invalid or expired authentication token',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please slow down'
};
```

### Error Handling Logic
```javascript
// Handle different error scenarios
function handleError(error, context) {
  const { language, debugMode } = context;
  
  if (error.type === 'AI_MODEL_ERROR') {
    return {
      error: ERROR_CODES.LANGUAGE_GENERATION_FAILED,
      code: 'LANGUAGE_GENERATION_FAILED',
      language: language,
      fallbackAvailable: true,
      debug: debugMode ? {
        originalError: error.message,
        attemptedLanguage: language,
        timestamp: new Date().toISOString()
      } : undefined
    };
  }
  
  // Handle other error types...
  return {
    error: error.message,
    code: 'UNKNOWN_ERROR',
    language: language,
    fallbackAvailable: false
  };
}
```

## 📊 Monitoring & Analytics Requirements

### 1. Language Usage Tracking
```javascript
// Track every language request
async function trackLanguageUsage(userId, language, success, confidence, method) {
  await supabase
    .from('language_analytics')
    .insert({
      user_id: userId,
      language_code: language,
      success: success,
      confidence: confidence,
      method: method, // 'enhanced', 'fallback', 'standard'
      response_time: Date.now() - startTime,
      created_at: new Date()
    });
}
```

### 2. Real-time Metrics
```javascript
// Metrics to expose via monitoring endpoint
GET /functions/v1/metrics/languages

{
  "currentHour": {
    "totalRequests": 1247,
    "byLanguage": {
      "english": 856,
      "spanish": 234,
      "french": 89,
      "german": 68
    },
    "successRates": {
      "spanish": 0.94,
      "french": 0.91,
      "german": 0.89
    },
    "avgConfidence": {
      "spanish": 0.91,
      "french": 0.88,
      "german": 0.85
    },
    "fallbackRates": {
      "spanish": 0.06,
      "french": 0.09,
      "german": 0.11
    }
  },
  "last24Hours": {
    // Similar structure for 24-hour metrics
  }
}
```

## 🔒 Backward Compatibility Guarantee

### Existing Requests Still Work
```javascript
// This existing request format will continue to work unchanged:
{
  "originalTweet": "Tweet content",
  "persona": "indie-voice"
}

// Will return existing response format PLUS new fields:
{
  "reply": "Generated response",
  "usage": { "used": 47, "limit": 120, "remaining": 73 },
  
  // New fields (always present now):
  "language": "english",
  "languageRequested": "english", 
  "method": "standard",
  "confidence": 0.95
}
```

### Migration Strategy
1. **Phase 1**: Deploy new API with backward compatibility
2. **Phase 2**: Frontend starts sending language fields
3. **Phase 3**: All requests include language information
4. **Phase 4**: Remove legacy support (6+ months later)

## ✅ Implementation Checklist

### Backend Team Tasks
- [ ] Add new request fields (optional, backward compatible)
- [ ] Implement language instruction processing
- [ ] Add fallback logic (language → English)
- [ ] Implement language quality validation
- [ ] Add new response fields
- [ ] Create language testing endpoint
- [ ] Add supported languages endpoint
- [ ] Implement error handling for language failures
- [ ] Add language usage analytics
- [ ] Create monitoring metrics
- [ ] Write unit tests for language functionality
- [ ] Write integration tests for API changes
- [ ] Deploy to staging environment
- [ ] Performance testing with language processing
- [ ] Deploy to production with feature flags

### Validation Tests Required
```javascript
// Test cases that must pass:
1. Existing requests work unchanged ✓
2. Spanish generation works with high quality ✓
3. Fallback to English works when language fails ✓
4. Error handling works for all scenarios ✓
5. Analytics tracking works correctly ✓
6. Performance meets requirements (<3s) ✓
7. Monitoring and alerting works ✓
```

---

## 🤝 Next Steps

1. **Review**: Backend team reviews this specification
2. **Questions**: Address any technical questions or concerns
3. **Timeline**: Confirm implementation timeline
4. **Development**: Begin implementation with daily check-ins
5. **Testing**: Comprehensive testing before rollout
6. **Deployment**: Gradual rollout with monitoring

**Contact**: Frontend team available for clarification on any technical details or integration requirements.
