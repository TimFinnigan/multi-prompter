// Simple popup script for direct loading
document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const openMultiAIButton = document.getElementById('openSplitSearch');
  const searchButton = document.getElementById('searchButton');
  const promptInput = document.getElementById('leftSearch');
  
  console.log('Popup loaded');
  
  // Load last prompt from storage
  chrome.runtime.sendMessage({ type: 'GET_LAST_SEARCHES' }, function(response) {
    console.log('Got last prompt:', response);
    if (response && response.success && response.lastSearches) {
      promptInput.value = response.lastSearches.left || '';
    }
  });
  
  // Open multi AI prompter button click handler
  openMultiAIButton.addEventListener('click', function() {
    console.log('Open multi AI prompter button clicked');
    // Create a new tab with the split search page
    chrome.tabs.create({ url: 'split-search.html' }, function(tab) {
      console.log('Multi AI prompter tab created:', tab.id);
      // If prompt is already entered, save it
      const prompt = promptInput.value.trim();
      
      if (prompt) {
        chrome.runtime.sendMessage({
          type: 'SAVE_SEARCH_TERMS',
          leftSearch: prompt,
          rightSearch: prompt
        }, function(response) {
          console.log('Prompt saved:', response);
        });
      }
    });
  });
  
  // Search button click handler
  searchButton.addEventListener('click', function() {
    console.log('Open AI chatbots button clicked');
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }
    
    // Save prompt
    chrome.runtime.sendMessage({
      type: 'SAVE_SEARCH_TERMS',
      leftSearch: prompt,
      rightSearch: prompt
    }, function(response) {
      console.log('Prompt saved:', response);
    });
    
    // Calculate window dimensions for side-by-side display
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    const windowWidth = Math.floor(screenWidth / 2);
    
    console.log('Screen dimensions:', screenWidth, screenHeight);
    console.log('Window width:', windowWidth);
    
    // Create ChatGPT window
    const chatGPTUrl = 'https://chatgpt.com/';
    
    console.log('Opening ChatGPT window with URL:', chatGPTUrl);
    chrome.runtime.sendMessage({
      type: 'OPEN_WINDOW',
      url: chatGPTUrl,
      left: 0,
      top: 0,
      width: windowWidth,
      height: screenHeight,
      aiType: 'chatgpt',
      prompt: prompt
    }, function(response) {
      console.log('ChatGPT window opened response:', response);
      
      // Create Claude window after ChatGPT window is opened
      const claudeUrl = 'https://claude.ai/new';
      
      console.log('Opening Claude window with URL:', claudeUrl);
      chrome.runtime.sendMessage({
        type: 'OPEN_WINDOW',
        url: claudeUrl,
        left: windowWidth,
        top: 0,
        width: windowWidth,
        height: screenHeight,
        aiType: 'claude',
        prompt: prompt
      }, function(response) {
        console.log('Claude window opened response:', response);
        // Close the popup
        window.close();
      });
    });
  });
});