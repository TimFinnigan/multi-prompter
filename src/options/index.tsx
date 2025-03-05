import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const Options = () => {
  const [settings, setSettings] = useState({
    enabled: true,
    theme: 'light'
  });
  
  useEffect(() => {
    // Load settings from storage
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
    });
  }, []);
  
  const saveSettings = () => {
    chrome.storage.local.set({ settings });
    alert('Settings saved!');
  };
  
  return (
    <div className="options-container">
      <h1>Extension Options</h1>
      
      <div className="option">
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
          />
          Enable extension
        </label>
      </div>
      
      <div className="option">
        <label>Theme:</label>
        <select
          value={settings.theme}
          onChange={(e) => setSettings({...settings, theme: e.target.value})}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      
      <button onClick={saveSettings}>Save Settings</button>
    </div>
  );
};

ReactDOM.render(<Options />, document.getElementById('options-root'));