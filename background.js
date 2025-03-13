// Background script
// Service worker for Manifest V3

// Track window IDs
let chatGPTWindowId = null;
let claudeWindowId = null;
let grokWindowId = null;
let geminiWindowId = null;

// Track tab IDs
let chatGPTTabId = null;
let claudeTabId = null;
let grokTabId = null;
let geminiTabId = null;

// Track prompts
let currentPrompt = '';

// Track if prompt has been injected
let chatGPTPromptInjected = false;
let claudePromptInjected = false;
let grokPromptInjected = false;
let geminiPromptInjected = false;

// Listen for installation
chrome.runtime.onInstalled.addListener(function() {
  console.log('Multi AI Prompter extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.set({ 
    splitSearchTabId: null,
    lastSearches: {
      left: '',
      right: '',
      top_right: '',
      bottom_right: ''
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
      message: `Please log in to ${
        message.aiType === 'chatgpt' ? 'ChatGPT' : 
        message.aiType === 'claude' ? 'Claude' : 
        message.aiType === 'grok' ? 'Grok' : 'Gemini'
      } to use the Multi AI Prompter.`,
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
        right: message.rightSearch || '',
        top_right: message.topRightSearch || '',
        bottom_right: message.bottomRightSearch || ''
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
        lastSearches: result.lastSearches || { 
          left: '', 
          right: '',
          top_right: '',
          bottom_right: ''
        } 
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
    
    // Reset injection flags
    if (message.aiType === 'chatgpt') {
      chatGPTPromptInjected = false;
    } else if (message.aiType === 'claude') {
      claudePromptInjected = false;
    } else if (message.aiType === 'grok') {
      // For Grok, check if the URL already contains a query parameter
      if (message.url.includes('?q=')) {
        console.log('Grok URL already contains query parameter, skipping injection');
        grokPromptInjected = true;
      } else {
        grokPromptInjected = false;
      }
    } else if (message.aiType === 'gemini') {
      geminiPromptInjected = false;
    }
    
    // Close existing window if it exists
    const closeAndCreate = () => {
      chrome.windows.create(createData, function(window) {
        if (chrome.runtime.lastError) {
          console.error('Error creating window:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        if (!window || !window.tabs || window.tabs.length === 0) {
          console.error('Window created but no tabs found');
          sendResponse({ success: false, error: 'Window created but no tabs found' });
          return;
        }
        
        console.log('Window created:', window.id);
        
        // Store window ID and tab ID
        if (message.aiType === 'chatgpt') {
          chatGPTWindowId = window.id;
          chatGPTTabId = window.tabs[0].id;
          
          // Wait for the page to load before injecting the prompt
          setTimeout(() => {
            if (!chatGPTPromptInjected && chatGPTTabId) {
              // Verify the tab still exists
              chrome.tabs.get(chatGPTTabId, function(tab) {
                if (chrome.runtime.lastError) {
                  console.error('Error accessing ChatGPT tab:', chrome.runtime.lastError);
                  chatGPTTabId = null;
                  return;
                }
                
                injectPromptToChatGPT(chatGPTTabId, currentPrompt);
                chatGPTPromptInjected = true;
              });
            }
          }, 5000);
        } else if (message.aiType === 'claude') {
          claudeWindowId = window.id;
          claudeTabId = window.tabs[0].id;
          
          // Wait for the page to load before injecting the prompt
          setTimeout(() => {
            if (!claudePromptInjected && claudeTabId) {
              // Verify the tab still exists
              chrome.tabs.get(claudeTabId, function(tab) {
                if (chrome.runtime.lastError) {
                  console.error('Error accessing Claude tab:', chrome.runtime.lastError);
                  claudeTabId = null;
                  return;
                }
                
                injectPromptToClaude(claudeTabId, currentPrompt);
                claudePromptInjected = true;
              });
            }
          }, 5000);
        } else if (message.aiType === 'grok') {
          grokWindowId = window.id;
          grokTabId = window.tabs[0].id;
          
          // Wait for the page to load before injecting the prompt
          setTimeout(() => {
            if (!grokPromptInjected && grokTabId) {
              // Verify the tab still exists
              chrome.tabs.get(grokTabId, function(tab) {
                if (chrome.runtime.lastError) {
                  console.error('Error accessing Grok tab:', chrome.runtime.lastError);
                  grokTabId = null;
                  return;
                }
                
                injectPromptToGrok(grokTabId, currentPrompt);
                grokPromptInjected = true;
              });
            }
          }, 5000);
        } else if (message.aiType === 'gemini') {
          geminiWindowId = window.id;
          geminiTabId = window.tabs[0].id;
          
          // Wait for the page to load before injecting the prompt
          setTimeout(() => {
            if (!geminiPromptInjected && geminiTabId) {
              // Verify the tab still exists
              chrome.tabs.get(geminiTabId, function(tab) {
                if (chrome.runtime.lastError) {
                  console.error('Error accessing Gemini tab:', chrome.runtime.lastError);
                  geminiTabId = null;
                  return;
                }
                
                injectPromptToGemini(geminiTabId, currentPrompt);
                geminiPromptInjected = true;
              });
            }
          }, 5000);
        }
        
        sendResponse({ success: true });
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
    } else if (message.aiType === 'grok' && grokWindowId) {
      chrome.windows.get(grokWindowId, {}, function(window) {
        if (chrome.runtime.lastError) {
          // Window doesn't exist anymore
          grokWindowId = null;
          closeAndCreate();
        } else {
          chrome.windows.remove(grokWindowId, function() {
            grokWindowId = null;
            closeAndCreate();
          });
        }
      });
    } else if (message.aiType === 'gemini' && geminiWindowId) {
      chrome.windows.get(geminiWindowId, {}, function(window) {
        if (chrome.runtime.lastError) {
          // Window doesn't exist anymore
          geminiWindowId = null;
          closeAndCreate();
        } else {
          chrome.windows.remove(geminiWindowId, function() {
            geminiWindowId = null;
            closeAndCreate();
          });
        }
      });
    } else {
      closeAndCreate();
    }
    
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
    if (tabId === chatGPTTabId && !chatGPTPromptInjected && chatGPTTabId) {
      console.log('ChatGPT tab has finished loading, checking login status');
      
      // Verify the tab still exists
      chrome.tabs.get(chatGPTTabId, function(tab) {
        if (chrome.runtime.lastError) {
          console.error('Error accessing ChatGPT tab:', chrome.runtime.lastError);
          chatGPTTabId = null;
          return;
        }
        
        // First check if login is required
        setTimeout(() => {
          checkLoginStatus(chatGPTTabId, 'chatgpt');
          
          // Then inject the prompt if not already injected
          if (!chatGPTPromptInjected && currentPrompt && chatGPTTabId) {
            setTimeout(() => {
              injectPromptToChatGPT(chatGPTTabId, currentPrompt);
              chatGPTPromptInjected = true;
            }, 1000);
          }
        }, 1000);
      });
      
    } else if (tabId === claudeTabId && !claudePromptInjected && claudeTabId) {
      console.log('Claude tab has finished loading, checking login status');
      
      // Verify the tab still exists
      chrome.tabs.get(claudeTabId, function(tab) {
        if (chrome.runtime.lastError) {
          console.error('Error accessing Claude tab:', chrome.runtime.lastError);
          claudeTabId = null;
          return;
        }
        
        // First check if login is required
        setTimeout(() => {
          checkLoginStatus(claudeTabId, 'claude');
          
          // Then inject the prompt if not already injected
          if (!claudePromptInjected && currentPrompt && claudeTabId) {
            setTimeout(() => {
              injectPromptToClaude(claudeTabId, currentPrompt);
              claudePromptInjected = true;
            }, 1000);
          }
        }, 1000);
      });
      
    } else if (tabId === grokTabId && !grokPromptInjected && grokTabId) {
      console.log('Grok tab has finished loading, checking login status');
      
      // Verify the tab still exists
      chrome.tabs.get(grokTabId, function(tab) {
        if (chrome.runtime.lastError) {
          console.error('Error accessing Grok tab:', chrome.runtime.lastError);
          grokTabId = null;
          return;
        }
        
        // First check if login is required
        setTimeout(() => {
          checkLoginStatus(grokTabId, 'grok');
          
          // Then inject the prompt if not already injected
          if (!grokPromptInjected && currentPrompt && grokTabId) {
            setTimeout(() => {
              injectPromptToGrok(grokTabId, currentPrompt);
              grokPromptInjected = true;
            }, 1000);
          }
        }, 1000);
      });
      
    } else if (tabId === geminiTabId && !geminiPromptInjected && geminiTabId) {
      console.log('Gemini tab has finished loading, checking login status');
      
      // Verify the tab still exists
      chrome.tabs.get(geminiTabId, function(tab) {
        if (chrome.runtime.lastError) {
          console.error('Error accessing Gemini tab:', chrome.runtime.lastError);
          geminiTabId = null;
          return;
        }
        
        // First check if login is required
        setTimeout(() => {
          checkLoginStatus(geminiTabId, 'gemini');
          
          // Then inject the prompt if not already injected
          if (!geminiPromptInjected && currentPrompt && geminiTabId) {
            setTimeout(() => {
              injectPromptToGemini(geminiTabId, currentPrompt);
              geminiPromptInjected = true;
            }, 1000);
          }
        }, 1000);
      });
    }
  }
});

// Function to inject prompt into ChatGPT
function injectPromptToChatGPT(tabId, prompt) {
  if (!prompt) return;
  if (!tabId) {
    console.error('Cannot inject prompt to ChatGPT: Invalid tab ID');
    chatGPTTabId = null;
    chatGPTPromptInjected = false;
    return;
  }
  
  chrome.tabs.get(tabId, function(tab) {
    if (chrome.runtime.lastError) {
      console.error('Error accessing ChatGPT tab:', chrome.runtime.lastError);
      chatGPTTabId = null;
      chatGPTPromptInjected = false;
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: (promptText) => {
        console.log('Attempting to inject prompt into ChatGPT:', promptText);
        
        // Wait for the textarea to be available
        const waitForElement = (selector, callback, maxAttempts = 10, interval = 300) => {
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
        
        // Flag to track if input has been successfully set
        let inputSet = false;
        
        // Try to find any of the input selectors
        const tryInputSelectors = (index = 0) => {
          if (index >= inputSelectors.length || inputSet) {
            console.error('Could not find any input field');
            return;
          }
          
          const selector = inputSelectors[index];
          console.log(`Trying input selector: ${selector}`);
          
          waitForElement(selector, (inputElement) => {
            try {
              if (inputSet) return; // Prevent multiple inputs
              
              // Focus the input element
              inputElement.focus();
              
              // Handle different types of input elements
              if (inputElement.tagName.toLowerCase() === 'textarea') {
                // For textarea elements
                console.log('Setting value for textarea element');
                inputElement.value = promptText;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                inputSet = true;
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
                inputSet = true;
              }
              
              if (inputSet) {
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
                
                // Flag to track if button has been clicked
                let buttonClicked = false;
                
                // Try to find any of the button selectors
                const tryButtonSelectors = (btnIndex = 0) => {
                  if (btnIndex >= buttonSelectors.length || buttonClicked) {
                    if (!buttonClicked) {
                      console.log('Could not find submit button with standard selectors, trying SVG path');
                      
                      const svgButton = findSendButtonWithSVG();
                      if (svgButton) {
                        console.log('Found and clicking submit button with SVG');
                        svgButton.click();
                        buttonClicked = true;
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
                    }
                    return;
                  }
                  
                  const btnSelector = buttonSelectors[btnIndex];
                  console.log(`Trying button selector: ${btnSelector}`);
                  
                  const buttons = document.querySelectorAll(btnSelector);
                  
                  for (const button of buttons) {
                    if (!button.disabled && (button.offsetWidth > 0 || button.offsetHeight > 0) && !buttonClicked) {
                      console.log('Found and clicking submit button');
                      button.click();
                      buttonClicked = true;
                      return;
                    }
                  }
                  
                  if (!buttonClicked) {
                    console.log(`Button not found or disabled: ${btnSelector}`);
                    tryButtonSelectors(btnIndex + 1);
                  }
                };
                
                // Start trying button selectors with a shorter delay
                setTimeout(() => tryButtonSelectors(), 300);
              } else {
                // Try next selector if input wasn't set
                tryInputSelectors(index + 1);
              }
              
            } catch (error) {
              console.error('Error setting input text:', error);
              // Try next selector
              tryInputSelectors(index + 1);
            }
          }, 10, 300);
        };
        
        // Start trying input selectors
        tryInputSelectors();
      },
      args: [prompt]
    });
  });
}

// Function to inject prompt into Claude
function injectPromptToClaude(tabId, prompt) {
  if (!prompt) return;
  if (!tabId) {
    console.error('Cannot inject prompt to Claude: Invalid tab ID');
    claudeTabId = null;
    claudePromptInjected = false;
    return;
  }
  
  chrome.tabs.get(tabId, function(tab) {
    if (chrome.runtime.lastError) {
      console.error('Error accessing Claude tab:', chrome.runtime.lastError);
      claudeTabId = null;
      claudePromptInjected = false;
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: (promptText) => {
        console.log('Attempting to inject prompt into Claude with simplified approach:', promptText);
        
        // Simple function to wait for an element
        function waitForElement(selector, maxWait = 10000) {
          return new Promise((resolve) => {
            if (document.querySelector(selector)) {
              return resolve(document.querySelector(selector));
            }
            
            const observer = new MutationObserver(() => {
              if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
              }
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            
            setTimeout(() => {
              observer.disconnect();
              resolve(document.querySelector(selector));
            }, maxWait);
          });
        }
        
        // Main function to set text and submit
        async function setClaudeText() {
          try {
            // First try to find the input field
            const inputField = await waitForElement('div.ProseMirror[contenteditable="true"], div[contenteditable="true"][translate="no"]');
            
            if (!inputField) {
              console.error('Could not find Claude input field');
              return;
            }
            
            console.log('Found Claude input field:', inputField);
            
            // Focus the input field
            inputField.focus();
            
            // Clear any existing content
            inputField.innerHTML = '';
            
            // Create a paragraph with the text
            const p = document.createElement('p');
            p.textContent = promptText;
            inputField.appendChild(p);
            
            // Dispatch input events
            inputField.dispatchEvent(new Event('input', { bubbles: true }));
            
            console.log('Set Claude text to:', promptText);
            
            // Wait a moment for the UI to update
            setTimeout(async () => {
              // Try to find the submit button
              const submitButton = document.querySelector('button[aria-label="Send Message"]');
              
              if (submitButton) {
                console.log('Found Claude submit button, clicking it');
                submitButton.click();
              } else {
                console.log('Could not find Claude submit button, trying Enter key');
                
                // Try to simulate Enter key
                const enterEvent = new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  cancelable: true,
                  composed: true
                });
                
                inputField.dispatchEvent(enterEvent);
              }
            }, 500);
          } catch (error) {
            console.error('Error in Claude text injection:', error);
          }
        }
        
        // Start the process
        setClaudeText();
      },
      args: [prompt]
    });
  });
}

// Function to inject prompt into Grok
function injectPromptToGrok(tabId, prompt) {
  if (!prompt) return;
  if (!tabId) {
    console.error('Cannot inject prompt to Grok: Invalid tab ID');
    grokTabId = null;
    grokPromptInjected = false;
    return;
  }
  
  // Instead of trying to inject into the page, navigate directly to the URL with the query
  const encodedPrompt = encodeURIComponent(prompt);
  const grokUrl = `https://grok.com/?q=${encodedPrompt}`;
  
  console.log(`Navigating Grok tab to URL with query: ${grokUrl}`);
  
  chrome.tabs.update(tabId, { url: grokUrl }, function(tab) {
    if (chrome.runtime.lastError) {
      console.error('Error updating Grok tab URL:', chrome.runtime.lastError);
      return;
    }
    
    // Mark as injected since we're using the URL approach
    grokPromptInjected = true;
    console.log('Grok prompt injected via URL parameter');
  });
}

// Function to inject prompt into Gemini
function injectPromptToGemini(tabId, prompt) {
  if (!prompt) return;
  if (!tabId) {
    console.error('Cannot inject prompt to Gemini: Invalid tab ID');
    geminiTabId = null;
    geminiPromptInjected = false;
    return;
  }
  
  chrome.tabs.get(tabId, function(tab) {
    if (chrome.runtime.lastError) {
      console.error('Error accessing Gemini tab:', chrome.runtime.lastError);
      geminiTabId = null;
      geminiPromptInjected = false;
      return;
    }
    
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: (promptText) => {
        console.log('Attempting to inject prompt into Gemini:', promptText);
        
        // Wait for the textarea to be available
        const waitForElement = (selector, callback, maxAttempts = 10, interval = 300) => {
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
          // Exact selectors from the HTML
          '.ql-editor[data-placeholder="Ask Gemini"]',
          'rich-textarea .ql-editor',
          'div[role="textbox"][aria-label="Enter a prompt here"]',
          // Generic selectors
          'textarea[placeholder*="Ask"]',
          'div[contenteditable="true"]',
          'div[role="textbox"]'
        ];
        
        // Flag to track if input has been successfully set
        let inputSet = false;
        
        // Try to find any of the input selectors
        const tryInputSelectors = (index = 0) => {
          if (index >= inputSelectors.length || inputSet) {
            console.error('Could not find any input field for Gemini');
            return;
          }
          
          const selector = inputSelectors[index];
          console.log(`Trying Gemini input selector: ${selector}`);
          
          waitForElement(selector, (inputElement) => {
            try {
              if (inputSet) return; // Prevent multiple inputs
              
              // Focus the input element
              inputElement.focus();
              
              // Handle different types of input elements
              if (inputElement.tagName.toLowerCase() === 'textarea') {
                // For textarea elements
                console.log('Setting value for textarea element');
                inputElement.value = promptText;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputSet = true;
              } else if (inputElement.getAttribute('contenteditable') === 'true' || 
                         inputElement.classList.contains('ql-editor')) {
                // For contenteditable divs or Quill editor
                console.log('Setting content for contenteditable/Quill element');
                
                // Clear existing content
                inputElement.innerHTML = '';
                
                // Create a text node with the prompt
                const textNode = document.createTextNode(promptText);
                
                // Create a paragraph element if needed
                if (inputElement.querySelector('p') || inputElement.classList.contains('ql-editor')) {
                  const p = document.createElement('p');
                  p.appendChild(textNode);
                  inputElement.appendChild(p);
                } else {
                  inputElement.appendChild(textNode);
                }
                
                // Dispatch input events
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                inputSet = true;
              }
              
              if (inputSet) {
                console.log('Input text set successfully');
                
                // Try multiple possible selectors for the submit button
                const buttonSelectors = [
                  // Exact selectors from the HTML
                  'button.send-button',
                  'button[aria-label="Send message"]',
                  'button[jslog*="173899"]',
                  'mat-icon[fonticon="send"]',
                  // Generic selectors
                  'button[type="submit"]',
                  'button.submit',
                  'form button'
                ];
                
                // Flag to track if button has been clicked
                let buttonClicked = false;
                
                // Try to find any of the button selectors
                const tryButtonSelectors = (btnIndex = 0) => {
                  if (btnIndex >= buttonSelectors.length || buttonClicked) {
                    if (!buttonClicked) {
                      console.log('Could not find Gemini submit button, trying to simulate Enter key');
                      // If no button found, try to simulate Enter key press
                      inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true
                      }));
                    }
                    return;
                  }
                  
                  const btnSelector = buttonSelectors[btnIndex];
                  console.log(`Trying Gemini button selector: ${btnSelector}`);
                  
                  const buttons = document.querySelectorAll(btnSelector);
                  
                  for (const button of buttons) {
                    if (!button.disabled && 
                        (button.offsetWidth > 0 || button.offsetHeight > 0) && 
                        window.getComputedStyle(button).display !== 'none' &&
                        window.getComputedStyle(button).visibility !== 'hidden' &&
                        !buttonClicked) {
                      console.log('Found and clicking Gemini submit button');
                      button.click();
                      buttonClicked = true;
                      return;
                    }
                  }
                  
                  if (!buttonClicked) {
                    console.log(`Gemini button not found or disabled: ${btnSelector}`);
                    tryButtonSelectors(btnIndex + 1);
                  }
                };
                
                // Start trying button selectors after a shorter delay
                setTimeout(() => tryButtonSelectors(), 300);
              } else {
                // Try next selector if input wasn't set
                tryInputSelectors(index + 1);
              }
              
            } catch (error) {
              console.error('Error setting Gemini input text:', error);
              // Try next selector
              tryInputSelectors(index + 1);
            }
          }, 10, 300);
        };
        
        // Start trying input selectors
        tryInputSelectors();
      },
      args: [prompt]
    });
  });
}

// Function to check login status and show notification if needed
function checkLoginStatus(tabId, aiType) {
  if (!tabId) {
    console.error(`Cannot check login status for ${aiType}: Invalid tab ID`);
    return;
  }
  
  chrome.tabs.get(tabId, function(tab) {
    if (chrome.runtime.lastError) {
      console.error(`Error accessing ${aiType} tab:`, chrome.runtime.lastError);
      return;
    }
    
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
        } else if (type === 'grok') {
          // Check for Grok login elements
          const loginButton = findElementWithText('button, a', 'Sign in');
          const signupButton = findElementWithText('button, a', 'Sign up');
          
          if (loginButton || signupButton) {
            console.log('Grok login required');
            // Send message to background script
            chrome.runtime.sendMessage({
              type: 'LOGIN_REQUIRED',
              aiType: 'grok'
            });
            return false;
          }
        } else if (type === 'gemini') {
          // Check for Gemini login elements
          const loginButton = findElementWithText('button, a', 'Sign in');
          
          if (loginButton) {
            console.log('Gemini login required');
            // Send message to background script
            chrome.runtime.sendMessage({
              type: 'LOGIN_REQUIRED',
              aiType: 'gemini'
            });
            return false;
          }
        }
        
        return true;
      },
      args: [aiType]
    });
  });
}

// Listen for window close events
chrome.windows.onRemoved.addListener(function(windowId) {
  if (windowId === chatGPTWindowId) {
    console.log('ChatGPT window closed:', windowId);
    chatGPTWindowId = null;
    chatGPTPromptInjected = false;
  }
  if (windowId === claudeWindowId) {
    console.log('Claude window closed:', windowId);
    claudeWindowId = null;
    claudePromptInjected = false;
  }
  if (windowId === grokWindowId) {
    console.log('Grok window closed:', windowId);
    grokWindowId = null;
    grokPromptInjected = false;
  }
  if (windowId === geminiWindowId) {
    console.log('Gemini window closed:', windowId);
    geminiWindowId = null;
    geminiPromptInjected = false;
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
    chatGPTPromptInjected = false;
  }
  if (tabId === claudeTabId) {
    claudeTabId = null;
    claudePromptInjected = false;
  }
  if (tabId === grokTabId) {
    grokTabId = null;
    grokPromptInjected = false;
  }
  if (tabId === geminiTabId) {
    geminiTabId = null;
    geminiPromptInjected = false;
  }
});
