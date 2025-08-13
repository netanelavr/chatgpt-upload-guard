// ChatGPT Document Scanner - Content Script
(function() {
    'use strict';
    
    console.log('ChatGPT Document Scanner: Content script loaded');
    
    // Configuration
    const SCAN_CONFIG = {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        supportedTypes: ['.txt', '.md', '.pdf', '.doc', '.docx', '.rtf'],
        scanTimeout: 30000 // 30 seconds
    };
    
    // State management
    let isScanning = false;
    let scanResults = [];
    
    // Create notification container
    function createNotificationContainer() {
        if (document.getElementById('chatgpt-scanner-notifications')) return;
        
        const container = document.createElement('div');
        container.id = 'chatgpt-scanner-notifications';
        container.className = 'chatgpt-scanner-notifications';
        document.body.appendChild(container);
    }
    
    // Show notification
    function showNotification(message, type = 'info', duration = 5000) {
        createNotificationContainer();
        const container = document.getElementById('chatgpt-scanner-notifications');
        
        const notification = document.createElement('div');
        notification.className = `chatgpt-scanner-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Add event listener for close button
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.remove();
            });
        }
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
    }
    
    function getNotificationIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'warning': '⚠️',
            'error': '❌',
            'success': '✅',
            'scanning': '🔍'
        };
        return icons[type] || icons.info;
    }
    
    // File reader utility
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    // Monitor file inputs
    function setupFileMonitoring() {
        console.log('Setting up file monitoring...');
        
        // Monitor for dynamically added file inputs
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check for file inputs
                        const fileInputs = node.querySelectorAll('input[type="file"]');
                        fileInputs.forEach(attachFileListener);
                        
                        // Check if the node itself is a file input
                        if (node.matches && node.matches('input[type="file"]')) {
                            attachFileListener(node);
                        }
                    }
                });
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Also check existing file inputs
        document.querySelectorAll('input[type="file"]').forEach(attachFileListener);
    }
    
    // Attach listener to file input
    function attachFileListener(fileInput) {
        if (fileInput.dataset.scannerAttached) return;
        fileInput.dataset.scannerAttached = 'true';
        
        console.log('Attaching file listener to input:', fileInput);
        
        fileInput.addEventListener('change', async (event) => {
            const files = Array.from(event.target.files);
            if (files.length === 0) return;
            
            console.log('Files selected:', files);
            
            for (const file of files) {
                await scanFile(file);
            }
        });
    }
    
    // Main file scanning function
    async function scanFile(file) {
        if (isScanning) {
            showNotification('Another scan is in progress. Please wait...', 'warning');
            return;
        }
        
        isScanning = true;
        
        try {
            console.log('Scanning file:', file.name);
            showNotification(`🔍 Scanning ${file.name} for prompt injection...`, 'scanning', 0);
            
            // File size check
            if (file.size > SCAN_CONFIG.maxFileSize) {
                throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${SCAN_CONFIG.maxFileSize / 1024 / 1024}MB)`);
            }
            
            // Read file content
            let content;
            try {
                content = await readFileAsText(file);
            } catch (error) {
                throw new Error(`Failed to read file: ${error.message}`);
            }
            
            // Send to background script for analysis
            const scanResult = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'scanContent',
                    data: {
                        filename: file.name,
                        content: content,
                        size: file.size,
                        type: file.type
                    }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });
            
            // Handle scan results
            handleScanResult(file.name, scanResult);
            
        } catch (error) {
            console.error('Scan error:', error);
            showNotification(`❌ Scan failed: ${error.message}`, 'error');
        } finally {
            isScanning = false;
            // Remove scanning notification
            const notifications = document.querySelectorAll('.chatgpt-scanner-notification.scanning');
            notifications.forEach(n => n.remove());
        }
    }
    
    // Handle scan results
    function handleScanResult(filename, result) {
        console.log('Scan result for', filename, ':', result);
        
        if (!result.success) {
            showNotification(`❌ Scan failed for ${filename}: ${result.error}`, 'error');
            return;
        }
        
        const { threats, riskLevel, summary } = result.data;
        
        // Store result
        scanResults.push({
            filename,
            timestamp: Date.now(),
            threats,
            riskLevel,
            summary
        });
        
        // Show appropriate notification
        if (riskLevel === 'high') {
            showNotification(`🚨 HIGH RISK: ${filename} contains potential prompt injection! ${summary}`, 'error', 10000);
            
            // Also show detailed warning
            showDetailedWarning(filename, threats);
            
        } else if (riskLevel === 'medium') {
            showNotification(`⚠️ MEDIUM RISK: ${filename} has suspicious content. ${summary}`, 'warning', 7000);
            
        } else if (riskLevel === 'low') {
            showNotification(`⚠️ LOW RISK: ${filename} has minor concerns. ${summary}`, 'warning', 5000);
            
        } else {
            showNotification(`✅ CLEAN: ${filename} appears safe.`, 'success');
        }
        
        // Update extension badge
        updateExtensionBadge();
    }
    
    // Group similar threats together
    function groupThreats(threats) {
        const grouped = new Map();
        
        threats.forEach(threat => {
            const key = `${threat.type}:${threat.description}:${threat.confidence}`;
            
            if (grouped.has(key)) {
                const existing = grouped.get(key);
                // Add location if it's not already included
                if (threat.location && !existing.locations.includes(threat.location)) {
                    existing.locations.push(threat.location);
                }
                // Keep track of all matches
                if (threat.match && !existing.matches.includes(threat.match)) {
                    existing.matches.push(threat.match);
                }
            } else {
                grouped.set(key, {
                    type: threat.type,
                    description: threat.description,
                    riskLevel: threat.riskLevel,
                    confidence: threat.confidence,
                    locations: threat.location ? [threat.location] : [],
                    matches: threat.match ? [threat.match] : []
                });
            }
        });
        
        return Array.from(grouped.values());
    }
    
    // Show detailed warning modal
    function showDetailedWarning(filename, threats) {
        const groupedThreats = groupThreats(threats);
        const modal = document.createElement('div');
        modal.className = 'chatgpt-scanner-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🚨 Security Warning</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>File:</strong> ${filename}</p>
                    <p><strong>Risk Level:</strong> HIGH</p>
                    <h4>Detected Threats:</h4>
                    <ul>
                        ${groupedThreats.map(threat => `
                            <li>
                                <strong>${threat.type}:</strong> ${threat.description}
                            </li>
                        `).join('')}
                    </ul>
                    <div class="warning-text">
                        <p>⚠️ This document may contain prompt injection attempts. Consider reviewing it carefully before uploading.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal functionality
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    // Update extension badge
    function updateExtensionBadge() {
        const highRiskCount = scanResults.filter(r => r.riskLevel === 'high').length;
        chrome.runtime.sendMessage({
            action: 'updateBadge',
            data: { count: highRiskCount }
        });
    }
    
    // Initialize when DOM is ready
    function initialize() {
        console.log('ChatGPT Document Scanner: Initializing...');
        
        // Wait for ChatGPT to load
        const checkLoaded = () => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setupFileMonitoring();
                showNotification('ChatGPT Document Scanner is active', 'info', 3000);
            } else {
                setTimeout(checkLoaded, 100);
            }
        };
        
        checkLoaded();
    }
    
    // Start when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'getScanResults') {
            sendResponse({ results: scanResults });
        }
        return true;
    });
    
})();