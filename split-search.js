document.addEventListener('DOMContentLoaded', function() {
  const promptInput = document.getElementById('promptInput');
  const openAIModelsButton = document.getElementById('openAIModels');
  const closeButton = document.getElementById('closeButton');
  
  // AI model checkboxes
  const chatgptCheckbox = document.getElementById('chatgpt');
  const claudeCheckbox = document.getElementById('claude');
  const grokCheckbox = document.getElementById('grok');
  const geminiCheckbox = document.getElementById('gemini');
  
  // Layout radio buttons
  const layoutGrid = document.getElementById('layoutGrid');
  const layoutHorizontal = document.getElementById('layoutHorizontal');
  
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
  
  // Open AI models button click handler
  openAIModelsButton.addEventListener('click', function() {
    console.log('Open AI models button clicked');
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }
    
    // Check if at least one AI model is selected
    if (!chatgptCheckbox.checked && !claudeCheckbox.checked && 
        !grokCheckbox.checked && !geminiCheckbox.checked) {
      alert('Please select at least one AI model');
      return;
    }
    
    // Save prompt
    chrome.runtime.sendMessage({
      type: 'SAVE_SEARCH_TERMS',
      leftSearch: prompt,
      rightSearch: prompt,
      topRightSearch: prompt,
      bottomRightSearch: prompt
    }, function(response) {
      console.log('Prompt saved:', response);
    });
    
    // Get selected AI models
    const selectedModels = [];
    if (chatgptCheckbox.checked) selectedModels.push('chatgpt');
    if (claudeCheckbox.checked) selectedModels.push('claude');
    if (grokCheckbox.checked) selectedModels.push('grok');
    if (geminiCheckbox.checked) selectedModels.push('gemini');
    
    // Calculate window dimensions based on layout
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;
    let windowWidth, windowHeight, positions;
    
    if (layoutGrid.checked) {
      // 2x2 Grid layout
      windowWidth = Math.floor(screenWidth / 2);
      windowHeight = Math.floor(screenHeight / 2);
      
      // Create fixed positions for a 2x2 grid regardless of how many models are selected
      positions = [
        { left: 0, top: 0 },                           // Top-left
        { left: windowWidth, top: 0 },                 // Top-right
        { left: 0, top: windowHeight },                // Bottom-left
        { left: windowWidth, top: windowHeight }       // Bottom-right
      ];
      
      // Only use as many positions as we have models
      positions = positions.slice(0, selectedModels.length);
    } else if (layoutHorizontal.checked) {
      // Horizontal layout
      windowWidth = Math.floor(screenWidth / selectedModels.length);
      windowHeight = screenHeight;
      
      positions = selectedModels.map((_, index) => ({
        left: index * windowWidth,
        top: 0
      }));
    }
    
    console.log('Screen dimensions:', screenWidth, screenHeight);
    console.log('Window dimensions:', windowWidth, windowHeight);
    console.log('Selected models:', selectedModels);
    
    // URLs for each AI model
    const urls = {
      chatgpt: 'https://chat.openai.com/',
      claude: 'https://claude.ai/chat',
      grok: 'https://grok.com/',
      gemini: 'https://gemini.google.com/app'
    };
    
    // Open windows for selected AI models
    openAIWindows(selectedModels, urls, positions, windowWidth, windowHeight, prompt);
  });
  
  // Function to open AI windows sequentially
  function openAIWindows(models, urls, positions, width, height, prompt, index = 0) {
    if (index >= models.length) return;
    
    const model = models[index];
    const position = positions[index];
    
    // For Grok, append the query parameter directly to the URL
    let url = urls[model];
    if (model === 'grok' && prompt) {
      url = `${urls[model]}?q=${encodeURIComponent(prompt)}`;
    }
    
    console.log(`Opening ${model} window with URL: ${url}`);
    chrome.runtime.sendMessage({
      type: 'OPEN_WINDOW',
      url: url,
      left: position.left,
      top: position.top,
      width: width,
      height: height,
      aiType: model,
      prompt: prompt
    }, function(response) {
      console.log(`${model} window opened response:`, response);
      
      // Open next window
      openAIWindows(models, urls, positions, width, height, prompt, index + 1);
    });
  }
  
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