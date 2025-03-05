import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const Popup = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // Example: Get data from storage
    chrome.storage.local.get(['count'], (result) => {
      if (result.count) {
        setCount(result.count);
      }
    });
  }, []);
  
  const incrementCount = () => {
    const newCount = count + 1;
    setCount(newCount);
    chrome.storage.local.set({ count: newCount });
  };
  
  return (
    <div className="popup-container">
      <h1>My Extension</h1>
      <p>You clicked {count} times</p>
      <button onClick={incrementCount}>Click me</button>
    </div>
  );
};

ReactDOM.render(<Popup />, document.getElementById('popup-root'));