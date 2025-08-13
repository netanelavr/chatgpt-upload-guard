# ChatGPT Document Scanner

A Chrome extension that detects prompt injection attacks in documents uploaded to ChatGPT using local AI analysis.

## 🛡️ Features

- **Real-time Scanning**: Automatically scans all document uploads to ChatGPT
- **Multi-format Support**: Supports `.txt`, `.docx`, and `.pdf` files
- **Local AI Analysis**: Uses WebLLM for private, in-browser threat detection
- **Smart Detection**: Identifies multiple types of attacks:
  - Prompt injection attempts
  - Jailbreak prompts (DAN, roleplay attacks, etc.)
  - Social engineering attempts
  - Data extraction attempts
  - System instruction overrides
- **User-friendly Interface**: Clean notifications and detailed threat reports
- **Privacy-focused**: All processing happens locally in your browser

## 🚀 Installation

### Option 1: Install from Chrome Web Store (Coming Soon)
*This extension will be available on the Chrome Web Store soon.*

### Option 2: Install from Source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/chatgpt-doc-scanner.git
   cd chatgpt-doc-scanner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the project folder

## 📖 How to Use

1. **Navigate to ChatGPT**: Go to [chat.openai.com](https://chat.openai.com) or [chatgpt.com](https://chatgpt.com)

2. **Upload a document**: Try to upload a `.txt`, `.docx`, or `.pdf` file

3. **Automatic scanning**: The extension will automatically:
   - Extract content from your file
   - Analyze it for security threats using local AI
   - Show results:
     - ✅ **Safe files**: Brief notification
     - ⚠️ **Threats detected**: Detailed popup with options

4. **Review results**: If threats are detected, you can:
   - **Block Upload**: Prevent the potentially dangerous file from being uploaded
   - **Proceed Anyway**: Continue with the upload (not recommended)

## 🔧 Development

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Chrome browser

### Development Scripts
```bash
# Install dependencies
npm install

# Build for development (with watch mode)
npm run dev

# Build for production
npm run build

# Clean build directory
npm run clean
```

### Project Structure
```
chatgpt-doc-scanner/
├── src/
│   ├── content.ts          # Main content script
│   ├── background.ts       # Background service worker
│   ├── popup.ts           # Extension popup
│   ├── fileParser.ts      # File parsing utilities
│   ├── threatDetector.ts  # AI-powered threat detection
│   └── uiComponents.ts    # UI components and notifications
├── styles/
│   ├── content.css        # Content script styles
│   └── popup.css          # Popup styles
├── icons/                 # Extension icons
├── manifest.json          # Extension manifest
├── popup.html            # Popup HTML
└── webpack.config.js     # Build configuration
```

## 🔒 Privacy & Security

- **100% Local Processing**: All file analysis happens in your browser
- **No Data Transmission**: No files or content are sent to external servers
- **No Storage**: File contents are not stored or cached
- **Open Source**: Full source code available for audit

## 📊 Supported File Types

| Format | Extension | Status |
|--------|-----------|--------|
| Plain Text | `.txt` | ✅ Full support |
| Word Document | `.docx` | ✅ Full support |
| PDF Document | `.pdf` | ✅ Basic support* |

*PDF support uses basic text extraction. Complex PDFs with images or unusual formatting may not be fully processed.

## 🎯 Detection Capabilities

The extension can detect various types of malicious content:

### Prompt Injection Attacks
- Direct instruction overrides
- Context manipulation
- Role confusion attacks

### Jailbreak Attempts  
- DAN (Do Anything Now) prompts
- Roleplay-based bypasses
- Character impersonation

### Social Engineering
- Information extraction attempts
- Manipulation techniques
- Trust exploitation

### Data Extraction
- Attempts to access training data
- System information queries
- Credential harvesting

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Limitations

- Requires WebGPU support for optimal AI performance
- Initial model loading may take 30-60 seconds
- Large files (>10MB) may take longer to process
- PDF text extraction is basic and may miss complex layouts
- Only works on ChatGPT websites (chat.openai.com, chatgpt.com)

## 🐛 Known Issues

- First-time use requires downloading the AI model (~1-2GB)
- Some PDFs with complex formatting may not extract text properly
- WebLLM initialization can be slow on older hardware

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/chatgpt-doc-scanner/issues) page
2. Create a new issue with detailed information
3. Include browser version, OS, and steps to reproduce

## 🙏 Acknowledgments

- [WebLLM](https://github.com/mlc-ai/web-llm) for in-browser AI capabilities
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) for DOCX parsing
- The open-source community for various utilities and inspirations

---

**⚡ Stay safe online! Always be cautious when uploading sensitive documents to AI services.**