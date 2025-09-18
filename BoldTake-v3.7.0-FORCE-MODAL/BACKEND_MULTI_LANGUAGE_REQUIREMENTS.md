# 🌍 BoldTake Multi-Language Support - Backend Requirements

## Overview
This document outlines the backend requirements for implementing multi-language support in the BoldTake Chrome Extension. The extension currently generates AI replies in English and needs to be enhanced to support 35+ languages while maintaining the existing quality and performance.

## Current Architecture Understanding

### Extension → Backend Flow
```
1. User selects language in Chrome Extension popup
2. Extension finds tweets using X.com search with language filter (lang:es)
3. Extension sends tweet + strategy to Supabase Edge Function
4. Backend generates AI reply using selected persona
5. Extension posts reply to X.com
```

### Current API Request Format
```json
POST /functions/v1/generate-reply
{
  "originalTweet": "Tweet content to respond to",
  "persona": "indie-voice",
  "context": "URL: https://x.com/tweet/123"
}
```

### Current API Response Format
```json
{
  "reply": "Generated AI response text",
  "usage": {
    "used": 45,
    "limit": 120,
    "remaining": 75
  }
}
```

## 🎯 Required Backend Changes

### 1. Enhanced API Request Format

**Add these fields to the existing request:**

```json
POST /functions/v1/generate-reply
{
  "originalTweet": "Tweet content to respond to",
  "persona": "indie-voice", 
  "context": "URL: https://x.com/tweet/123",
  
  // NEW FIELDS:
  "language": "spanish",                           // Target response language
  "languageInstructions": "RESPOND ENTIRELY IN SPANISH. Use natural, conversational Spanish with proper grammar. Be culturally appropriate for Spanish-speaking audiences.",
  "debugMode": false                              // For testing without affecting quotas
}
```

### 2. Enhanced API Response Format

**Add these fields to the existing response:**

```json
{
  "reply": "Generated AI response text",
  "usage": {
    "used": 45,
    "limit": 120,
    "remaining": 75
  },
  
  // NEW FIELDS:
  "language": "spanish",                          // Language actually used in response
  "languageRequested": "spanish",                 // Language originally requested
  "method": "enhanced",                          // 'enhanced', 'fallback', or 'standard'
  "confidence": 0.95,                            // AI confidence in language accuracy (0-1)
  
  // DEBUG FIELDS (only when debugMode: true):
  "debug": {
    "promptLength": 2847,
    "processingTime": 1.2,
    "modelUsed": "gpt-4",
    "languageDetected": "spanish",
    "fallbackReason": null
  }
}
```

### 3. Fallback Logic Implementation

**Critical: Always have a working fallback to English**

```javascript
async function generateReply(request) {
  const { originalTweet, persona, language = 'english', languageInstructions, debugMode } = request;
  
  try {
    // STEP 1: Try enhanced language generation
    if (language !== 'english' && languageInstructions) {
      const enhancedPrompt = buildLanguagePrompt(originalTweet, persona, languageInstructions);
      const result = await callAIModel(enhancedPrompt);
      
      // Validate the response is in the requested language
      if (result && result.length > 10 && isValidLanguageResponse(result, language)) {
        return {
          reply: result,
          language: language,
          languageRequested: language,
          method: 'enhanced',
          confidence: calculateConfidence(result, language)
        };
      }
    }
    
    // STEP 2: Fallback to standard English generation
    console.warn(`Language generation failed for ${language}, using English fallback`);
    const standardPrompt = buildStandardPrompt(originalTweet, persona);
    const fallbackResult = await callAIModel(standardPrompt);
    
    return {
      reply: fallbackResult,
      language: 'english',
      languageRequested: language,
      method: 'fallback',
      confidence: 0.9,
      debug: debugMode ? { fallbackReason: 'Language generation failed' } : undefined
    };
    
  } catch (error) {
    // STEP 3: Ultimate error handling
    throw new Error(`AI generation failed: ${error.message}`);
  }
}
```

## 🗄️ Database Schema Requirements

### 1. Supported Languages Table
```sql
CREATE TABLE supported_languages (
  id SERIAL PRIMARY KEY,
  language_code VARCHAR(50) UNIQUE NOT NULL,     -- 'spanish', 'french', etc.
  language_name VARCHAR(100) NOT NULL,           -- 'Spanish (Español)'
  x_com_code VARCHAR(10) NOT NULL,              -- 'es' for X.com search
  flag_emoji VARCHAR(10),                       -- '🇪🇸'
  is_active BOOLEAN DEFAULT true,
  ai_model_support BOOLEAN DEFAULT true,
  quality_score DECIMAL(3,2) DEFAULT 0.8,      -- Track language quality
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Initial data
INSERT INTO supported_languages (language_code, language_name, x_com_code, flag_emoji) VALUES
('english', 'English', 'en', '🇺🇸'),
('spanish', 'Spanish (Español)', 'es', '🇪🇸'),
('french', 'French (Français)', 'fr', '🇫🇷'),
('german', 'German (Deutsch)', 'de', '🇩🇪'),
('italian', 'Italian (Italiano)', 'it', '🇮🇹'),
('portuguese', 'Portuguese (Português)', 'pt', '🇵🇹'),
('japanese', 'Japanese (日本語)', 'ja', '🇯🇵'),
('korean', 'Korean (한국어)', 'ko', '🇰🇷'),
('chinese_simplified', 'Chinese Simplified (简体中文)', 'zh', '🇨🇳'),
('russian', 'Russian (Русский)', 'ru', '🇷🇺'),
('arabic', 'Arabic (العربية)', 'ar', '🇸🇦'),
('hindi', 'Hindi (हिंदी)', 'hi', '🇮🇳');
-- Add more as needed...
```

### 2. User Language Preferences
```sql
-- Add to existing users table
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(50) DEFAULT 'english';
ALTER TABLE users ADD COLUMN language_usage_stats JSONB DEFAULT '{}';
```

### 3. Language Analytics
```sql
CREATE TABLE language_analytics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  language_code VARCHAR(50),
  date DATE DEFAULT CURRENT_DATE,
  replies_generated INTEGER DEFAULT 0,
  successful_generations INTEGER DEFAULT 0,
  fallback_used INTEGER DEFAULT 0,
  avg_confidence DECIMAL(5,3),
  avg_response_time DECIMAL(8,3),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Feature Flags
```sql
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  flag_name VARCHAR(100) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,        -- 0-100
  target_users JSONB DEFAULT '[]',            -- Specific user IDs for testing
  config JSONB DEFAULT '{}',                  -- Additional configuration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Initial flags
INSERT INTO feature_flags (flag_name, is_enabled, rollout_percentage, config) VALUES
('multi_language_support', false, 0, '{"max_languages": 5}'),
('language_debug_mode', true, 100, '{"log_prompts": true}'),
('spanish_support', false, 10, '{"quality_threshold": 0.8}'),
('french_support', false, 5, '{"quality_threshold": 0.8}');
```

## 🔧 New API Endpoints Required

### 1. Language Testing Endpoint
```javascript
POST /functions/v1/test-language
{
  "originalTweet": "Test tweet content",
  "language": "spanish",
  "persona": "indie-voice",
  "debugMode": true
}

// Response includes detailed debug info
{
  "reply": "Respuesta generada en español",
  "language": "spanish",
  "confidence": 0.92,
  "debug": {
    "promptUsed": "Full prompt here...",
    "processingTime": 1.4,
    "modelUsed": "gpt-4",
    "tokenCount": 847
  }
}
```

### 2. Supported Languages Endpoint
```javascript
GET /functions/v1/supported-languages

{
  "languages": [
    {
      "code": "spanish",
      "name": "Spanish (Español)",
      "xComCode": "es",
      "flagEmoji": "🇪🇸",
      "isActive": true,
      "aiSupported": true,
      "qualityScore": 0.89
    }
  ]
}
```

### 3. Feature Flags Endpoint
```javascript
GET /functions/v1/feature-flags?userId=123

{
  "multiLanguageSupport": true,
  "availableLanguages": ["spanish", "french"],
  "debugMode": false
}
```

## 🎯 Implementation Priority

### Phase 1: Core Infrastructure (Week 1)
- [ ] Add language fields to API request/response
- [ ] Implement basic fallback logic
- [ ] Create supported_languages table
- [ ] Add feature flags system
- [ ] Create test endpoint

### Phase 2: Language Support (Week 2)  
- [ ] Add Spanish support (high quality)
- [ ] Add French support
- [ ] Implement confidence scoring
- [ ] Add language analytics tracking
- [ ] Create monitoring dashboard

### Phase 3: Scale & Polish (Week 3)
- [ ] Add 10 more languages
- [ ] Implement cultural context system
- [ ] Add A/B testing for language quality
- [ ] Performance optimization
- [ ] Advanced error handling

## 🧪 Testing Strategy

### 1. Unit Tests Required
```javascript
// Test language fallback logic
test('should fallback to English when language generation fails', async () => {
  const request = {
    originalTweet: "Test tweet",
    persona: "indie-voice", 
    language: "spanish",
    languageInstructions: "RESPOND IN SPANISH"
  };
  
  // Mock AI failure for Spanish
  mockAIResponse.mockRejectedValueOnce(new Error('Language model error'));
  mockAIResponse.mockResolvedValueOnce('English response');
  
  const result = await generateReply(request);
  
  expect(result.language).toBe('english');
  expect(result.method).toBe('fallback');
  expect(result.reply).toBe('English response');
});
```

### 2. Integration Tests Required
- Test each supported language generates valid responses
- Test fallback behavior under various failure conditions  
- Test API response format compliance
- Test feature flag behavior
- Test quota/rate limiting with language requests

### 3. Load Tests Required
- Test performance impact of language instructions
- Test concurrent requests in multiple languages
- Test fallback behavior under high load

## 📊 Monitoring & Analytics

### 1. Key Metrics to Track
- Language generation success rate by language
- Fallback usage rate
- Average confidence scores
- Response time by language
- User language preference distribution
- Quality scores (user feedback)

### 2. Alerting Rules
- Language success rate drops below 85%
- Fallback rate exceeds 20% for any language
- Average response time exceeds 3 seconds
- Any language completely failing for 5+ minutes

### 3. Dashboard Requirements
- Real-time language usage statistics
- Quality trends by language
- Error rates and fallback patterns
- Performance metrics
- Feature flag status

## 🚀 Rollout Strategy

### 1. Gradual Release Plan
- **Week 1**: Spanish only, 10% of users, monitor closely
- **Week 2**: Spanish + French, 25% of users
- **Week 3**: Top 5 languages, 50% of users
- **Week 4**: All languages, 100% of users

### 2. Rollback Plan
- Feature flags allow instant disable of any language
- Automatic fallback to English ensures service continuity
- Monitoring alerts trigger rollback if quality drops

### 3. Success Criteria
- ✅ 90%+ success rate for each language
- ✅ <15% fallback rate
- ✅ <2 second average response time
- ✅ No increase in overall error rate
- ✅ Positive user feedback

## 🔗 Communication

### Daily Standups
- Language implementation progress
- Quality metrics review
- Issue escalation
- Rollout status updates

### Weekly Reviews  
- Comprehensive metrics analysis
- User feedback review
- Performance optimization opportunities
- Next phase planning

---

**Questions or clarifications needed?** Please reach out to the frontend team for any technical details about the extension architecture or user flow.
