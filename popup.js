// Popup script with integrated functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const promptInput = document.getElementById('promptInput');
  const openAIModelsButton = document.getElementById('openAIModels');
  const settingsButton = document.getElementById('settingsButton');
  const settingsPanel = document.getElementById('settings-panel');
  const saveSettingsButton = document.getElementById('saveSettings');
  
  // AI model checkboxes
  const chatgptCheckbox = document.getElementById('chatgpt');
  const claudeCheckbox = document.getElementById('claude');
  const grokCheckbox = document.getElementById('grok');
  const geminiCheckbox = document.getElementById('gemini');
  
  // Layout radio buttons
  const layoutGrid = document.getElementById('layoutGrid');
  const layoutHorizontal = document.getElementById('layoutHorizontal');
  
  console.log('Popup loaded');
  
  // Focus on the input field when the popup opens
  promptInput.focus();
  
  // Load settings from storage
  loadSettings();
  
  // Load last prompt from storage
  chrome.runtime.sendMessage({ type: 'GET_LAST_SEARCHES' }, function(response) {
    console.log('Got last prompt:', response);
    if (response && response.success && response.lastSearches) {
      promptInput.value = response.lastSearches.left || '';
      // Place cursor at the end of the text
      promptInput.setSelectionRange(promptInput.value.length, promptInput.value.length);
    }
  });
  
  // Settings button click handler
  settingsButton.addEventListener('click', function() {
    settingsPanel.classList.toggle('hidden');
  });
  
  // Save settings button click handler
  saveSettingsButton.addEventListener('click', function() {
    settingsPanel.classList.add('hidden');
    saveSettings();
  });
  
  // Function to save settings to storage
  function saveSettings() {
    const settings = {
      models: {
        chatgpt: chatgptCheckbox.checked,
        claude: claudeCheckbox.checked,
        grok: grokCheckbox.checked,
        gemini: geminiCheckbox.checked
      },
      layout: layoutGrid.checked ? 'grid' : 'horizontal'
    };
    
    chrome.storage.local.set({ aiPrompterSettings: settings }, function() {
      console.log('Settings saved:', settings);
    });
  }
  
  // Function to load settings from storage
  function loadSettings() {
    chrome.storage.local.get(['aiPrompterSettings'], function(result) {
      if (result.aiPrompterSettings) {
        const settings = result.aiPrompterSettings;
        
        // Set AI model checkboxes
        if (settings.models) {
          chatgptCheckbox.checked = settings.models.chatgpt !== false;
          claudeCheckbox.checked = settings.models.claude !== false;
          grokCheckbox.checked = settings.models.grok !== false;
          geminiCheckbox.checked = settings.models.gemini !== false;
        }
        
        // Set layout radio buttons
        if (settings.layout) {
          if (settings.layout === 'grid') {
            layoutGrid.checked = true;
          } else if (settings.layout === 'horizontal') {
            layoutHorizontal.checked = true;
          }
        }
      }
    });
  }
  
  // Function to handle form submission
  function submitPrompt() {
    console.log('Submitting prompt');
    const prompt = promptInput.value.trim();
    
    if (!prompt) {
      alert('Please enter a prompt');
      return;
    }
    
    // Get selected AI models
    const selectedModels = [];
    if (chatgptCheckbox.checked) selectedModels.push('chatgpt');
    if (claudeCheckbox.checked) selectedModels.push('claude');
    if (grokCheckbox.checked) selectedModels.push('grok');
    if (geminiCheckbox.checked) selectedModels.push('gemini');
    
    // Check if at least one AI model is selected
    if (selectedModels.length === 0) {
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
  }
  
  // Open AI models button click handler
  openAIModelsButton.addEventListener('click', submitPrompt);
  
  // Add event listener for Enter key on the input field
  promptInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitPrompt();
    }
  });
  
  // Function to open AI windows sequentially
  function openAIWindows(models, urls, positions, width, height, prompt, index = 0) {
    if (index >= models.length) {
      // Close the popup when all windows are opened
      window.close();
      return;
    }
    
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
});