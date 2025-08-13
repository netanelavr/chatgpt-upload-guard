// Popup script for ChatGPT Document Scanner

document.addEventListener('DOMContentLoaded', () => {
  loadPopupData();
  setupEventListeners();
});

async function loadPopupData() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url?.includes('chat.openai.com') && !tab.url?.includes('chatgpt.com')) {
      showInactiveState();
      return;
    }

    showActiveState();
    
    // Load statistics from storage
    const result = await chrome.storage.local.get(['scanStats']);
    const stats = result.scanStats || {
      totalScans: 0,
      threatsDetected: 0,
      filesBlocked: 0,
      lastScan: null
    };
    
    updateStats(stats);
    
  } catch (error) {
    console.error('Error loading popup data:', error);
    showErrorState();
  }
}

function setupEventListeners() {
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  settingsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Clear stats button
  const clearStatsBtn = document.getElementById('clearStatsBtn');
  clearStatsBtn?.addEventListener('click', async () => {
    await chrome.storage.local.clear();
    updateStats({
      totalScans: 0,
      threatsDetected: 0,
      filesBlocked: 0,
      lastScan: null
    });
  });
}

function showActiveState() {
  const statusElement = document.getElementById('status');
  const statusIcon = document.getElementById('statusIcon');
  
  if (statusElement && statusIcon) {
    statusElement.textContent = 'Active on ChatGPT';
    statusElement.className = 'status active';
    statusIcon.innerHTML = '🛡️';
  }
}

function showInactiveState() {
  const statusElement = document.getElementById('status');
  const statusIcon = document.getElementById('statusIcon');
  
  if (statusElement && statusIcon) {
    statusElement.textContent = 'Navigate to ChatGPT to activate';
    statusElement.className = 'status inactive';
    statusIcon.innerHTML = '⚪';
  }
}

function showErrorState() {
  const statusElement = document.getElementById('status');
  const statusIcon = document.getElementById('statusIcon');
  
  if (statusElement && statusIcon) {
    statusElement.textContent = 'Error loading extension';
    statusElement.className = 'status error';
    statusIcon.innerHTML = '❌';
  }
}

function updateStats(stats: any) {
  const elements = {
    totalScans: document.getElementById('totalScans'),
    threatsDetected: document.getElementById('threatsDetected'),
    filesBlocked: document.getElementById('filesBlocked'),
    lastScan: document.getElementById('lastScan')
  };

  if (elements.totalScans) elements.totalScans.textContent = stats.totalScans.toString();
  if (elements.threatsDetected) elements.threatsDetected.textContent = stats.threatsDetected.toString();
  if (elements.filesBlocked) elements.filesBlocked.textContent = stats.filesBlocked.toString();
  
  if (elements.lastScan) {
    if (stats.lastScan) {
      const lastScanDate = new Date(stats.lastScan);
      elements.lastScan.textContent = lastScanDate.toLocaleDateString();
    } else {
      elements.lastScan.textContent = 'Never';
    }
  }
}