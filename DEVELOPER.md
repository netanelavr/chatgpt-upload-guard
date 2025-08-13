# Developer Guide - ChatGPT Document Scanner

This guide is for developers who want to understand, modify, or extend the ChatGPT Document Scanner extension.

## Architecture Overview

The extension follows Chrome Extension Manifest V3 architecture with the following components:

### Core Components

1. **Content Script** (`content.js`)
   - Runs in the context of ChatGPT pages
   - Monitors DOM for file input elements
   - Intercepts file uploads and reads content
   - Displays notifications and warnings to users
   - Communicates with background script for analysis

2. **Background Script** (`background.js`)
   - Service worker that handles threat detection
   - Contains pattern matching algorithms
   - Manages extension state and badge updates
   - Processes scan requests from content script

3. **Popup Interface** (`popup.html/js/css`)
   - Extension popup with three main tabs
   - Dashboard for statistics and recent activity
   - Results viewer with filtering capabilities
   - Settings panel for user configuration

4. **Styles** (`styles.css`)
   - CSS for content script notifications
   - Modal styling for detailed warnings
   - Responsive design for different screen sizes

## Code Structure

### Content Script (`content.js`)

```javascript
// Key functions and their purposes:

setupFileMonitoring()        // Sets up DOM observers for file inputs
attachFileListener()         // Attaches change listeners to file inputs
scanFile()                   // Main file scanning orchestrator
handleScanResult()           // Processes and displays scan results
showNotification()           // Creates and manages notifications
showDetailedWarning()        // Shows detailed threat information modal
```

**Key Design Patterns:**
- Observer pattern for DOM monitoring
- Promise-based file reading
- Event-driven notification system
- State management for scanning status

### Background Script (`background.js`)

```javascript
// Core detection system:

INJECTION_PATTERNS           // Threat pattern definitions
scanContent()               // Main scanning function
assessRisk()                // Risk level calculation
generateSummary()           // Result summary generation
performAdditionalAnalysis() // Extended threat detection
```

**Pattern Categories:**
- **High Risk**: Direct prompt injection attempts
- **Medium Risk**: Suspicious patterns, social engineering
- **Low Risk**: Potentially concerning but often legitimate

### Popup Interface (`popup.js`)

```javascript
// Interface management:

initializeTabs()            // Tab navigation setup
loadDashboard()             // Dashboard data loading
displayResults()            // Results table rendering
updateStatus()              // Extension status updates
exportResults()             // CSV export functionality
```

## Detection Algorithm

### Pattern Matching System

The threat detection system uses regular expressions with confidence scoring:

```javascript
const pattern = {
    name: 'Pattern Name',
    pattern: /regex-pattern/gi,
    description: 'What this pattern detects',
    riskLevel: 'high|medium|low',
    confidence: 0.0-1.0
};
```

### Risk Assessment Logic

```javascript
function assessRisk(threats) {
    const riskCounts = {
        high: threats.filter(t => t.riskLevel === 'high').length,
        medium: threats.filter(t => t.riskLevel === 'medium').length,
        low: threats.filter(t => t.riskLevel === 'low').length
    };
    
    // Risk escalation rules:
    if (riskCounts.high > 0) return 'high';
    if (riskCounts.medium > 1) return 'high';
    if (riskCounts.medium > 0 || riskCounts.low > 2) return 'medium';
    if (riskCounts.low > 0) return 'low';
    return 'clean';
}
```

## Adding New Detection Patterns

### 1. Define Pattern Object

Add to `INJECTION_PATTERNS` in `background.js`:

```javascript
INJECTION_PATTERNS.highRisk.push({
    name: 'Your Pattern Name',
    pattern: /your-regex-here/gi,
    description: 'Description of what this detects'
});
```

### 2. Pattern Guidelines

- Use case-insensitive matching (`/gi` flags)
- Make patterns specific enough to avoid false positives
- Include word boundaries where appropriate
- Test patterns thoroughly with various inputs

### 3. Pattern Examples

```javascript
// Good pattern - specific and targeted
{
    name: 'Direct Instruction Override',
    pattern: /ignore\s+(?:all\s+)?previous\s+instructions?/gi,
    description: 'Direct attempts to override system instructions'
}

// Avoid - too broad, many false positives
{
    name: 'Contains "ignore"',
    pattern: /ignore/gi,
    description: 'Contains the word ignore'
}
```

## Extending Functionality

### Adding New Analysis Types

1. **Create Analysis Function**

```javascript
function performCustomAnalysis(content, threats) {
    // Your custom analysis logic
    const customThreats = analyzeCustomPatterns(content);
    threats.push(...customThreats);
}
```

2. **Integrate into Scanning Pipeline**

```javascript
function scanContent(content, filename) {
    // ... existing code ...
    
    // Add your analysis
    performCustomAnalysis(content, threats);
    
    // ... rest of function ...
}
```

### Adding New UI Components

1. **Update Popup HTML** (`popup.html`)
2. **Add Styling** (`popup.css`)
3. **Implement Functionality** (`popup.js`)

Example: Adding a new tab

```html
<!-- Add to tabs section -->
<button class="tab-button" data-tab="newtab">New Tab</button>

<!-- Add content section -->
<div class="tab-content" id="newtab">
    <!-- Your content here -->
</div>
```

## Testing and Debugging

### Testing Strategy

1. **Unit Testing**: Test individual functions with known inputs
2. **Integration Testing**: Test full scanning pipeline
3. **User Testing**: Test with provided test files
4. **Edge Case Testing**: Test with malformed or unusual inputs

### Test Files Usage

The provided test files cover different threat levels:

```javascript
// Expected results for test files:
const expectedResults = {
    'high-risk-document.txt': {
        riskLevel: 'high',
        threatCount: 2,
        patterns: ['Instruction Override', 'Role Playing Injection']
    },
    'medium-risk-document.txt': {
        riskLevel: 'medium',
        threatCount: 3,
        patterns: ['Authority Claims', 'Emotional Manipulation']
    }
    // ... etc
};
```

### Debugging Tools

1. **Chrome DevTools**
   - Console logs for extension behavior
   - Network tab for permission issues
   - Application tab for storage inspection

2. **Extension Debug Mode**
   ```javascript
   // Add to content script for verbose logging
   const DEBUG = true;
   if (DEBUG) console.log('Debug info:', data);
   ```

3. **Background Script Inspection**
   - Go to `chrome://extensions/`
   - Click "Inspect views: background page"
   - Use console for background script debugging

## Performance Considerations

### Optimization Guidelines

1. **Pattern Efficiency**
   - Use efficient regex patterns
   - Avoid catastrophic backtracking
   - Test patterns with large inputs

2. **Memory Management**
   - Limit scan history size
   - Clean up event listeners
   - Avoid memory leaks in observers

3. **File Size Limits**
   - Implement reasonable file size limits
   - Provide user feedback for large files
   - Consider streaming for very large files

### Performance Monitoring

```javascript
function scanContent(content, filename) {
    const startTime = performance.now();
    
    // ... scanning logic ...
    
    const endTime = performance.now();
    console.log(`Scan took ${endTime - startTime} milliseconds`);
}
```

## Security Considerations

### Data Privacy

- All processing happens locally
- No data transmitted to external servers
- Scan results stored only in local storage
- User can clear data at any time

### Permission Model

```javascript
// Minimal permissions requested
{
    "permissions": [
        "activeTab",    // Only active tab access
        "storage",      // Local storage only
        "notifications" // User notifications
    ],
    "host_permissions": [
        "https://chat.openai.com/*",
        "https://chatgpt.com/*"
    ]
}
```

### Content Security Policy

The extension follows CSP best practices:
- No inline scripts
- No eval() usage
- External resources properly declared

## Contributing Guidelines

### Code Style

1. **JavaScript**
   - Use meaningful variable names
   - Add comments for complex logic
   - Follow consistent indentation
   - Use modern ES6+ features where appropriate

2. **CSS**
   - Use semantic class names
   - Organize styles logically
   - Maintain responsive design
   - Follow BEM naming convention where applicable

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit pull request with clear description

### Pattern Submission Guidelines

When submitting new detection patterns:

1. Provide test cases that trigger the pattern
2. Include examples of false positives to avoid
3. Explain the security rationale
4. Suggest appropriate risk level and confidence score

## Common Development Scenarios

### Adding Support for New File Types

1. Update `supportedTypes` in content script
2. Add file type detection logic
3. Implement appropriate content extraction
4. Test with various file formats

### Modifying Risk Assessment

1. Update `assessRisk()` function
2. Adjust risk escalation rules
3. Test with existing test files
4. Update documentation

### Customizing Notifications

1. Modify notification templates in content script
2. Update styling in styles.css
3. Add new notification types as needed
4. Test notification behavior

## API Reference

### Content Script Functions

```javascript
scanFile(file)              // Returns: Promise<void>
showNotification(msg, type) // Returns: void
handleScanResult(filename, result) // Returns: void
```

### Background Script Functions

```javascript
scanContent(content, filename) // Returns: ScanResult
assessRisk(threats)            // Returns: string
generateSummary(threats, risk) // Returns: string
```

### Storage Schema

```javascript
// Chrome storage structure
{
    settings: {
        enableNotifications: boolean,
        autoScan: boolean,
        detailedWarnings: boolean,
        sensitivity: 'low'|'medium'|'high',
        maxFileSize: number
    },
    scanHistory: Array<ScanResult>
}
```

This developer guide provides the foundation for understanding and extending the ChatGPT Document Scanner extension. For specific implementation questions, refer to the inline code comments and test files.