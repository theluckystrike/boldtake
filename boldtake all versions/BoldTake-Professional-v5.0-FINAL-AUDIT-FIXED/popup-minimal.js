/**
 * 🔥 MINIMAL WORKING POPUP - A+ GRADE RELIABILITY
 * NO DEPENDENCIES, NO WAITING, JUST WORKS
 */

console.log('🚀 BoldTake Minimal Popup Loading...');

// Global DOM elements
let startBtn, stopBtn, sessionStatus, keywordInput, minFavesInput;

// Initialize immediately when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM loaded - initializing minimal popup');
    
    try {
        // Get critical elements
        startBtn = document.getElementById('start-button');
        stopBtn = document.getElementById('stop-button');
        sessionStatus = document.getElementById('sessionStatus');
        keywordInput = document.getElementById('keyword-input');
        minFavesInput = document.getElementById('min-faves-input');
        
        console.log('Elements found:', {
            startBtn: !!startBtn,
            stopBtn: !!stopBtn,
            sessionStatus: !!sessionStatus,
            keywordInput: !!keywordInput,
            minFavesInput: !!minFavesInput
        });
        
        // Set up event listeners immediately
        if (startBtn) {
            startBtn.addEventListener('click', handleStart);
            console.log('✅ Start button listener attached');
        } else {
            console.error('❌ Start button not found!');
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', handleStop);
            console.log('✅ Stop button listener attached');
        } else {
            console.error('❌ Stop button not found!');
        }
        
        // Load saved settings
        loadSettings();
        
        // Update UI state
        updateUIState();
        
        console.log('✅ Minimal popup initialized successfully');
        
    } catch (error) {
        console.error('❌ Critical error during initialization:', error);
    }
});

/**
 * Handle start button click
 */
function handleStart() {
    console.log('🚀 Start button clicked');
    
    try {
        // Get settings
        const keyword = keywordInput ? keywordInput.value.trim() : '';
        const minFaves = minFavesInput ? minFavesInput.value : '500';
        
        if (!keyword) {
            alert('Please enter a keyword first!');
            return;
        }
        
        // Send message to background script
        chrome.runtime.sendMessage({
            type: 'START_SESSION',
            keyword: keyword,
            minFaves: minFaves
        }, (response) => {
            console.log('Start response:', response);
            if (response && response.success) {
                updateStatus('🚀 Session starting...');
                startBtn.disabled = true;
                stopBtn.disabled = false;
            } else {
                updateStatus('❌ Failed to start session');
            }
        });
        
    } catch (error) {
        console.error('❌ Start error:', error);
        updateStatus('❌ Start failed: ' + error.message);
    }
}

/**
 * Handle stop button click
 */
function handleStop() {
    console.log('🛑 Stop button clicked');
    
    try {
        // Send message to background script
        chrome.runtime.sendMessage({
            type: 'STOP_SESSION'
        }, (response) => {
            console.log('Stop response:', response);
            updateStatus('🛑 Session stopped');
            startBtn.disabled = false;
            stopBtn.disabled = true;
        });
        
    } catch (error) {
        console.error('❌ Stop error:', error);
        updateStatus('❌ Stop failed: ' + error.message);
    }
}

/**
 * Load saved settings
 */
function loadSettings() {
    try {
        chrome.storage.local.get(['boldtake_keyword', 'boldtake_min_faves'], (result) => {
            if (keywordInput && result.boldtake_keyword) {
                keywordInput.value = result.boldtake_keyword;
            }
            if (minFavesInput && result.boldtake_min_faves) {
                minFavesInput.value = result.boldtake_min_faves;
            }
            console.log('✅ Settings loaded');
        });
    } catch (error) {
        console.error('❌ Settings load error:', error);
    }
}

/**
 * Update UI state
 */
function updateUIState() {
    try {
        // Check session state from background
        chrome.runtime.sendMessage({ type: 'GET_SESSION_STATE' }, (response) => {
            if (response && response.isRunning) {
                updateStatus('🔄 Session running...');
                startBtn.disabled = true;
                stopBtn.disabled = false;
            } else {
                updateStatus('⚡ Ready to start');
                startBtn.disabled = false;
                stopBtn.disabled = true;
            }
        });
    } catch (error) {
        console.error('❌ UI state update error:', error);
        updateStatus('⚡ Ready to start');
    }
}

/**
 * Update status display
 */
function updateStatus(message) {
    if (sessionStatus) {
        sessionStatus.textContent = message;
    }
    console.log('Status:', message);
}

console.log('✅ Minimal popup script loaded');
