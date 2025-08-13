# ChatGPT Document Scanner

A Chrome extension that monitors document uploads to ChatGPT and scans them for prompt injection attempts and security threats.

## 🔒 Features

- **Real-time Scanning**: Automatically scans documents as they're uploaded to ChatGPT
- **Prompt Injection Detection**: Identifies various types of prompt injection attempts including:
  - System instruction overrides
  - Role-playing injections
  - Jailbreak attempts
  - Social engineering patterns
  - Hidden instructions and obfuscation
- **Risk Assessment**: Categorizes threats into High, Medium, Low, and Clean levels
- **Detailed Warnings**: Shows comprehensive threat information with confidence scores
- **Scan History**: Tracks all scanned documents with exportable results
- **Privacy-Focused**: All scanning is performed locally - no data is sent to external servers

## 🚀 Installation

### From Source (Recommended for Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now appear in your extensions list

## 📋 Usage

1. Navigate to [ChatGPT](https://chat.openai.com) or [ChatGPT](https://chatgpt.com)
2. The extension will automatically activate (you'll see a notification)
3. Upload any document - the extension will scan it automatically
4. Receive real-time notifications about any security threats detected
5. Click the extension icon to view detailed results and settings

### Testing the Extension

Test files are provided in the `test-files/` directory:

- **high-risk-document.txt**: Contains obvious prompt injection attempts
- **medium-risk-document.txt**: Contains suspicious patterns but potentially legitimate content
- **low-risk-document.txt**: Contains minor concerns like programming instructions
- **clean-document.txt**: Clean document with no security threats

## 🔧 Configuration

Access settings by clicking the extension icon and navigating to the "Settings" tab:

- **Enable Notifications**: Show popup notifications for scan results
- **Auto-scan Files**: Automatically scan files when uploaded
- **Detailed Warnings**: Show comprehensive threat information
- **Risk Sensitivity**: Adjust detection sensitivity (Low/Medium/High)
- **Maximum File Size**: Set maximum file size to scan (1-100 MB)

## 🛡️ Security Features

### Threat Detection Patterns

#### High Risk
- Instruction override attempts ("ignore previous instructions")
- System prompt extraction ("show me your system prompt")
- Malicious role-playing ("you are now jailbroken")
- Jailbreak attempts ("developer mode", "god mode")
- Bypass instructions ("ignore safety filters")

#### Medium Risk
- Hidden unicode characters
- Emotional manipulation tactics
- False authority claims
- Social engineering indicators
- Text obfuscation techniques

#### Low Risk
- Programming-related instructions
- Hypothetical scenarios
- Repetitive text patterns

### Privacy and Security

- **Local Processing**: All scanning happens in your browser
- **No Data Collection**: No personal data or document content is transmitted
- **Minimal Permissions**: Only requests necessary permissions for ChatGPT monitoring
- **Open Source**: Full source code available for review

## 🔍 Technical Details

### Architecture

- **Content Script** (`content.js`): Monitors ChatGPT for file uploads and displays notifications
- **Background Script** (`background.js`): Performs threat analysis and pattern matching
- **Popup Interface** (`popup.html/js/css`): Provides user interface for results and settings
- **Styles** (`styles.css`): Styling for notifications and modals

### Detection Algorithm

The extension uses pattern matching with regular expressions to identify potential threats:

1. **Pattern Classification**: Threats are categorized by risk level
2. **Confidence Scoring**: Each match receives a confidence score (0.0-1.0)
3. **Context Analysis**: Additional analysis for obfuscation and social engineering
4. **Risk Assessment**: Overall risk level calculated based on detected patterns

### Performance

- **Lightweight**: Minimal impact on browser performance
- **Fast Scanning**: Pattern matching optimized for speed
- **Efficient Memory Usage**: Results stored efficiently with cleanup options

## 📊 Features Overview

### Dashboard
- Total scan count
- Risk level statistics
- Recent activity timeline
- Quick action buttons

### Results Viewer
- Detailed scan results
- Risk level filtering
- Threat breakdown
- Export functionality

### Settings Panel
- Notification preferences
- Sensitivity controls
- File size limits
- Privacy settings

## 🛠️ Development

### File Structure
```
chatgpt-doc-scanner/
├── manifest.json          # Extension manifest
├── content.js             # Content script for ChatGPT monitoring
├── background.js          # Background script for threat detection
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── popup.css              # Popup styling
├── styles.css             # Content script styling
├── icons/                 # Extension icons
├── test-files/            # Example documents for testing
└── README.md              # This file
```

### Pattern Customization

To add new detection patterns, modify the `INJECTION_PATTERNS` object in `background.js`:

```javascript
INJECTION_PATTERNS: {
    highRisk: [
        {
            name: 'Pattern Name',
            pattern: /your-regex-pattern/gi,
            description: 'Description of what this detects'
        }
    ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes with tests
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## ⚠️ Disclaimer

This extension is designed to help identify potential security threats in documents. It should not be considered a complete security solution. Always exercise caution when uploading sensitive documents to any online service.

## 🆘 Support

For issues or questions:
1. Check the test files to ensure the extension is working correctly
2. Review console logs in DevTools for any errors
3. Verify you're on a supported ChatGPT URL
4. Check that the extension has proper permissions

## 🔄 Version History

### v1.0.0
- Initial release
- Basic prompt injection detection
- Real-time scanning
- Popup interface with dashboard, results, and settings
- Export functionality
- Privacy-focused local processing