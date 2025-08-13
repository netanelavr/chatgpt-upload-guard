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

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'THREAT_DETECTED':
      // Log threat detection
      console.log('Threat detected in file:', message.data);
      break;
      
    case 'FILE_SCANNED':
      // Log successful scan
      console.log('File scanned successfully:', message.data);
      break;
      
    case 'SCAN_ERROR':
      // Log scan error
      console.error('Scan error:', message.data);
      break;
  }
});

// Badge management
chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });

export {};