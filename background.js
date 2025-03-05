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
  
  // Handle login required message
  if (message.type === 'LOGIN_REQUIRED') {
    console.log(`Login required for ${message.aiType}`);
    
    // Show notification to user
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title: 'Login Required',
      message: `Please log in to ${message.aiType === 'chatgpt' ? 'ChatGPT' : 'Claude'} to use the Multi AI Prompter.`,
      priority: 2
    });
    
    return true;
  }
  
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
            }, 8000); // Wait 8 seconds for the page to load
          } else if (message.aiType === 'claude') {
            claudeWindowId = window.id;
            claudeTabId = window.tabs[0].id;
            
            // Wait for the page to load before injecting the prompt
            setTimeout(() => {
              injectPromptToClaude(claudeTabId, currentPrompt);
            }, 8000); // Wait 8 seconds for the page to load
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

// Listen for tab updates
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Check if the tab has finished loading
  if (changeInfo.status === 'complete') {
    console.log(`Tab ${tabId} has finished loading:`, tab.url);
    
    // Check if this is one of our AI chatbot tabs
    if (tabId === chatGPTTabId) {
      console.log('ChatGPT tab has finished loading, checking login status');
      
      // First check if login is required
      setTimeout(() => {
        checkLoginStatus(chatGPTTabId, 'chatgpt');
        
        // Then inject the prompt
        setTimeout(() => {
          injectPromptToChatGPT(chatGPTTabId, currentPrompt);
        }, 2000);
      }, 1500);
      
    } else if (tabId === claudeTabId) {
      console.log('Claude tab has finished loading, checking login status');
      
      // First check if login is required
      setTimeout(() => {
        checkLoginStatus(claudeTabId, 'claude');
        
        // Then inject the prompt
        setTimeout(() => {
          injectPromptToClaude(claudeTabId, currentPrompt);
        }, 2000);
      }, 1500);
    }
  }
});

// Function to inject prompt into ChatGPT
function injectPromptToChatGPT(tabId, prompt) {
  if (!prompt) return;
  
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: (promptText) => {
      console.log('Attempting to inject prompt into ChatGPT:', promptText);
      
      // Wait for the textarea to be available
      const waitForElement = (selector, callback, maxAttempts = 20, interval = 1000) => {
        let attempts = 0;
        const checkElement = () => {
          const element = document.querySelector(selector);
          if (element) {
            console.log('Found element:', selector);
            callback(element);
            return;
          }
          
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} to find element: ${selector}`);
          if (attempts < maxAttempts) {
            setTimeout(checkElement, interval);
          } else {
            console.error(`Element ${selector} not found after ${maxAttempts} attempts`);
          }
        };
        checkElement();
      };
      
      // Try multiple possible selectors for the input field
      const inputSelectors = [
        '#prompt-textarea', // New ChatGPT interface
        'div[contenteditable="true"].ProseMirror', // ProseMirror editor
        'textarea[data-id="root"]',
        'textarea[placeholder="Send a message"]',
        'div[role="textbox"]'
      ];
      
      // Try to find any of the input selectors
      const tryInputSelectors = (index = 0) => {
        if (index >= inputSelectors.length) {
          console.error('Could not find any input field');
          return;
        }
        
        const selector = inputSelectors[index];
        console.log(`Trying input selector: ${selector}`);
        
        waitForElement(selector, (inputElement) => {
          try {
            // Focus the input element
            inputElement.focus();
            
            // Handle different types of input elements
            if (inputElement.tagName.toLowerCase() === 'textarea') {
              // For textarea elements
              console.log('Setting value for textarea element');
              inputElement.value = promptText;
              inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (inputElement.getAttribute('contenteditable') === 'true' || 
                      inputElement.classList.contains('ProseMirror')) {
              // For contenteditable divs (like ProseMirror)
              console.log('Setting content for contenteditable element');
              
              // Clear existing content
              inputElement.innerHTML = '';
              
              // Create a text node with the prompt
              const textNode = document.createTextNode(promptText);
              
              // Create a paragraph element if needed
              if (inputElement.querySelector('p') || inputElement.id === 'prompt-textarea') {
                const p = document.createElement('p');
                p.appendChild(textNode);
                inputElement.appendChild(p);
              } else {
                inputElement.appendChild(textNode);
              }
              
              // Dispatch input events
              inputElement.dispatchEvent(new Event('input', { bubbles: true }));
              inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            console.log('Input text set successfully');
            
            // Try multiple possible selectors for the submit button
            const buttonSelectors = [
              'button[data-testid="send-button"]',
              'button[aria-label="Submit"]',
              'button.absolute.p-1.rounded-md',
              'button[type="submit"]',
              // Generic submit button in the form
              'form button'
            ];
            
            // Also look for buttons with SVG paths that might be send buttons
            const findSendButtonWithSVG = () => {
              const buttons = document.querySelectorAll('button');
              for (const button of buttons) {
                const svg = button.querySelector('svg');
                if (svg) {
                  const path = svg.querySelector('path');
                  if (path && path.getAttribute('d') && 
                      (path.getAttribute('d').startsWith('M3 12c0-1.1.9-2 2-2s2 .9 2 2') || 
                       path.getAttribute('d').includes('M3 12'))) {
                    return button;
                  }
                }
              }
              return null;
            };
            
            // Try to find any of the button selectors
            const tryButtonSelectors = (btnIndex = 0) => {
              if (btnIndex >= buttonSelectors.length) {
                console.log('Could not find submit button with standard selectors, trying SVG path');
                
                const svgButton = findSendButtonWithSVG();
                if (svgButton) {
                  console.log('Found and clicking submit button with SVG');
                  svgButton.click();
                  return;
                }
                
                console.log('Could not find submit button, trying to simulate Enter key');
                // If no button found, try to simulate Enter key press
                inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true
                }));
                return;
              }
              
              const btnSelector = buttonSelectors[btnIndex];
              console.log(`Trying button selector: ${btnSelector}`);
              
              const buttons = document.querySelectorAll(btnSelector);
              let buttonFound = false;
              
              buttons.forEach(button => {
                if (!button.disabled && (button.offsetWidth > 0 || button.offsetHeight > 0)) {
                  console.log('Found and clicking submit button');
                  button.click();
                  buttonFound = true;
                }
              });
              
              if (!buttonFound) {
                console.log(`Button not found or disabled: ${btnSelector}`);
                tryButtonSelectors(btnIndex + 1);
              }
            };
            
            // Start trying button selectors
            setTimeout(() => tryButtonSelectors(), 500);
            
          } catch (error) {
            console.error('Error setting input text:', error);
            // Try next selector
            tryInputSelectors(index + 1);
          }
        }, 20, 1000);
      };
      
      // Start trying input selectors
      tryInputSelectors();
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
      console.log('Attempting to inject prompt into Claude:', promptText);
      
      // Helper function to find elements containing specific text
      const findElementWithText = (selector, text) => {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.textContent.includes(text)) {
            return element;
          }
        }
        return null;
      };
      
      // Wait for the textarea to be available
      const waitForElement = (selector, callback, maxAttempts = 20, interval = 1000) => {
        let attempts = 0;
        const checkElement = () => {
          const element = document.querySelector(selector);
          if (element) {
            console.log('Found element:', selector);
            callback(element);
            return;
          }
          
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} to find element: ${selector}`);
          if (attempts < maxAttempts) {
            setTimeout(checkElement, interval);
          } else {
            console.error(`Element ${selector} not found after ${maxAttempts} attempts`);
          }
        };
        checkElement();
      };
      
      // Try multiple possible selectors for the input field
      const inputSelectors = [
        '.ProseMirror',
        '[contenteditable="true"]',
        'div[role="textbox"]',
        'textarea[placeholder*="message"]',
        // More specific Claude selectors
        '.claude-input .ProseMirror',
        '.claude-textarea'
      ];
      
      // Try to find any of the input selectors
      const tryInputSelectors = (index = 0) => {
        if (index >= inputSelectors.length) {
          console.error('Could not find any input field for Claude');
          return;
        }
        
        const selector = inputSelectors[index];
        console.log(`Trying Claude input selector: ${selector}`);
        
        waitForElement(selector, (inputElement) => {
          try {
            // Check if we need to create a new chat
            const newChatButton = findElementWithText('button, a', 'New chat');
            if (newChatButton) {
              console.log('Found New chat button, clicking it first');
              newChatButton.click();
              
              // Wait a bit for the new chat to initialize
              setTimeout(() => {
                tryInputSelectors(0); // Start over with the first selector
              }, 2000);
              return;
            }
            
            // Focus the input element
            inputElement.focus();
            
            // For contenteditable elements
            if (inputElement.getAttribute('contenteditable') === 'true' || 
                inputElement.classList.contains('ProseMirror')) {
              // Clear existing content
              inputElement.innerHTML = '';
              
              // Set new content - try different methods
              try {
                // Method 1: Set innerHTML directly
                inputElement.innerHTML = promptText;
                console.log('Set Claude input text via innerHTML');
              } catch (e) {
                console.error('Error setting innerHTML:', e);
                
                try {
                  // Method 2: Use execCommand
                  document.execCommand('insertText', false, promptText);
                  console.log('Set Claude input text via execCommand');
                } catch (e2) {
                  console.error('Error using execCommand:', e2);
                  
                  // Method 3: Create text node
                  const textNode = document.createTextNode(promptText);
                  const p = document.createElement('p');
                  p.appendChild(textNode);
                  inputElement.appendChild(p);
                  console.log('Set Claude input text via appendChild');
                }
              }
            } else {
              // For standard input elements
              inputElement.value = promptText;
              console.log('Set Claude input text via value');
            }
            
            // Dispatch multiple events to ensure the input is recognized
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Try multiple possible selectors for the submit button
            const buttonSelectors = [
              'button[aria-label="Send message"]',
              'button[type="submit"]',
              'button.send-button',
              'button.primary',
              // More specific Claude selectors
              'button.claude-submit',
              'footer button',
              // Look for buttons with send icons
              'button svg',
              // Last resort - any visible button at the bottom of the chat
              '.claude-input-footer button',
              '.claude-textarea-footer button'
            ];
            
            // Try to find any of the button selectors
            const tryButtonSelectors = (btnIndex = 0) => {
              if (btnIndex >= buttonSelectors.length) {
                console.log('Could not find Claude submit button, trying to simulate Enter key');
                // If no button found, try to simulate Enter key press
                inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  cancelable: true
                }));
                
                // Also try Shift+Enter
                inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  shiftKey: true,
                  bubbles: true,
                  cancelable: true
                }));
                return;
              }
              
              const btnSelector = buttonSelectors[btnIndex];
              console.log(`Trying Claude button selector: ${btnSelector}`);
              
              // Try to find all matching buttons
              const buttons = document.querySelectorAll(btnSelector);
              let buttonFound = false;
              
              buttons.forEach(button => {
                // Check if button is visible and enabled
                if (!button.disabled && 
                    (button.offsetWidth > 0 || button.offsetHeight > 0) && 
                    window.getComputedStyle(button).display !== 'none' &&
                    window.getComputedStyle(button).visibility !== 'hidden') {
                  console.log('Found and clicking Claude submit button');
                  button.click();
                  buttonFound = true;
                }
              });
              
              if (!buttonFound) {
                console.log(`Claude button not found or disabled: ${btnSelector}`);
                tryButtonSelectors(btnIndex + 1);
              }
            };
            
            // Start trying button selectors after a short delay
            setTimeout(() => tryButtonSelectors(), 500);
            
          } catch (error) {
            console.error('Error setting Claude input text:', error);
            // Try next selector
            tryInputSelectors(index + 1);
          }
        }, 20, 1000);
      };
      
      // Start trying input selectors
      tryInputSelectors();
    },
    args: [prompt]
  });
}

// Function to check login status and show notification if needed
function checkLoginStatus(tabId, aiType) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: (type) => {
      console.log(`Checking login status for ${type}`);
      
      // Helper function to find elements containing specific text
      const findElementWithText = (selector, text) => {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.textContent.includes(text)) {
            return element;
          }
        }
        return null;
      };
      
      // Check for login elements based on AI type
      if (type === 'chatgpt') {
        // Check for ChatGPT login elements
        const loginButton = findElementWithText('button, a', 'Log in');
        const signupButton = findElementWithText('button, a', 'Sign up');
        
        if (loginButton || signupButton) {
          console.log('ChatGPT login required');
          // Send message to background script
          chrome.runtime.sendMessage({
            type: 'LOGIN_REQUIRED',
            aiType: 'chatgpt'
          });
          return false;
        }
      } else if (type === 'claude') {
        // Check for Claude login elements
        const loginButton = findElementWithText('button, a', 'Sign in');
        const signupButton = findElementWithText('button, a', 'Sign up');
        
        if (loginButton || signupButton) {
          console.log('Claude login required');
          // Send message to background script
          chrome.runtime.sendMessage({
            type: 'LOGIN_REQUIRED',
            aiType: 'claude'
          });
          return false;
        }
      }
      
      return true;
    },
    args: [aiType]
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
