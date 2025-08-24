import { FileParser } from './fileParser';
import { ThreatDetector } from './threatDetector';
import { UIComponents } from './uiComponents';

interface ScanStats {
  totalScans: number;
  threatsDetected: number;
}

class ChatGPTDocumentScanner {
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

  constructor() {
    this.init();
  }

  private init(): void {
    console.log('🛡️ Upload Guard: Extension loaded');
    
    // Initialize file parser registry FIRST (before upload monitoring)
    // This ensures file type detection works even before LLM is ready
    FileParser.initialize();
    
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
      
      console.log('✅ Upload Guard: Ready');
    } catch (error) {
      console.error('❌ Upload Guard: Failed to initialize:', error);
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
    
    // Monitor drag and drop events
    this.attachDragDropListeners();
    
    // Monitor DOM changes for new file inputs
    this.observeDOMChanges();
  }

  private attachFileListeners(): void {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      this.attachListenerToInput(input as HTMLInputElement);
    });
  }

  private removeDragOverlay(): void {
    // Remove ChatGPT's drag overlay element
    // Based on the HTML structure provided, it's a div with specific classes
    const dragOverlays = document.querySelectorAll('div.absolute.z-50.inset-0.flex.gap-2.flex-col.justify-center.items-center');
    dragOverlays.forEach(overlay => {
      // Check if it contains the "Add anything" text to make sure it's the right overlay
      if (overlay.textContent?.includes('Add anything') || overlay.textContent?.includes('Drop any file here')) {
        overlay.remove();
      }
    });
    
    // Also try to find overlays by checking for the SVG content (without using :has)
    const allDivs = document.querySelectorAll('div.absolute.z-50');
    allDivs.forEach(div => {
      const svg = div.querySelector('svg[viewBox="0 0 132 108"]');
      if (svg) {
        div.remove();
      }
    });
    
    // Dispatch dragleave event to ensure ChatGPT cleans up any internal state
    document.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
    document.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
  }

  private attachDragDropListeners(): void {
    // Store original drop handler reference
    let processingDrop = false;
    
    // Intercept drop events at the capture phase (before ChatGPT can process them)
    document.addEventListener('drop', async (event) => {
      // Check if we're already processing a drop to avoid recursion
      if (processingDrop) {
        return;
      }
      
      const files = event.dataTransfer?.files;
      
      if (files && files.length > 0 && this.isLLMReady) {
        // Check if any file is supported
        const supportedFiles = Array.from(files).filter(file => 
          this.isSupportedFileType(file)
        );
        
        if (supportedFiles.length > 0) {          
          // Prevent default drop behavior and stop propagation
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          
          processingDrop = true;
          
          try {
            // Scan files and get user decision
            const shouldAllowUpload = await this.scanFilesInBackground(supportedFiles);
            
            if (shouldAllowUpload) {              
              // Find the file input element
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              
              if (fileInput && event.dataTransfer) {
                // Create a new FileList from the dropped files
                const dt = new DataTransfer();
                Array.from(files).forEach(file => dt.items.add(file));
                
                // Set the files on the input
                fileInput.files = dt.files;
                
                // Mark to skip scanning since we already scanned
                fileInput.dataset.docScannerSkipNext = 'true';
                
                // Trigger change event to notify ChatGPT
                const changeEvent = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(changeEvent);
                
                // Clean up skip flag after processing
                setTimeout(() => {
                  delete fileInput.dataset.docScannerSkipNext;
                }, 100);
              }
              
              processingDrop = false;
              this.removeDragOverlay();
            } else {
              // Drop blocked
              processingDrop = false;
              this.removeDragOverlay();
            }
          } catch (error) {
            processingDrop = false;
            this.removeDragOverlay();
            console.error('Error processing dropped files:', error);
          }
        }
      }
    }, true); // Use capture phase to intercept early
    
    // Also handle dragover to ensure drop events work properly
    document.addEventListener('dragover', (event) => {
      event.preventDefault();
    }, true);
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
          // Stop the event from reaching ChatGPT immediately
          event.stopImmediatePropagation();
          event.preventDefault();
          
          // Scan files and get user decision
          const shouldAllowUpload = await this.scanFilesInBackground(supportedFiles, input);
          
          if (shouldAllowUpload) {
            // Allow upload - restore files and trigger event
            this.allowFileUpload(input, files);
          } else {
            // Block upload - clear input
            input.value = '';
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
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    const fileTypeWithDot = '.' + fileType; // Add dot to match registry format
    const isSupported = FileParser.isSupported(fileTypeWithDot);
    return isSupported;
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
    try {
      
      // Show loading notification
      UIComponents.showLoadingSpinner(file.name);
      
      // Parse the file
      const parsedFile = await FileParser.parseFile(file);      

      // Analyze for threats
      const analysis = await ThreatDetector.analyzeContent(parsedFile.content);
      
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
          return true;
        } else {
          return false;
        }
      } else {
        // Show safe notification
        UIComponents.showSafeNotification(file.name);
        return true;
      }
      
    } catch (error) {
      // Hide loading spinner
      UIComponents.hideLoadingSpinner();
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error scanning "${file.name}":`, error);
      
      // Show error popup and wait for user decision
      const shouldProceed = await UIComponents.showErrorPopup(file.name, errorMessage);
      
      if (shouldProceed) {
        return true;
      } else {
        return false;
      }
    }
  }
}

// Initialize the scanner
new ChatGPTDocumentScanner();