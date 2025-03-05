// Background script
// Service worker for Manifest V3

// Example: Listen for installation
chrome.runtime.onInstalled.addListener(function() {
  console.log('Extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.set({ 
    count: 0,
    settings: {
      enabled: true,
      theme: 'light',
      refreshInterval: 60,
      notifications: true
    }
  }, function() {
    console.log('Storage initialized with default values');
  });
});

// Example: Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Message received:', message);
  
  if (message.type === 'GET_COUNT') {
    chrome.storage.local.get(['count'], function(result) {
      sendResponse({ count: result.count || 0 });
    });
    return true; // Required for async sendResponse
  }
  
  if (message.type === 'POPUP_OPENED') {
    sendResponse({ success: true, message: 'Background script received popup opened message' });
  }
  
  if (message.type === 'CONTENT_LOADED') {
    sendResponse({ success: true, message: 'Background script received content loaded message' });
  }
});
