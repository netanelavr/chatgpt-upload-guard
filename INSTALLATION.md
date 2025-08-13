# Installation Guide - ChatGPT Document Scanner

This guide will walk you through installing and setting up the ChatGPT Document Scanner Chrome extension.

## Prerequisites

- Google Chrome browser (version 88 or higher)
- Basic understanding of Chrome extensions
- Access to ChatGPT (chat.openai.com or chatgpt.com)

## Step 1: Prepare the Extension Files

### Option A: Download from Release
1. Download the latest release from the repository
2. Extract the ZIP file to a folder on your computer

### Option B: Clone from Source
```bash
git clone <repository-url>
cd chatgpt-doc-scanner
```

## Step 2: Load the Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click the "Load unpacked" button
5. Select the folder containing the extension files
6. The extension should now appear in your extensions list

## Step 3: Verify Installation

1. You should see the extension icon (🛡️) in your Chrome toolbar
2. Click the icon to open the popup interface
3. Navigate to ChatGPT (chat.openai.com or chatgpt.com)
4. You should see a notification: "ChatGPT Document Scanner is active"

## Step 4: Test the Extension

Use the provided test files to verify the extension is working:

1. Go to ChatGPT
2. Try to upload `test-files/high-risk-document.txt`
3. You should see a warning notification about detected threats
4. Click the extension icon to view detailed results

### Expected Behavior for Test Files:

- **high-risk-document.txt**: Should trigger HIGH RISK warnings
- **medium-risk-document.txt**: Should show MEDIUM RISK alerts
- **low-risk-document.txt**: Should indicate LOW RISK concerns
- **clean-document.txt**: Should show as CLEAN/safe

## Step 5: Configure Settings

1. Click the extension icon
2. Go to the "Settings" tab
3. Adjust preferences as needed:
   - **Notifications**: Enable/disable popup notifications
   - **Auto-scan**: Toggle automatic scanning
   - **Risk Sensitivity**: Adjust detection sensitivity
   - **File Size Limit**: Set maximum file size to scan

## Troubleshooting

### Extension Not Loading
- Ensure all files are in the correct directory
- Check that `manifest.json` is in the root folder
- Verify Chrome is in Developer mode
- Try reloading the extension

### Icons Not Displaying
- Make sure all 4 icon files are in the `icons/` folder (they should already be included)
- Verify icon files are named correctly (icon16.png, icon32.png, icon48.png, icon128.png)
- Check file permissions
- Reload the extension if needed

### No Notifications on ChatGPT
- Verify you're on a supported URL (chat.openai.com or chatgpt.com)
- Check that notifications are enabled in settings
- Open browser DevTools (F12) and check for console errors
- Try refreshing the ChatGPT page

### Scanning Not Working
- Ensure the extension has proper permissions
- Check that auto-scan is enabled in settings
- Verify file size is under the configured limit
- Test with the provided test files first

### Console Errors
Open Chrome DevTools (F12) and check for errors in:
- **Console tab**: General JavaScript errors
- **Network tab**: Permission or loading issues
- **Extensions panel**: Extension-specific errors

## Permissions Explained

The extension requests these permissions:

- **activeTab**: To monitor file uploads on ChatGPT
- **storage**: To save settings and scan history
- **notifications**: To show scan result notifications
- **host_permissions for ChatGPT**: To run on ChatGPT websites

## Uninstalling

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "ChatGPT Document Scanner"
3. Click "Remove"
4. Confirm removal

All scan history and settings will be deleted.

## Updates

To update the extension:

1. Download the new version
2. Replace the old files
3. Go to `chrome://extensions/`
4. Click the refresh icon next to the extension
5. The extension will reload with the new version

## Security Notes

- All scanning is performed locally in your browser
- No document content is transmitted to external servers
- The extension only monitors ChatGPT websites
- You can review all source code for transparency

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Test with the provided test files
3. Review console logs for error messages
4. Verify all files are correctly installed
5. Check Chrome version compatibility

For additional support, refer to the main README.md file or submit an issue to the project repository.