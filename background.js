// ChatGPT Document Scanner - Background Script
console.log('ChatGPT Document Scanner: Background script loaded');

// Prompt injection detection patterns
const INJECTION_PATTERNS = {
    highRisk: [
        {
            name: 'Instruction Override',
            pattern: /(?:ignore|forget|disregard|override|replace)[\s\w]*(?:previous|above|prior|earlier|system|initial)[\s\w]*(?:instructions?|prompts?|rules?|guidelines?)/gi,
            description: 'Attempts to override system instructions'
        },
        {
            name: 'System Prompt Extraction',
            pattern: /(?:show|tell|reveal|display|print|output|return)[\s\w]*(?:system|initial|original|base)[\s\w]*(?:prompt|instructions?|rules?|guidelines?)/gi,
            description: 'Attempts to extract system prompts'
        },
        {
            name: 'Role Playing Injection',
            pattern: /(?:you are now|from now on|pretend to be|act as|role.*play|simulate being)[\s\w]*(?:jailbroken|unrestricted|without limits|dan|evil|harmful)/gi,
            description: 'Malicious role-playing instructions'
        },
        {
            name: 'Jailbreak Attempt',
            pattern: /(?:jailbreak|break.*character|exit.*mode|developer.*mode|god.*mode|admin.*mode|root.*access)/gi,
            description: 'Attempts to bypass safety measures'
        }
    ],
    mediumRisk: [
        {
            name: 'Hidden Instructions',
            pattern: /\u200B|\u200C|\u200D|\uFEFF|[\u2060-\u206F]/g,
            description: 'Hidden unicode characters that may contain instructions'
        },
        {
            name: 'Emotional Manipulation',
            pattern: /(?:please\s+(?:help|urgent|save)|(?:emergency|crisis|desperate|dying).*(?:help|please|need)|life.*(?:death|dying).*(?:help|save)|save.*me.*(?:urgent|emergency|dying))/gi,
            description: 'Emotional manipulation attempts'
        },
        {
            name: 'Authority Claims',
            pattern: /(?:i am|this is)[\s\w]*(?:your|the)[\s\w]*(?:creator|developer|admin|owner|boss|superior)(?:\s|$)/gi,
            description: 'False authority claims'
        }
    ],
    lowRisk: [
        {
            name: 'Programming Instructions',
            pattern: /(?:write|create|generate)[\s\w]*(?:code|script|program|function)[\s\w]*(?:that|to|for)/gi,
            description: 'Programming-related instructions'
        },
        {
            name: 'Hypothetical Scenarios',
            pattern: /(?:imagine|suppose|what if|hypothetically|in.*scenario|pretend that)/gi,
            description: 'Hypothetical scenario setup'
        }
    ]
};

// Main content scanning function
function scanContent(content, filename) {
    console.log('Scanning content:', filename);
    
    const threats = [];
    
    // Scan for patterns
    Object.entries(INJECTION_PATTERNS).forEach(([riskLevel, patterns]) => {
        patterns.forEach(pattern => {
            let match;
            const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
            
            while ((match = regex.exec(content)) !== null) {
                const matchText = match[0];
                const matchIndex = match.index;
                const lineNumber = content.substring(0, matchIndex).split('\n').length;
                
                const confidence = riskLevel === 'highRisk' ? 0.9 : 
                                riskLevel === 'mediumRisk' ? 0.7 : 0.5;
                
                threats.push({
                    type: pattern.name,
                    description: pattern.description,
                    riskLevel: riskLevel.replace('Risk', ''),
                    confidence: confidence,
                    match: matchText.trim(),
                    location: `Line ${lineNumber}`
                });
                
                // Prevent infinite loop for global regexes
                if (!pattern.pattern.global) break;
            }
        });
    });
    
    // Calculate overall risk
    const riskLevel = assessRisk(threats);
    const summary = generateSummary(threats, riskLevel);
    
    return {
        threats: threats,
        riskLevel: riskLevel,
        summary: summary,
        stats: {
            contentLength: content.length,
            threatCount: threats.length
        }
    };
}

function assessRisk(threats) {
    const riskCounts = {
        high: threats.filter(t => t.riskLevel === 'high').length,
        medium: threats.filter(t => t.riskLevel === 'medium').length,
        low: threats.filter(t => t.riskLevel === 'low').length
    };
    
    if (riskCounts.high > 0) return 'high';
    if (riskCounts.medium > 1) return 'high';
    if (riskCounts.medium > 0 || riskCounts.low > 2) return 'medium';
    if (riskCounts.low > 0) return 'low';
    return 'clean';
}

function generateSummary(threats, riskLevel) {
    if (threats.length === 0) {
        return 'No security threats detected.';
    }
    
    const threatTypes = [...new Set(threats.map(t => t.type))];
    const highRisk = threats.filter(t => t.riskLevel === 'high');
    
    if (riskLevel === 'high') {
        return `${highRisk.length} high-risk threat(s) detected: ${threatTypes.slice(0, 2).join(', ')}`;
    } else if (riskLevel === 'medium') {
        return `${threats.length} potential threat(s) detected: ${threatTypes.slice(0, 2).join(', ')}`;
    } else {
        return `${threats.length} minor concern(s) detected.`;
    }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    if (message.action === 'scanContent') {
        try {
            const result = scanContent(message.data.content, message.data.filename);
            sendResponse({ success: true, data: result });
        } catch (error) {
            console.error('Scan error:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Async response for scanContent
    } else if (message.action === 'updateBadge') {
        const count = message.data.count;
        if (count > 0) {
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#ff4444' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
        sendResponse({ success: true }); // Send response for updateBadge
        return false; // No async response needed
    }
    
    return false; // No async response for unknown actions
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('ChatGPT Document Scanner installed');
    chrome.action.setBadgeText({ text: '' });
});