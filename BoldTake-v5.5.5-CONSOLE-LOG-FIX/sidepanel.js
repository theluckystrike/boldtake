// Side Panel Controller for BoldTake
let eventCount = 0;
let activityFeed = null;
let isSessionActive = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    activityFeed = document.getElementById('activityFeed');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearLogBtn = document.getElementById('clearLogBtn');
    const copyLogBtn = document.getElementById('copyLogBtn');
    const pauseQueueBtn = document.getElementById('pauseQueueBtn');
    
    // Button event listeners
    startBtn.addEventListener('click', startSession);
    pauseBtn.addEventListener('click', pauseSession);
    stopBtn.addEventListener('click', stopSession);
    clearLogBtn.addEventListener('click', clearLog);
    copyLogBtn.addEventListener('click', copyLog);
    pauseQueueBtn.addEventListener('click', pauseQueue);
    
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SESSION_LOG') {
            addActivity(message.data.message, message.data.type);
        } else if (message.type === 'SESSION_STATS') {
            updateStats(message.data);
        } else if (message.type === 'SESSION_STATUS') {
            updateSessionStatus(message.data.status);
        }
    });
    
    // Check initial session status
    checkSessionStatus();
});

async function startSession() {
    try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab?.url?.includes('x.com') && !tab?.url?.includes('twitter.com')) {
            addActivity('Please navigate to X.com first', 'error');
            return;
        }
        
        // Send start message
        chrome.tabs.sendMessage(tab.id, { type: 'BOLDTAKE_START' }, (response) => {
            if (chrome.runtime.lastError) {
                addActivity('Failed to start session. Please refresh X.com and try again.', 'error');
                return;
            }
            
            isSessionActive = true;
            updateButtons('running');
            updateStatus('Active', true);
            
            // Show patience message
            const patienceMessage = document.getElementById('patienceMessage');
            if (patienceMessage) {
                patienceMessage.style.display = 'block';
            }
            
            clearLog();
            addActivity('🚀 Session started - searching for tweets...', 'success');
        });
        
    } catch (error) {
        console.error('Error starting session:', error);
        addActivity('Error starting session: ' + error.message, 'error');
    }
}

async function pauseSession() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const pauseBtn = document.getElementById('pauseBtn');
        const isPaused = pauseBtn.textContent.includes('Resume');
        
        chrome.tabs.sendMessage(tab.id, { type: 'BOLDTAKE_PAUSE' }, (response) => {
            if (chrome.runtime.lastError) {
                addActivity('Failed to pause/resume session', 'error');
                return;
            }
            
            if (isPaused) {
                pauseBtn.textContent = 'Pause Session';
                updateStatus('Active', true);
                addActivity('▶️ Session resumed', 'success');
            } else {
                pauseBtn.textContent = 'Resume Session';
                updateStatus('Paused', false);
                addActivity('⏸️ Session paused', 'warning');
            }
        });
    } catch (error) {
        console.error('Error pausing session:', error);
    }
}

async function stopSession() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        chrome.tabs.sendMessage(tab.id, { type: 'BOLDTAKE_STOP' }, (response) => {
            if (chrome.runtime.lastError) {
                // Session already stopped
            }
            
            isSessionActive = false;
            updateButtons('stopped');
            updateStatus('Inactive', false);
            
            // Hide patience message
            const patienceMessage = document.getElementById('patienceMessage');
            if (patienceMessage) {
                patienceMessage.style.display = 'none';
            }
            
            addActivity('🛑 Session stopped', 'error');
        });
    } catch (error) {
        console.error('Error stopping session:', error);
    }
}

function updateButtons(state) {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    switch(state) {
        case 'running':
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            pauseBtn.textContent = 'Pause Session';
            break;
        case 'paused':
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            pauseBtn.textContent = 'Resume Session';
            break;
        case 'stopped':
        default:
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            pauseBtn.textContent = 'Pause Session';
            break;
    }
}

function updateStatus(text, isActive) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    const sessionStatus = document.getElementById('sessionStatus');
    
    statusText.textContent = text;
    sessionStatus.textContent = text;
    
    if (isActive) {
        statusDot.classList.add('active');
    } else {
        statusDot.classList.remove('active');
    }
}

function updateStats(stats) {
    if (!stats) return;
    
    // Update replies count
    const repliesCount = document.getElementById('repliesCount');
    if (stats.successful !== undefined) {
        repliesCount.textContent = stats.successful;
        
        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        const progress = Math.min((stats.successful / 200) * 100, 100);
        progressFill.style.width = `${progress}%`;
    }
    
    // Update success rate
    const successRate = document.getElementById('successRate');
    if (stats.processed > 0) {
        const rate = Math.round((stats.successful / stats.processed) * 100);
        successRate.textContent = `${rate}%`;
    }
}

function addActivity(message, type = 'info') {
    // Remove empty state if present
    const emptyState = activityFeed.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create activity item
    const activityItem = document.createElement('div');
    activityItem.className = `activity-item ${type}`;
    
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    activityItem.innerHTML = `
        <div class="activity-time">${time}</div>
        <div class="activity-content">${message}</div>
    `;
    
    // Add to feed (newest first)
    activityFeed.insertBefore(activityItem, activityFeed.firstChild);
    
    // Update event count
    eventCount++;
    document.getElementById('eventCount').textContent = `${eventCount} events`;
    document.getElementById('lastEventTime').textContent = `Last: ${time}`;
    
    // Limit to 50 items
    const items = activityFeed.querySelectorAll('.activity-item');
    if (items.length > 50) {
        items[items.length - 1].remove();
    }
}

function clearLog() {
    activityFeed.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🚀</div>
            <div>Session log cleared. Waiting for activity...</div>
        </div>
    `;
    eventCount = 0;
    document.getElementById('eventCount').textContent = '0 events';
    document.getElementById('lastEventTime').textContent = 'Last: --:--';
}

function copyLog() {
    const items = activityFeed.querySelectorAll('.activity-item');
    const logText = Array.from(items).map(item => {
        const time = item.querySelector('.activity-time').textContent;
        const content = item.querySelector('.activity-content').textContent;
        return `${time} ${content}`;
    }).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
        // Show temporary success message
        const btn = document.getElementById('copyLogBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

function pauseQueue() {
    // This would pause the processing queue
    const btn = document.getElementById('pauseQueueBtn');
    if (btn.textContent === 'Pause Queue') {
        btn.textContent = 'Resume Queue';
        addActivity('⏸️ Processing queue paused', 'warning');
    } else {
        btn.textContent = 'Pause Queue';
        addActivity('▶️ Processing queue resumed', 'success');
    }
}

async function checkSessionStatus() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab?.url?.includes('x.com') || tab?.url?.includes('twitter.com')) {
            chrome.tabs.sendMessage(tab.id, { type: 'GET_SESSION_STATUS' }, (response) => {
                if (chrome.runtime.lastError) {
                    // Content script not loaded yet
                    return;
                }
                
                if (response?.isActive) {
                    updateButtons('running');
                    updateStatus('Active', true);
                    isSessionActive = true;
                    
                    // Show patience message
                    const patienceMessage = document.getElementById('patienceMessage');
                    if (patienceMessage) {
                        patienceMessage.style.display = 'block';
                    }
                    
                    // Request current stats
                    chrome.tabs.sendMessage(tab.id, { type: 'GET_SESSION_STATS' });
                }
            });
        }
    } catch (error) {
        console.error('Error checking session status:', error);
    }
}

// Listen for tab updates to check if user navigates to X.com
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && 
        (tab.url?.includes('x.com') || tab.url?.includes('twitter.com'))) {
        // Give content script time to load
        setTimeout(() => {
            checkSessionStatus();
        }, 1000);
    }
});

// Export for console debugging
window.addActivity = addActivity;