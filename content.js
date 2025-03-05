// Content script
// This script runs on web pages that match the pattern in manifest.json

console.log('Content script loaded');

// Example: Modify page content
function modifyPage() {
  // Your code here
  console.log('Content script is running on: ' + window.location.href);
}

// Example: Send a message to the background script
function sendMessageToBackground() {
  chrome.runtime.sendMessage({ 
    type: 'CONTENT_LOADED', 
    url: window.location.href 
  }, function(response) {
    console.log('Response from background:', response);
  });
}

// Run when the page is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  modifyPage();
  sendMessageToBackground();
});
