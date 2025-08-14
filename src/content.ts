import { FileParser } from './fileParser';
import { ThreatDetector } from './threatDetector';
import { UIComponents } from './uiComponents';

interface ScanStats {
  totalScans: number;
  threatsDetected: number;
}

class ChatGPTDocumentScanner {
  private isProcessing = false;
  private isLLMReady = false;
  private disabledButtons = new Set<HTMLElement>();

  // Common selectors for upload buttons
  private static readonly UPLOAD_SELECTORS = [
    // File input elements
    'input[type="file"]',
    // ChatGPT's actual plus button (composer button)
    'button[data-testid="composer-plus-btn"]',
    'button.composer-btn',
    'button[data-testid*="composer-plus"]',
    // Other attach/upload buttons (fallback patterns)
    'button[data-testid*="attach"]',
    'button[aria-label*="attach"]',
    'button[aria-label*="Attach"]',
    'button:has(svg[data-testid*="paperclip"])',
    '[data-testid*="paperclip"]',
    // Upload buttons
    'button[data-testid*="upload"]',
    'button[aria-label*="upload"]',
    'button[aria-label*="Upload"]',
    // Generic patterns that might be upload buttons
    'button:has(svg[viewBox="0 0 20 20"]):has(path[d*="M9.33496 16.5V10.665"])', // Specific plus icon pattern
  ];

  private static readonly SUPPORTED_FILE_TYPES = ['txt', 'docx'];

  constructor() {
    this.init();
  }

  private init(): void {
    console.log('🛡️ Document Scanner: Extension loaded');
    
    // Disable upload buttons initially
    this.disableUploadButtons();
    
    // Try again after ChatGPT loads (buttons might not exist yet)
    setTimeout(() => {
      this.disableUploadButtons();
    }, 2000);
    
    // Initialize threat detection engine in background
    this.initializeThreatDetector();
    
    // Monitor file uploads
    this.monitorFileUploads();
    
    // Monitor DOM changes for dynamic file inputs
    this.observeDOMChanges();
  }

  private async initializeThreatDetector(): Promise<void> {
    try {
      await ThreatDetector.initialize();
      this.isLLMReady = true;
      this.enableUploadButtons();
      
      // Show active extension notification
      UIComponents.showExtensionActiveNotification();
      
      console.log('✅ Document Scanner: Ready');
    } catch (error) {
      console.error('❌ Document Scanner: Failed to initialize:', error);
      // Keep buttons disabled if initialization fails
    }
  }

  private disableUploadButtons(): void {
    ChatGPTDocumentScanner.UPLOAD_SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const htmlElement = element as HTMLElement;
          if (!this.disabledButtons.has(htmlElement)) {
            this.disableElement(htmlElement);
          }
        });
      } catch (error) {
        // Ignore selector errors
      }
    });
  }

  private enableUploadButtons(): void {
    this.disabledButtons.forEach(element => {
      this.enableElement(element);
    });
    this.disabledButtons.clear();
  }

  private disableElement(element: HTMLElement): void {
    // Store original state
    element.dataset.docScannerOriginalDisabled = element.getAttribute('disabled') || 'false';
    element.dataset.docScannerOriginalTitle = element.getAttribute('title') || '';
    element.dataset.docScannerOriginalPointerEvents = element.style.pointerEvents || '';
    element.dataset.docScannerOriginalOpacity = element.style.opacity || '';
    
    // Disable the element
    if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
      (element as HTMLInputElement | HTMLButtonElement).disabled = true;
    }
    
    // Add visual indicator and tooltip
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
    element.style.cursor = 'not-allowed';
    element.title = 'AI threat detection loading... Please wait.';
    
    this.disabledButtons.add(element);
  }

  private enableElement(element: HTMLElement): void {
    // Restore original state
    const originalDisabled = element.dataset.docScannerOriginalDisabled;
    const originalTitle = element.dataset.docScannerOriginalTitle;
    const originalPointerEvents = element.dataset.docScannerOriginalPointerEvents;
    const originalOpacity = element.dataset.docScannerOriginalOpacity;
    
    if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
      (element as HTMLInputElement | HTMLButtonElement).disabled = originalDisabled === 'true';
    }
    
    // Remove our modifications
    element.style.opacity = originalOpacity || '';
    element.style.pointerEvents = originalPointerEvents || '';
    element.style.cursor = '';
    element.title = originalTitle || '';
    
    // Clean up data attributes
    delete element.dataset.docScannerOriginalDisabled;
    delete element.dataset.docScannerOriginalTitle;
    delete element.dataset.docScannerOriginalPointerEvents;
    delete element.dataset.docScannerOriginalOpacity;
  }

  private async getStats(): Promise<ScanStats> {
    try {
      const result = await chrome.storage.local.get(['scanStats']);
      return result.scanStats || {
        totalScans: 0,
        threatsDetected: 0
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalScans: 0,
        threatsDetected: 0
      };
    }
  }

  private async updateStats(updates: Partial<ScanStats>): Promise<void> {
    try {
      const currentStats = await this.getStats();
      const newStats = {
        ...currentStats,
        ...updates
      };
      await chrome.storage.local.set({ scanStats: newStats });
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  private async incrementScanCount(): Promise<void> {
    const stats = await this.getStats();
    await this.updateStats({
      totalScans: stats.totalScans + 1
    });
  }

  private async incrementThreatCount(): Promise<void> {
    const stats = await this.getStats();
    await this.updateStats({
      threatsDetected: stats.threatsDetected + 1
    });
  }

  private monitorFileUploads(): void {
    // Monitor file input changes
    this.attachFileListeners();
    
    // Monitor DOM changes for new file inputs
    this.observeDOMChanges();
  }

  private attachFileListeners(): void {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      this.attachListenerToInput(input as HTMLInputElement);
    });
  }

  private attachListenerToInput(input: HTMLInputElement): void {
    if (input.dataset.docScannerAttached) {
      return; // Already attached
    }

    input.dataset.docScannerAttached = 'true';
    
    // Intercept file uploads BEFORE ChatGPT processes them
    input.addEventListener('change', async (event) => {
      const inputElement = event.target as HTMLInputElement;
      const files = inputElement.files;
      
      // Skip scanning if this is a re-triggered event after user approval
      if (inputElement.dataset.docScannerSkipNext === 'true') {
        return; // Let the event continue normally to ChatGPT
      }
      
      if (files && files.length > 0 && this.isLLMReady) {
        // Check if any file is supported
        const supportedFiles = Array.from(files).filter(file => 
          this.isSupportedFileType(file)
        );
        
        if (supportedFiles.length > 0) {
          console.log(`🔍 Scanning ${supportedFiles.length} file(s)...`);
          
          // Stop the event from reaching ChatGPT immediately
          event.stopImmediatePropagation();
          event.preventDefault();
          
          // Scan files and get user decision
          const shouldAllowUpload = await this.scanFilesInBackground(supportedFiles, input);
          
          if (shouldAllowUpload) {
            // Allow upload - restore files and trigger event
            console.log('✅ Upload allowed - processing files');
            this.allowFileUpload(input, files);
          } else {
            // Block upload - clear input
            input.value = '';
            console.log('🚫 File input cleared - upload blocked');
          }
        }
      }
    }, true); // Use capture phase to intercept early
  }

  private allowFileUpload(input: HTMLInputElement, files: FileList): void {
    // Temporarily mark input to skip our scanning
    input.dataset.docScannerSkipNext = 'true';
    
    // Ensure files are still in the input (they should be since we intercepted before clearing)
    if (input.files && input.files.length > 0) {
      // Create a new change event and dispatch it
      const newEvent = new Event('change', { bubbles: true });
      
      // Trigger after a small delay to ensure our event listener can check the flag
      setTimeout(() => {
        input.dispatchEvent(newEvent);
        // Clean up the skip flag after a brief moment
        setTimeout(() => {
          delete input.dataset.docScannerSkipNext;
        }, 100);
      }, 50);
    } else {
      // Files were somehow lost, clean up flag
      delete input.dataset.docScannerSkipNext;
      console.warn('Files lost during processing, cannot proceed with upload');
    }
  }

  private observeDOMChanges(): void {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check for new file inputs
              const fileInputs = element.querySelectorAll('input[type="file"]');
              fileInputs.forEach(input => {
                this.attachListenerToInput(input as HTMLInputElement);
                // Disable new file inputs if LLM isn't ready
                if (!this.isLLMReady) {
                  this.disableElement(input as HTMLElement);
                }
              });

              // Check if the added node itself is a file input
              if (element.matches?.('input[type="file"]')) {
                this.attachListenerToInput(element as HTMLInputElement);
                if (!this.isLLMReady) {
                  this.disableElement(element as HTMLElement);
                }
              }

              // Check for new upload buttons
              if (!this.isLLMReady) {
                this.checkAndDisableNewUploadElements(element);
              }
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private checkAndDisableNewUploadElements(element: Element): void {
    ChatGPTDocumentScanner.UPLOAD_SELECTORS.forEach(selector => {
      try {
        // Check the element itself
        if (element.matches?.(selector)) {
          const htmlElement = element as HTMLElement;
          if (!this.disabledButtons.has(htmlElement)) {
            this.disableElement(htmlElement);
          }
        }
        
        // Check children of the element
        const childElements = element.querySelectorAll(selector);
        childElements.forEach(child => {
          const htmlChild = child as HTMLElement;
          if (!this.disabledButtons.has(htmlChild)) {
            this.disableElement(htmlChild);
          }
        });
      } catch (error) {
        // Ignore selector errors
      }
    });
  }

  private isSupportedFileType(file: File): boolean {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    return ChatGPTDocumentScanner.SUPPORTED_FILE_TYPES.includes(fileType || '');
  }

  private async scanFilesInBackground(files: File[], input?: HTMLInputElement): Promise<boolean> {
    // Process files one by one - always scan each file
    for (const file of files) {
      const shouldAllowFile = await this.processFile(file);
      
      // If any file is blocked, block the entire upload
      if (!shouldAllowFile) {
        return false;
      }
    }
    
    return true; // All files were allowed
  }

  private async processFile(file: File): Promise<boolean> {
    // Prevent multiple simultaneous scans but allow re-scanning the same file
    if (this.isProcessing) {
      console.log(`⏳ Scanning already in progress, skipping: "${file.name}"`);
      return true; // Allow by default if scan in progress
    }
    
    try {
      this.isProcessing = true;
      
      // Show loading notification
      UIComponents.showLoadingSpinner(file.name);
      
      // Parse the file
      console.log(`📄 Parsing file: "${file.name}"`);
      const parsedFile = await FileParser.parseFile(file);      
      // Analyze for threats
      console.log(`🔍 Analyzing content for threats...`);
      const analysis = await ThreatDetector.analyzeContent(parsedFile.content, parsedFile.fileName);
      console.log(`🔍 Analysis complete:`, analysis);
      
      // Update scan count
      await this.incrementScanCount();
      
      // Hide loading spinner
      UIComponents.hideLoadingSpinner();
      
      if (analysis.isThreats) {
        // Update threat count
        await this.incrementThreatCount();
        
        // Show threat popup and wait for user decision
        const shouldProceed = await UIComponents.showThreatPopup(file.name, analysis);
        
        if (shouldProceed) {
          console.log(`⚠️ Scanning complete: "${file.name}" - Threats detected (${analysis.riskLevel} risk) - User chose to proceed`);
          return true;
        } else {
          console.log(`🚫 Scanning complete: "${file.name}" - Threats detected (${analysis.riskLevel} risk) - Upload blocked by user`);
          return false;
        }
      } else {
        // Show safe notification
        UIComponents.showSafeNotification(file.name);
        console.log(`✅ Scanning complete: "${file.name}" - Document is safe`);
        return true;
      }
      
    } catch (error) {
      // Hide loading spinner
      UIComponents.hideLoadingSpinner();
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error scanning "${file.name}":`, error);
      console.error(`❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      
      // Show error popup and wait for user decision
      const shouldProceed = await UIComponents.showErrorPopup(file.name, errorMessage);
      
      if (shouldProceed) {
        console.log(`❌ Scanning complete: "${file.name}" - Failed with error: ${errorMessage} - User chose to proceed`);
        return true;
      } else {
        console.log(`🚫 Scanning complete: "${file.name}" - Failed with error: ${errorMessage} - Upload blocked by user`);
        return false;
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

// Initialize the scanner
new ChatGPTDocumentScanner();