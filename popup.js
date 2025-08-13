// ChatGPT Document Scanner - Popup Script
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup loaded');
    
    // Initialize popup
    initializeTabs();
    initializeSettings();
    await loadData();
    setupEventListeners();
    updateStatus();
    
    // Update data every 2 seconds
    setInterval(loadData, 2000);
});

// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
            
            // Load specific tab data
            if (targetTab === 'results') {
                loadResults();
            }
        });
    });
}

// Settings Management
function initializeSettings() {
    loadSettings();
    
    // Save settings when changed
    const settingInputs = document.querySelectorAll('#settings input, #settings select');
    settingInputs.forEach(input => {
        input.addEventListener('change', saveSettings);
    });
    
    // Reset settings button
    document.getElementById('resetSettings').addEventListener('click', resetSettings);
}

function loadSettings() {
    chrome.storage.sync.get({
        enableNotifications: true,
        autoScan: true,
        detailedWarnings: true,
        sensitivity: 'medium',
        maxFileSize: 10
    }, (settings) => {
        document.getElementById('enableNotifications').checked = settings.enableNotifications;
        document.getElementById('autoScan').checked = settings.autoScan;
        document.getElementById('detailedWarnings').checked = settings.detailedWarnings;
        document.getElementById('sensitivity').value = settings.sensitivity;
        document.getElementById('maxFileSize').value = settings.maxFileSize;
    });
}

function saveSettings() {
    const settings = {
        enableNotifications: document.getElementById('enableNotifications').checked,
        autoScan: document.getElementById('autoScan').checked,
        detailedWarnings: document.getElementById('detailedWarnings').checked,
        sensitivity: document.getElementById('sensitivity').value,
        maxFileSize: parseInt(document.getElementById('maxFileSize').value)
    };
    
    chrome.storage.sync.set(settings, () => {
        console.log('Settings saved:', settings);
        showToast('Settings saved successfully');
    });
}

function resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
        chrome.storage.sync.clear(() => {
            loadSettings();
            showToast('Settings reset to defaults');
        });
    }
}

// Data Loading
async function loadData() {
    await Promise.all([
        loadDashboard(),
        updateStatus()
    ]);
}

async function loadDashboard() {
    try {
        // Get scan results from active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || (!tab.url.includes('chat.openai.com') && !tab.url.includes('chatgpt.com'))) {
            updateStatus('inactive', 'Not on ChatGPT');
            return;
        }
        
        // Get results from content script
        chrome.tabs.sendMessage(tab.id, { action: 'getScanResults' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Could not communicate with content script');
                return;
            }
            
            if (response && response.results) {
                updateDashboard(response.results);
            }
        });
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateDashboard(results) {
    const stats = calculateStats(results);
    
    // Update stat cards
    document.getElementById('totalScans').textContent = stats.total;
    document.getElementById('highRiskCount').textContent = stats.high;
    document.getElementById('mediumRiskCount').textContent = stats.medium;
    document.getElementById('lowRiskCount').textContent = stats.low;
    
    // Update recent activity
    updateRecentActivity(results.slice(-5).reverse());
}

function calculateStats(results) {
    return {
        total: results.length,
        high: results.filter(r => r.riskLevel === 'high').length,
        medium: results.filter(r => r.riskLevel === 'medium').length,
        low: results.filter(r => r.riskLevel === 'low').length,
        clean: results.filter(r => r.riskLevel === 'clean').length
    };
}

function updateRecentActivity(recentResults) {
    const container = document.getElementById('recentScans');
    
    if (recentResults.length === 0) {
        container.innerHTML = '<div class="no-activity">No recent scans</div>';
        return;
    }
    
    container.innerHTML = recentResults.map(result => `
        <div class="activity-item ${result.riskLevel}">
            <div class="activity-icon">${getRiskIcon(result.riskLevel)}</div>
            <div class="activity-details">
                <div class="activity-filename">${escapeHtml(result.filename)}</div>
                <div class="activity-summary">${escapeHtml(result.summary)}</div>
            </div>
            <div class="activity-time">${formatTime(result.timestamp)}</div>
        </div>
    `).join('');
}

function loadResults() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        
        if (!tab || (!tab.url.includes('chat.openai.com') && !tab.url.includes('chatgpt.com'))) {
            document.getElementById('resultsContainer').innerHTML = 
                '<div class="no-results">Please navigate to ChatGPT to view results</div>';
            return;
        }
        
        chrome.tabs.sendMessage(tab.id, { action: 'getScanResults' }, (response) => {
            if (chrome.runtime.lastError || !response) {
                document.getElementById('resultsContainer').innerHTML = 
                    '<div class="no-results">No scan results available</div>';
                return;
            }
            
            displayResults(response.results);
        });
    });
}

function displayResults(results) {
    const container = document.getElementById('resultsContainer');
    const filter = document.getElementById('riskFilter').value;
    
    let filteredResults = results;
    if (filter !== 'all') {
        filteredResults = results.filter(r => r.riskLevel === filter);
    }
    
    if (filteredResults.length === 0) {
        container.innerHTML = '<div class="no-results">No results match the current filter</div>';
        return;
    }
    
    container.innerHTML = filteredResults.map(result => `
        <div class="result-item ${result.riskLevel}">
            <div class="result-header">
                <div class="result-filename">${escapeHtml(result.filename)}</div>
                <div class="result-risk ${result.riskLevel}">${result.riskLevel}</div>
            </div>
            <div class="result-summary">${escapeHtml(result.summary)}</div>
            <div class="result-details">
                ${result.threats.length} threat(s) detected • 
                Scanned ${formatTime(result.timestamp)}
            </div>
        </div>
    `).join('');
}

// Status Management
function updateStatus(status = 'active', text = 'Active on ChatGPT') {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    indicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
}

// Event Listeners
function setupEventListeners() {
    // Clear history button
    document.getElementById('clearHistory').addEventListener('click', () => {
        if (confirm('Clear all scan history?')) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];
                if (tab) {
                    chrome.tabs.sendMessage(tab.id, { action: 'clearHistory' });
                    loadData();
                    showToast('History cleared');
                }
            });
        }
    });
    
    // Export results button
    document.getElementById('exportResults').addEventListener('click', exportResults);
    
    // Risk filter
    document.getElementById('riskFilter').addEventListener('change', loadResults);
}

// Utility Functions
function getRiskIcon(riskLevel) {
    const icons = {
        high: '🚨',
        medium: '⚠️',
        low: '⚡',
        clean: '✅'
    };
    return icons[riskLevel] || '📄';
}

function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function exportResults() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab) return;
        
        chrome.tabs.sendMessage(tab.id, { action: 'getScanResults' }, (response) => {
            if (!response || !response.results) {
                showToast('No results to export');
                return;
            }
            
            const results = response.results;
            const csvContent = generateCSV(results);
            downloadCSV(csvContent, 'chatgpt-scan-results.csv');
            showToast('Results exported successfully');
        });
    });
}

function generateCSV(results) {
    const headers = ['Filename', 'Risk Level', 'Summary', 'Threat Count', 'Timestamp'];
    const rows = results.map(result => [
        result.filename,
        result.riskLevel,
        result.summary.replace(/"/g, '""'),
        result.threats.length,
        new Date(result.timestamp).toISOString()
    ]);
    
    return [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
}