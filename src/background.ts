// Background script for ChatGPT Upload Guard

// Set up the extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ChatGPT Upload Guard installed');
    
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ChatGPT Upload Guard',
      message: 'Extension installed successfully! Your uploads to ChatGPT will now be scanned for security threats.'
    });
  }
});


// Badge management
chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });

export {};