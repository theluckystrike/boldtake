// Side Panel Controller for BoldTake
let sessionStartTime = null;
let sessionTimer = null;
let logsContainer = null;
let isSessionActive = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    logsContainer = document.getElementById('logsContainer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // Button event listeners
    startBtn.addEventListener('click', startSession);
    pauseBtn.addEventListener('click', pauseSession);
    stopBtn.addEventListener('click', stopSession);
    clearBtn.addEventListener('click', clearLogs);
    
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SESSION_LOG') {
            addLog(message.data.message, message.data.type);
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
            addLog('Please navigate to X.com first', 'error');
            return;
        }
        
        // Send start message
        chrome.tabs.sendMessage(tab.id, { type: 'BOLDTAKE_START' }, (response) => {
            if (chrome.runtime.lastError) {
                addLog('Failed to start session. Please refresh X.com and try again.', 'error');
                return;
            }
            
            isSessionActive = true;
            sessionStartTime = Date.now();
            startSessionTimer();
            updateButtons('running');
            updateStatus('Running', 'active');
            clearLogs();
            addLog('🚀 Session started successfully!', 'success');
            addLog('Scanning for tweets to engage with...', 'info');
        });
        
    } catch (error) {
        console.error('Error starting session:', error);
        addLog('Error starting session: ' + error.message, 'error');
    }
}

async function pauseSession() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const pauseBtn = document.getElementById('pauseBtn');
        const isPaused = pauseBtn.textContent === 'Resume';
        
        chrome.tabs.sendMessage(tab.id, { type: 'BOLDTAKE_PAUSE' }, (response) => {
            if (chrome.runtime.lastError) {
                addLog('Failed to pause/resume session', 'error');
                return;
            }
            
            if (isPaused) {
                pauseBtn.textContent = 'Pause';
                updateStatus('Running', 'active');
                addLog('▶️ Session resumed', 'success');
            } else {
                pauseBtn.textContent = 'Resume';
                updateStatus('Paused', 'paused');
                addLog('⏸️ Session paused', 'warning');
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
                console.log('Session already stopped');
            }
            
            isSessionActive = false;
            stopSessionTimer();
            updateButtons('stopped');
            updateStatus('Stopped', 'inactive');
            addLog('🛑 Session stopped', 'error');
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
            pauseBtn.textContent = 'Pause';
            break;
        case 'paused':
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            pauseBtn.textContent = 'Resume';
            break;
        case 'stopped':
        default:
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            pauseBtn.textContent = 'Pause';
            break;
    }
}

function updateStatus(text, type) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    
    statusText.textContent = text;
    statusDot.className = `status-dot ${type}`;
}

function updateStats(stats) {
    if (!stats) return;
    
    // Update replies count
    const repliesCount = document.getElementById('repliesCount');
    if (stats.successful !== undefined) {
        repliesCount.textContent = stats.successful;
    }
    
    // Update success rate
    const successRate = document.getElementById('successRate');
    if (stats.processed > 0) {
        const rate = Math.round((stats.successful / stats.processed) * 100);
        successRate.textContent = `${rate}%`;
    }
}

function startSessionTimer() {
    sessionTimer = setInterval(() => {
        if (sessionStartTime) {
            const elapsed = Date.now() - sessionStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            document.getElementById('sessionTime').textContent = timeStr;
        }
    }, 1000);
}

function stopSessionTimer() {
    if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
    }
    sessionStartTime = null;
    document.getElementById('sessionTime').textContent = '00:00';
}

function addLog(message, type = 'info') {
    // Remove empty state if present
    const emptyState = logsContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create log entry
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'log-time';
    timeDiv.textContent = new Date().toLocaleTimeString();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'log-message';
    messageDiv.textContent = message;
    
    logEntry.appendChild(timeDiv);
    logEntry.appendChild(messageDiv);
    
    // Add to container (newest first)
    logsContainer.insertBefore(logEntry, logsContainer.firstChild);
    
    // Limit to 100 logs
    const logs = logsContainer.querySelectorAll('.log-entry');
    if (logs.length > 100) {
        logs[logs.length - 1].remove();
    }
}

function clearLogs() {
    logsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📊</div>
            <div>Logs cleared. Waiting for activity...</div>
        </div>
    `;
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
                    updateStatus('Running', 'active');
                    isSessionActive = true;
                    
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
window.addLog = addLog;
