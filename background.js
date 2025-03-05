// Background script
// Service worker for Manifest V3

// Track window IDs
let chatGPTWindowId = null;
let claudeWindowId = null;

// Track tab IDs
let chatGPTTabId = null;
let claudeTabId = null;

// Track prompts
let currentPrompt = '';

// Listen for installation
chrome.runtime.onInstalled.addListener(function() {
  console.log('Multi AI Prompter extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.set({ 
    splitSearchTabId: null,
    lastSearches: {
      left: '',
      right: ''
    }
  }, function() {
    console.log('Storage initialized with default values');
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Message received:', message);
  
  // Handle split search tab tracking
  if (message.type === 'SPLIT_SEARCH_OPENED') {
    chrome.storage.local.set({ splitSearchTabId: sender.tab.id });
    sendResponse({ success: true });
    return true;
  }
  
  // Handle search terms
  if (message.type === 'SAVE_SEARCH_TERMS') {
    chrome.storage.local.set({ 
      lastSearches: {
        left: message.leftSearch || '',
        right: message.rightSearch || ''
      }
    });
    currentPrompt = message.leftSearch || '';
    sendResponse({ success: true });
    return true;
  }
  
  // Handle getting last search terms
  if (message.type === 'GET_LAST_SEARCHES') {
    chrome.storage.local.get(['lastSearches'], function(result) {
      sendResponse({ 
        success: true, 
        lastSearches: result.lastSearches || { left: '', right: '' } 
      });
    });
    return true; // Required for async sendResponse
  }
  
  // Handle opening windows
  if (message.type === 'OPEN_WINDOW') {
    // Create window options
    const createData = {
      url: message.url,
      type: 'normal',
      width: message.width,
      height: message.height,
      left: message.left,
      top: message.top,
      focused: true
    };
    
    console.log('Creating window with options:', createData);
    
    // Store the prompt
    if (message.prompt) {
      currentPrompt = message.prompt;
    }
    
    // Close existing window if it exists
    const closeAndCreate = () => {
      chrome.windows.create(createData, function(window) {
        if (chrome.runtime.lastError) {
          console.error('Error creating window:', chrome.runtime.lastError);
        } else {
          console.log('Window created:', window.id);
          
          // Store window ID and tab ID
          if (message.aiType === 'chatgpt') {
            chatGPTWindowId = window.id;
            chatGPTTabId = window.tabs[0].id;
            
            // Wait for the page to load before injecting the prompt
            setTimeout(() => {
              injectPromptToChatGPT(chatGPTTabId, currentPrompt);
            }, 5000); // Wait 5 seconds for the page to load
          } else if (message.aiType === 'claude') {
            claudeWindowId = window.id;
            claudeTabId = window.tabs[0].id;
            
            // Wait for the page to load before injecting the prompt
            setTimeout(() => {
              injectPromptToClaude(claudeTabId, currentPrompt);
            }, 5000); // Wait 5 seconds for the page to load
          }
        }
      });
    };
    
    if (message.aiType === 'chatgpt' && chatGPTWindowId) {
      chrome.windows.get(chatGPTWindowId, {}, function(window) {
        if (chrome.runtime.lastError) {
          // Window doesn't exist anymore
          chatGPTWindowId = null;
          closeAndCreate();
        } else {
          chrome.windows.remove(chatGPTWindowId, function() {
            chatGPTWindowId = null;
            closeAndCreate();
          });
        }
      });
    } else if (message.aiType === 'claude' && claudeWindowId) {
      chrome.windows.get(claudeWindowId, {}, function(window) {
        if (chrome.runtime.lastError) {
          // Window doesn't exist anymore
          claudeWindowId = null;
          closeAndCreate();
        } else {
          chrome.windows.remove(claudeWindowId, function() {
            claudeWindowId = null;
            closeAndCreate();
          });
        }
      });
    } else {
      closeAndCreate();
    }
    
    sendResponse({ success: true });
    return true;
  }
  
  // Handle tab closed
  if (message.type === 'SPLIT_SEARCH_CLOSED') {
    chrome.storage.local.set({ splitSearchTabId: null });
    sendResponse({ success: true });
    return true;
  }
});

// Function to inject prompt into ChatGPT
function injectPromptToChatGPT(tabId, prompt) {
  if (!prompt) return;
  
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: (promptText) => {
      // Wait for the textarea to be available
      const waitForElement = (selector, callback, maxAttempts = 10, interval = 1000) => {
        let attempts = 0;
        const checkElement = () => {
          const element = document.querySelector(selector);
          if (element) {
            callback(element);
            return;
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkElement, interval);
          } else {
            console.error(`Element ${selector} not found after ${maxAttempts} attempts`);
          }
        };
        checkElement();
      };
      
      // Find and fill the textarea, then submit
      waitForElement('textarea[data-id="root"]', (textarea) => {
        // Focus the textarea
        textarea.focus();
        
        // Set its value
        textarea.value = promptText;
        
        // Dispatch input event to trigger any listeners
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Find and click the submit button
        waitForElement('button[data-testid="send-button"]', (button) => {
          button.click();
        });
      });
    },
    args: [prompt]
  });
}

// Function to inject prompt into Claude
function injectPromptToClaude(tabId, prompt) {
  if (!prompt) return;
  
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: (promptText) => {
      // Wait for the textarea to be available
      const waitForElement = (selector, callback, maxAttempts = 10, interval = 1000) => {
        let attempts = 0;
        const checkElement = () => {
          const element = document.querySelector(selector);
          if (element) {
            callback(element);
            return;
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkElement, interval);
          } else {
            console.error(`Element ${selector} not found after ${maxAttempts} attempts`);
          }
        };
        checkElement();
      };
      
      // Find and fill the textarea, then submit
      waitForElement('.ProseMirror', (editor) => {
        // Focus the editor
        editor.focus();
        
        // Set its content
        editor.innerHTML = promptText;
        
        // Dispatch input event to trigger any listeners
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Find and click the submit button
        waitForElement('button[aria-label="Send message"]', (button) => {
          button.click();
        });
      });
    },
    args: [prompt]
  });
}

// Listen for window close events
chrome.windows.onRemoved.addListener(function(windowId) {
  if (windowId === chatGPTWindowId) {
    console.log('ChatGPT window closed:', windowId);
    chatGPTWindowId = null;
  }
  if (windowId === claudeWindowId) {
    console.log('Claude window closed:', windowId);
    claudeWindowId = null;
  }
});

// Listen for tab close events
chrome.tabs.onRemoved.addListener(function(tabId) {
  // Check if the closed tab was our split search tab
  chrome.storage.local.get(['splitSearchTabId'], function(result) {
    if (result.splitSearchTabId === tabId) {
      chrome.storage.local.set({ splitSearchTabId: null });
    }
  });
  
  // Check if the closed tab was one of our AI chatbot tabs
  if (tabId === chatGPTTabId) {
    chatGPTTabId = null;
  }
  if (tabId === claudeTabId) {
    claudeTabId = null;
  }
});
