# ChatGPT Upload Guard - Technical Documentation

## Overview

Browser extension that intercepts file uploads to ChatGPT and analyzes them for prompt injection attacks using a local WebLLM model (Llama-3.2-3B) for private, offline threat detection.

## Architecture

### Core Components

1. **Content Script** (`content.ts`) - Monitors and intercepts file uploads
2. **Threat Detector** (`threatDetector.ts`) - WebLLM-powered threat analysis
3. **File Parser** (`fileParser.ts`) - Parses different file formats  
4. **UI Components** (`uiComponents.ts`) - User notifications and warnings
5. **Background Script** (`background.ts`) - Extension lifecycle management
6. **Popup** (`popup.ts`) - Stats and settings interface

### Key Features

- **Real-time Interception**: Catches uploads before reaching ChatGPT
- **Local AI Analysis**: Private, offline threat detection using WebLLM
- **Multi-file Support**: Sequential processing with individual analysis
- **User Control**: Override decisions with detailed explanations
- **Broad Format Support**: 25+ file types including documents, code, and config files

## Workflow

1. **Initialization**: WebLLM loads Llama-3.1-3B model (~2-4GB, 30-60s first run)
2. **File Upload**: Extension intercepts file selection events
3. **Parsing**: Extract text content from supported formats
4. **Analysis**: WebLLM analyzes content for threat patterns:
   - Prompt injection attempts ("IGNORE ALL PREVIOUS INSTRUCTIONS")
   - Role manipulation (DAN, "Do Anything Now")
   - Context switching ("you are now", "from now on")
   - Security bypass attempts
5. **User Decision**: Display results and allow proceed/block choice
6. **Action**: Process upload or block based on user decision

## Security Model

### Risk Assessment
- **Safe**: No threats detected
- **Medium**: Single threat pattern 
- **High**: Multiple threat patterns

### Privacy Protection
- All analysis happens locally via WebLLM
- No data sent to external servers
- User maintains full upload control

## Configuration

### Supported File Types
**Documents:** `.txt`, `.docx`  
**Programming:** `.ts`, `.js`, `.py`, `.java`, `.cpp`, `.c`, `.cs`, `.php`, `.rb`, `.go`, `.rs`, `.swift`, `.kt`, `.scala`, `.r`, `.sql`  
**Web:** `.html`, `.css`, `.scss`, `.vue`, `.jsx`, `.tsx`  
**Config:** `.yaml`, `.json`, `.xml`, `.env`, `.gitignore`, `Dockerfile`  
**Scripts:** `.sh`, `.ps1`, `.bat`  
**Documentation:** `.md`, `.markdown`  
**Data:** `.csv`

### Model Configuration
- **Model**: Llama-3.2-3B-Instruct
- **Quantization**: 4-bit for reduced memory usage
- **Temperature**: 0.1 for consistent results

## Performance & Error Handling

- **Processing**: 2-5 seconds per file analysis
- **Memory**: Scales with model size and sessions
- **Graceful Degradation**: Buttons disabled if initialization fails
- **User Override**: Always allows proceeding despite threats with detailed explanations
