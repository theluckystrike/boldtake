# 🚨 URGENT: Backend Requirements for BoldTake Subscription System

## Executive Summary
The Chrome Extension is **working** but cannot verify user subscriptions. Pro users paying for 500 daily tweets are only getting 120. This needs immediate backend implementation.

---

## 1. 🔴 CRITICAL ENDPOINT NEEDED

### `/functions/v1/extension-check-subscription`

**Method:** `POST`

**Headers:**
```javascript
{
  "Authorization": "Bearer [JWT_TOKEN]",
  "Content-Type": "application/json"
}
```

**Request Body:** 
```javascript
{
  // Optional: can be empty or include user email for verification
  "email": "user@example.com" 
}
```

**Response:**
```javascript
{
  "subscription_tier": "pro" | "starter" | "trial",
  "daily_limit": 500 | 120 | 5,
  "status": "active" | "inactive" | "expired",
  "user_email": "user@example.com",
  "expires_at": "2025-12-31T23:59:59Z" // Optional
}
```

---

## 2. 📊 SUBSCRIPTION TIERS

| Tier | Daily Limit | Database Value | Price |
|------|------------|----------------|-------|
| **Pro** | 500 tweets | "pro" | $XX/month |
| **Starter** | 120 tweets | "starter" | $XX/month |
| **Trial** | 5 tweets | "trial" | Free |

---

## 3. 🔧 IMPLEMENTATION STEPS

### Step 1: Create Supabase Edge Function
```sql
-- Create edge function: extension-check-subscription
CREATE OR REPLACE FUNCTION check_user_subscription(user_id UUID)
RETURNS JSON AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  SELECT 
    s.tier,
    s.status,
    s.expires_at,
    u.email
  INTO subscription_record
  FROM subscriptions s
  JOIN auth.users u ON u.id = s.user_id
  WHERE s.user_id = user_id
  AND s.status = 'active';
  
  IF subscription_record IS NULL THEN
    RETURN json_build_object(
      'subscription_tier', 'trial',
      'daily_limit', 5,
      'status', 'inactive'
    );
  END IF;
  
  RETURN json_build_object(
    'subscription_tier', subscription_record.tier,
    'daily_limit', CASE 
      WHEN subscription_record.tier = 'pro' THEN 500
      WHEN subscription_record.tier = 'starter' THEN 120
      ELSE 5
    END,
    'status', subscription_record.status,
    'user_email', subscription_record.email,
    'expires_at', subscription_record.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: Create HTTP Endpoint
```typescript
// supabase/functions/extension-check-subscription/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401 }
      )
    }

    // Check subscription in database
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('tier, status, expires_at')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      // No subscription = trial user
      return new Response(
        JSON.stringify({
          subscription_tier: 'trial',
          daily_limit: 5,
          status: 'active',
          user_email: user.email
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Map tier to daily limit
    const limits = {
      'pro': 500,
      'starter': 120,
      'trial': 5
    }

    return new Response(
      JSON.stringify({
        subscription_tier: subscription.tier,
        daily_limit: limits[subscription.tier] || 5,
        status: subscription.status,
        user_email: user.email,
        expires_at: subscription.expires_at
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

### Step 3: Deploy the Function
```bash
# Deploy to Supabase
supabase functions deploy extension-check-subscription
```

---

## 4. 🗄️ DATABASE SCHEMA

### Required Tables

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT CHECK (tier IN ('pro', 'starter', 'trial')),
  status TEXT CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

## 5. 🧪 TESTING

### Test with cURL
```bash
# Get a user token first (replace with actual token)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test the endpoint
curl -X POST \
  https://ckeuqgiuetlwowjoecku.supabase.co/functions/v1/extension-check-subscription \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Expected Responses

**Pro User:**
```json
{
  "subscription_tier": "pro",
  "daily_limit": 500,
  "status": "active",
  "user_email": "prouser@example.com",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

**Trial User:**
```json
{
  "subscription_tier": "trial",
  "daily_limit": 5,
  "status": "active",
  "user_email": "trialuser@example.com"
}
```

---

## 6. 🔒 SECURITY CONSIDERATIONS

1. **JWT Validation:** Always validate the JWT token
2. **Rate Limiting:** Implement rate limiting (max 10 requests per minute per user)
3. **CORS:** Configure CORS to only allow requests from Chrome Extension
4. **Logging:** Log all subscription checks for audit trail
5. **Cache:** Consider caching subscription status for 5 minutes to reduce database load

---

## 7. 🚀 DEPLOYMENT CHECKLIST

- [ ] Create Supabase Edge Function
- [ ] Set up database tables
- [ ] Configure CORS settings
- [ ] Test with different subscription tiers
- [ ] Monitor initial requests from extension
- [ ] Set up error alerting
- [ ] Document API in your internal docs

---

## 8. 📊 MONITORING

After deployment, monitor:
- Request volume
- Error rates
- Response times
- Subscription tier distribution

---

## 9. 🆘 SUPPORT

If the extension still shows wrong limits after implementation:
1. Check JWT token is valid
2. Verify subscription record exists in database
3. Check Edge Function logs in Supabase dashboard
4. Test endpoint directly with cURL

---

## 10. 💰 BUSINESS IMPACT

**Current Issue:**
- Pro users paying for 500 tweets/day only get 120
- This is a **75% reduction** in promised value
- Risk of refunds and negative reviews

**After Fix:**
- Pro users get full 500 daily limit
- Happy customers = better retention
- Positive reviews on Chrome Web Store

---

## URGENT: This needs to be deployed ASAP to honor paying customers' subscriptions!

**Extension Version:** v3.7.2 (Working)  
**Backend Requirement:** `/functions/v1/extension-check-subscription`  
**Priority:** 🔴 CRITICAL  
**Estimated Time:** 2-4 hours  

---

*Document created: September 2025*  
*Extension Status: Working but needs subscription verification*
