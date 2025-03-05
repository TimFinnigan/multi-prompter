// Simple options script for direct loading
document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const enabledCheckbox = document.getElementById('enabled');
  const themeSelect = document.getElementById('theme');
  const saveButton = document.getElementById('save');
  const statusElement = document.getElementById('status');
  
  // Load saved settings
  chrome.storage.local.get(['settings'], function(result) {
    const settings = result.settings || { enabled: true, theme: 'light' };
    
    enabledCheckbox.checked = settings.enabled;
    themeSelect.value = settings.theme;
  });
  
  // Save settings
  saveButton.addEventListener('click', function() {
    const settings = {
      enabled: enabledCheckbox.checked,
      theme: themeSelect.value
    };
    
    chrome.storage.local.set({ settings: settings }, function() {
      statusElement.textContent = 'Settings saved!';
      statusElement.className = 'success';
      
      setTimeout(function() {
        statusElement.textContent = '';
        statusElement.className = '';
      }, 1500);
    });
  });
});