import { FileParser } from './fileParser';
import { ThreatDetector } from './threatDetector';
import { UIComponents } from './uiComponents';

class ChatGPTDocumentScanner {
  private isProcessing = false;
  private processedFiles = new Set<string>();

  constructor() {
    this.init();
  }

  private init(): void {
    console.log('ChatGPT Document Scanner initialized');
    
    // Initialize threat detection engine in background
    this.initializeThreatDetector();
    
    // Monitor file uploads
    this.monitorFileUploads();
    
    // Monitor DOM changes for dynamic file inputs
    this.observeDOMChanges();
  }

  private async initializeThreatDetector(): Promise<void> {
    try {
      console.log('Pre-initializing threat detection engine...');
      await ThreatDetector.initialize();
      console.log('Threat detection engine ready');
    } catch (error) {
      console.error('Failed to initialize threat detection:', error);
    }
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
    
    input.addEventListener('change', async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files) {
        await this.handleFileSelection(files, input);
      }
    });
  }

  private monitorDragAndDrop(): void {
    // Monitor the entire document for drag and drop
    document.addEventListener('drop', async (event) => {
      const files = event.dataTransfer?.files;
      if (files) {
        // Find the closest file input or upload area
        const uploadArea = this.findUploadArea(event.target as Element);
        if (uploadArea) {
          await this.handleFileSelection(files);
        }
      }
    });
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
              });

              // Check if the added node itself is a file input
              if (element.matches?.('input[type="file"]')) {
                this.attachListenerToInput(element as HTMLInputElement);
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

  private async handleFileSelection(files: FileList, input?: HTMLInputElement): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    for (const file of Array.from(files)) {
      await this.processFile(file, input);
    }
  }

  private async processFile(file: File, input?: HTMLInputElement): Promise<void> {
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
    
    if (this.processedFiles.has(fileKey)) {
      return; // Already processed this exact file
    }

    // Check if file type is supported
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!['txt', 'docx', 'pdf'].includes(fileType || '')) {
      return; // Not a supported file type
    }

    this.isProcessing = true;
    this.processedFiles.add(fileKey);

    try {
      // Show loading spinner
      UIComponents.showLoadingSpinner(file.name);

      // Parse file content
      console.log(`Parsing file: ${file.name}`);
      const parsedFile = await FileParser.parseFile(file);

      // Analyze for threats
      console.log(`Analyzing file for threats: ${file.name}`);
      const analysis = await ThreatDetector.analyzeContent(parsedFile.content, parsedFile.fileName);

      // Hide loading spinner
      UIComponents.hideLoadingSpinner();

      if (analysis.isThreats) {
        // Show threat popup and wait for user decision
        const shouldProceed = await UIComponents.showThreatPopup(file.name, analysis);
        
        if (!shouldProceed) {
          // Block the upload by clearing the input
          if (input) {
            input.value = '';
            
            // Dispatch change event to notify the page
            const changeEvent = new Event('change', { bubbles: true });
            input.dispatchEvent(changeEvent);
          }
          
          console.log(`Blocked upload of potentially malicious file: ${file.name}`);
        } else {
          console.log(`User chose to proceed with flagged file: ${file.name}`);
        }
      } else {
        // Show safe notification
        UIComponents.showSafeNotification(file.name);
        console.log(`File passed security scan: ${file.name}`);
      }

    } catch (error) {
      UIComponents.hideLoadingSpinner();
      console.error('Error processing file:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      UIComponents.showErrorNotification(`Failed to scan "${file.name}": ${errorMessage}`);
    } finally {
      this.isProcessing = false;
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