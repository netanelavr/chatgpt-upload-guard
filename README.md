# ChatGPT Upload Guard

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/omobclfhffgghcjekloejjpmjegdlode)](https://chromewebstore.google.com/detail/chatgpt-upload-guard/omobclfhffgghcjekloejjpmjegdlode)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A Chrome extension that detects prompt injection attacks in documents uploaded to ChatGPT using local AI analysis.

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/chatgpt-upload-guard/omobclfhffgghcjekloejjpmjegdlode)**

## Demo

https://github.com/user-attachments/assets/dcf03b0d-c0f6-4e65-9db5-44bef2a82c94

## Features

- **Real-time Scanning** - Automatically scans document uploads to ChatGPT
- **Local AI Analysis** - Private, in-browser threat detection using WebLLM
- **Smart Detection** - Identifies prompt injections, jailbreaks, social engineering, and data extraction attempts
- **Privacy-focused** - All processing happens locally in your browser

## Installation

### From Chrome Web Store (Recommended)

**[Install ChatGPT Upload Guard](https://chromewebstore.google.com/detail/chatgpt-upload-guard/omobclfhffgghcjekloejjpmjegdlode)**

### From Source

1. Clone and build:
   ```bash
   git clone https://github.com/netanelavr/chatgpt-upload-guard.git
   cd chatgpt-upload-guard
   npm install
   npm run build
   ```

2. Load in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" 
   - Click "Load unpacked" and select the project folder

## Usage

1. Navigate to [ChatGPT](https://chat.openai.com)
2. Upload a document (`.txt`, `.docx`, `.md`, etc.)
3. The extension automatically scans for threats
4. Review results and choose to block or proceed with upload

## Supported Files

- **Documents**: `.txt`, `.docx`, `.pdf`, `.md`, `.csv`
- **Code**: `.js`, `.ts`, `.py`, `.java`, `.cpp`, `.html`, `.css`, and 30+ more
- **Config**: `.json`, `.yaml`, `.xml`, `.env`

## Privacy & Security

- **100% Local**: All analysis happens in your browser
- **No Data Sent**: Files never leave your device
- **Open Source**: Full code available for audit

## Development

```bash
npm install      # Install dependencies
npm run dev      # Development build with watch
npm run build    # Production build
```

## Limitations

- Requires WebGPU support
- Initial model download (~1-2GB) on first use
- Only works on ChatGPT websites

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Stay safe online! Always be cautious when uploading sensitive documents to AI services.**
