import { FileParser } from './fileParser';
import { ThreatDetector } from './threatDetector';
import { UIComponents } from './uiComponents';

interface ScanStats {
  totalScans: number;
  threatsDetected: number;
}

class ChatGPTDocumentScanner {
  private isProcessing = false;
  private processedFiles = new Set<string>();
  private isLLMReady = false;
  private disabledButtons = new Set<HTMLElement>();

  constructor() {
    this.init();
  }

  private init(): void {
    console.log('ChatGPT Document Scanner: Extension initialized');
    
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
      console.log('ChatGPT Document Scanner: Initializing AI threat detection...');
      await ThreatDetector.initialize();
      
      this.isLLMReady = true;
      this.enableUploadButtons();
      console.log('ChatGPT Document Scanner: Threat detection ready');
    } catch (error) {
      console.error('ChatGPT Document Scanner: Failed to initialize threat detection:', error);
      // Keep buttons disabled if initialization fails
    }
  }

  private disableUploadButtons(): void {
    // Find ChatGPT upload/attach buttons
    const uploadSelectors = [
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

    uploadSelectors.forEach(selector => {
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
    // Monitor existing file inputs
    this.attachFileListeners();
    
    // Monitor drag and drop events
    this.monitorDragAndDrop();
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
    
    // Intercept BEFORE ChatGPT processes the file
    input.addEventListener('change', async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // Prevent the event from reaching ChatGPT immediately
        event.stopImmediatePropagation();
        event.preventDefault();
        
        const shouldAllowUpload = await this.handleFileSelection(files, input);
        
        if (!shouldAllowUpload) {
          // Block the upload completely
          input.value = '';
          console.log('ChatGPT Document Scanner: File upload blocked via input interception');
          return;
        }
        
        // If allowed, let the original event continue by not preventing it
        // We already stopped it, so we need to manually re-enable file selection
        const originalFiles = files;
        setTimeout(() => {
          // Re-trigger the change event with the original files
          Object.defineProperty(input, 'files', {
            value: originalFiles,
            writable: false
          });
          const newEvent = new Event('change', { bubbles: true });
          input.dispatchEvent(newEvent);
        }, 50);
      }
    }, true); // Use capture phase to intercept early
  }

  private monitorDragAndDrop(): void {
    // Monitor the entire document for drag and drop
    document.addEventListener('drop', async (event) => {
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        // Find the closest file input or upload area
        const uploadArea = this.findUploadArea(event.target as Element);
        if (uploadArea) {
          // Prevent the drop from reaching ChatGPT
          event.stopImmediatePropagation();
          event.preventDefault();
          
          const shouldAllowUpload = await this.handleFileSelection(files);
          
          if (shouldAllowUpload) {
            // If allowed, manually re-trigger the drop
            const newEvent = new DragEvent('drop', {
              bubbles: true,
              dataTransfer: event.dataTransfer
            });
            setTimeout(() => {
              (event.target as Element).dispatchEvent(newEvent);
            }, 100);
          }
        }
      }
    }, true); // Use capture phase
  }

  private findUploadArea(element: Element): Element | null {
    // Look for ChatGPT's upload areas
    const uploadSelectors = [
      '[data-testid*="upload"]',
      '[class*="upload"]',
      '[class*="file"]',
      'input[type="file"]'
    ];

    let current = element;
    let depth = 0;
    const maxDepth = 10;

    while (current && depth < maxDepth) {
      for (const selector of uploadSelectors) {
        if (current.matches?.(selector) || current.querySelector?.(selector)) {
          return current;
        }
      }
      current = current.parentElement as Element;
      depth++;
    }

    return null;
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
    const uploadSelectors = [
      // ChatGPT's actual plus button (composer button)
      'button[data-testid="composer-plus-btn"]',
      'button.composer-btn',
      'button[data-testid*="composer-plus"]',
      // Other patterns
      'button[data-testid*="attach"]',
      'button[aria-label*="attach"]', 
      'button[aria-label*="Attach"]',
      'button:has(svg[data-testid*="paperclip"])',
      '[data-testid*="paperclip"]',
      'button[data-testid*="upload"]',
      'button[aria-label*="upload"]',
      'button[aria-label*="Upload"]',
      'button:has(svg[viewBox="0 0 20 20"]):has(path[d*="M9.33496 16.5V10.665"])',
    ];

    uploadSelectors.forEach(selector => {
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

  private async handleFileSelection(files: FileList, input?: HTMLInputElement): Promise<boolean> {
    if (this.isProcessing) {
      return true; // Allow if already processing
    }

    // Process each file and check if ALL should be allowed
    let allFilesAllowed = true;
    
    for (const file of Array.from(files)) {
      const fileAllowed = await this.processFile(file, input);
      if (!fileAllowed) {
        allFilesAllowed = false;
        break; // Stop processing if any file is blocked
      }
    }
    
    return allFilesAllowed;
  }

  private async processFile(file: File, input?: HTMLInputElement): Promise<boolean> {
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    
    if (this.processedFiles.has(fileKey)) {
      return true; // Already processed this exact file - allow it
    }

    // Check if file type is supported
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['txt', 'docx', 'pdf'].includes(fileType || '')) {
      return true; // Not a supported file type - allow it (not our concern)
    }

    this.isProcessing = true;
    this.processedFiles.add(fileKey);

    try {
      // Show loading spinner
      UIComponents.showLoadingSpinner(file.name);

      // Parse file content
      const parsedFile = await FileParser.parseFile(file);

      // Analyze for threats
      const analysis = await ThreatDetector.analyzeContent(parsedFile.content, parsedFile.fileName);

      // Update scan count
      await this.incrementScanCount();

      // Hide loading spinner
      UIComponents.hideLoadingSpinner();

      if (analysis.isThreats) {
        // Update threat count
        await this.incrementThreatCount();

        // Show threat popup and wait for user decision
        const shouldProceed = await UIComponents.showThreatPopup(file.name, analysis);
        
        if (!shouldProceed) {
          console.log(`ChatGPT Document Scanner: Blocked malicious file upload: ${file.name}`);
          this.isProcessing = false;
          return false; // Block the upload
        }
        
        console.log(`ChatGPT Document Scanner: User allowed flagged file: ${file.name}`);
        
        // User chose to proceed
        this.isProcessing = false;
        return true; // Allow the upload
      } else {
        // Show safe notification
        UIComponents.showSafeNotification(file.name);
        this.isProcessing = false;
        return true; // Safe file - allow upload
      }

    } catch (error) {
      UIComponents.hideLoadingSpinner();
      console.error('Error processing file:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      UIComponents.showErrorNotification(`Failed to scan "${file.name}": ${errorMessage}`);
      
      this.isProcessing = false;
      return true; // Allow upload if scanning fails (don't break user workflow)
    }
  }
}

// Initialize the scanner when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ChatGPTDocumentScanner();
  });
} else {
  new ChatGPTDocumentScanner();
}