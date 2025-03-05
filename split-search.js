document.addEventListener('DOMContentLoaded', function() {
  const promptInput = document.getElementById('leftSearch');
  const openAIChatbotsButton = document.getElementById('openSplitWindows');
  const closeButton = document.getElementById('closeButton');
  
  // Notify background script that multi AI prompter page is opened
  chrome.runtime.sendMessage({ type: 'SPLIT_SEARCH_OPENED' }, function(response) {
    console.log('Multi AI prompter page opened response:', response);
  });
  
  // Load last prompt from storage
  chrome.runtime.sendMessage({ type: 'GET_LAST_SEARCHES' }, function(response) {
    console.log('Got last prompt:', response);
    if (response && response.success && response.lastSearches) {
      promptInput.value = response.lastSearches.left || '';
    }
  });
  
  // Open AI chatbots button click handler
  openAIChatbotsButton.addEventListener('click', function() {
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
    const chatGPTUrl = 'https://chat.openai.com/';
    
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
      const claudeUrl = 'https://claude.ai/chats';
      
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
      });
    });
  });
  
  // Close button click handler
  closeButton.addEventListener('click', function() {
    window.close();
  });
  
  // Handle messages from the extension
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Message received in split-search.js:', message);
    if (message.type === 'SET_SEARCH_TERMS') {
      promptInput.value = message.leftSearch || '';
      sendResponse({ success: true });
    }
    return true;
  });
}); 