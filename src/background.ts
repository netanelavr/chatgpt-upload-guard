// Background script for ChatGPT Document Scanner

// Set up the extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ChatGPT Document Scanner installed');
    
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ChatGPT Document Scanner',
      message: 'Extension installed successfully! Your uploads to ChatGPT will now be scanned for security threats.'
    });
  }
});


// Badge management
chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });

export {};