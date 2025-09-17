/**
 * Unit Tests for Content Script
 * Following Meta/Google testing standards
 */

describe('ContentScript', () => {
  let chrome;
  
  beforeEach(() => {
    // Mock Chrome APIs
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn()
        }
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
    
    // Mock DOM
    document.body.innerHTML = `
      <div data-testid="tweet">
        <button data-testid="reply">Reply</button>
        <button data-testid="like">Like</button>
      </div>
    `;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Tweet Processing', () => {
    test('should find unprocessed tweets', () => {
      const tweets = findUnprocessedTweets();
      expect(tweets.length).toBeGreaterThan(0);
    });
    
    test('should skip already processed tweets', () => {
      const tweet = document.querySelector('[data-testid="tweet"]');
      tweet.setAttribute('data-boldtake-processed', 'true');
      
      const tweets = findUnprocessedTweets();
      expect(tweets.length).toBe(0);
    });
    
    test('should skip already liked tweets', () => {
      const likeButton = document.querySelector('[data-testid="like"]');
      likeButton.setAttribute('data-testid', 'unlike');
      
      const shouldProcess = shouldProcessTweet(likeButton.parentElement);
      expect(shouldProcess).toBe(false);
    });
  });
  
  describe('Rate Limiting', () => {
    test('should respect minimum delay between actions', async () => {
      const start = Date.now();
      await processNextTweet();
      await processNextTweet();
      const duration = Date.now() - start;
      
      expect(duration).toBeGreaterThanOrEqual(SECURITY_CONFIG.MIN_DELAY_BETWEEN_ACTIONS);
    });
    
    test('should enforce burst protection', async () => {
      const results = [];
      
      // Try to process 10 tweets rapidly
      for (let i = 0; i < 10; i++) {
        results.push(await attemptAction());
      }
      
      // Should have some rejections due to burst protection
      const rejected = results.filter(r => r === false);
      expect(rejected.length).toBeGreaterThan(0);
    });
    
    test('should track hourly limits', async () => {
      sessionStats.hourlyActions = SECURITY_CONFIG.MAX_COMMENTS_PER_HOUR - 1;
      
      const canProceed1 = await checkHourlyLimit();
      expect(canProceed1).toBe(true);
      
      sessionStats.hourlyActions++;
      
      const canProceed2 = await checkHourlyLimit();
      expect(canProceed2).toBe(false);
    });
  });
  
  describe('Network Recovery', () => {
    test('should queue operations when offline', async () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      const result = await sendMessage({ type: 'TEST' });
      expect(result).toBeNull();
      expect(retryQueue.length).toBe(1);
    });
    
    test('should process retry queue when back online', async () => {
      retryQueue.push(jest.fn());
      retryQueue.push(jest.fn());
      
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      
      window.dispatchEvent(new Event('online'));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(retryQueue.length).toBe(0);
    });
    
    test('should retry failed network requests', async () => {
      chrome.runtime.sendMessage.mockRejectedValueOnce(new Error('Network error'));
      chrome.runtime.sendMessage.mockResolvedValueOnce({ success: true });
      
      const result = await sendMessageWithRetry({ type: 'TEST' });
      expect(result.success).toBe(true);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle API timeout gracefully', async () => {
      chrome.runtime.sendMessage.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 40000))
      );
      
      const result = await sendMessageWithTimeout({ type: 'TEST' }, 1000);
      expect(result).toBeNull();
    });
    
    test('should handle DOM changes during processing', async () => {
      const tweet = document.querySelector('[data-testid="tweet"]');
      
      // Remove tweet mid-processing
      setTimeout(() => tweet.remove(), 100);
      
      const result = await processTweet(tweet);
      expect(result).toBe(false);
    });
    
    test('should recover from modal stuck state', async () => {
      // Mock stuck modal
      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      document.body.appendChild(modal);
      
      const recovered = await recoverFromStuckModal();
      expect(recovered).toBe(true);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
  });
  
  describe('Security', () => {
    test('should sanitize user input', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });
    
    test('should validate message origin', () => {
      const validSender = { tab: { url: 'https://x.com/home' } };
      const invalidSender = { tab: { url: 'https://evil.com' } };
      
      expect(isValidSender(validSender)).toBe(true);
      expect(isValidSender(invalidSender)).toBe(false);
    });
    
    test('should prevent injection attacks', () => {
      const payload = "'; DROP TABLE users; --";
      const safe = escapeForAPI(payload);
      
      expect(safe).not.toContain('DROP');
      expect(safe).not.toContain(';');
    });
  });
  
  describe('Performance', () => {
    test('should not leak memory', () => {
      const initialMemory = performance.memory.usedJSHeapSize;
      
      // Process 100 tweets
      for (let i = 0; i < 100; i++) {
        processTweetSync();
      }
      
      // Force garbage collection (if available)
      if (global.gc) global.gc();
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const leak = finalMemory - initialMemory;
      
      // Should not leak more than 10MB
      expect(leak).toBeLessThan(10 * 1024 * 1024);
    });
    
    test('should process tweets within performance budget', async () => {
      const start = performance.now();
      await processTweet();
      const duration = performance.now() - start;
      
      // Should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
    });
  });
});
