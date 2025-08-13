#!/bin/bash

# ChatGPT Document Scanner - Installation Script
# This script builds and prepares the Chrome extension for installation

set -e

echo "🛡️  ChatGPT Document Scanner - Installation"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building extension..."
npm run build

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select this project folder: $(pwd)"
echo ""
echo "🎉 The extension will be installed and ready to use!"
echo "   Navigate to ChatGPT (chat.openai.com) to start scanning uploads."
echo ""
echo "⚠️  Note: First use will download the AI model (~1-2GB)"
echo "   This may take a few minutes depending on your internet speed."