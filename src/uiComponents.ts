import { ThreatAnalysis, sanitizeHTML, sanitizeArray } from './threatDetector';

export class UIComponents {
  private static loadingOverlay: HTMLElement | null = null;
  private static threatModal: HTMLElement | null = null;
  private static errorModal: HTMLElement | null = null;

  static showLoadingSpinner(fileName: string): void {
    this.hideLoadingSpinner(); // Remove any existing spinner
    
    const overlay = document.createElement('div');
    overlay.id = 'doc-scanner-loading';
    
    // Create elements instead of using innerHTML
    const backdrop = document.createElement('div');
    backdrop.className = 'doc-scanner-loading-backdrop';
    
    const content = document.createElement('div');
    content.className = 'doc-scanner-loading-content';
    
    const spinner = document.createElement('div');
    spinner.className = 'doc-scanner-spinner';
    
    const title = document.createElement('h3');
    title.textContent = 'Scanning Document';
    
    const message = document.createElement('p');
    message.textContent = 'Analyzing document for security threats...';
    
    const small = document.createElement('small');
    small.textContent = 'This may take a few moments';
    
    // Append elements
    content.appendChild(spinner);
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(small);
    backdrop.appendChild(content);
    overlay.appendChild(backdrop);

    document.body.appendChild(overlay);
    this.loadingOverlay = overlay;
  }

  static hideLoadingSpinner(): void {
    if (this.loadingOverlay) {
      this.loadingOverlay.remove();
      this.loadingOverlay = null;
    }
  }

  static showSafeNotification(fileName: string): void {
    this.createNotification(
      'doc-scanner-safe-notification',
      'safe',
      'Document Safe',
      'Document passed security scan',
      this.getCheckIcon(),
      5000
    );
  }

  private static llmProgressNotification: HTMLElement | null = null;

  static showLLMInitializationNotification(): void {
    // Remove existing notification if any
    if (this.llmProgressNotification) {
      this.llmProgressNotification.remove();
    }

    const loadingIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="#3b82f6" stroke-width="2" fill="none" stroke-dasharray="50.265" stroke-dashoffset="50.265">
        <animateTransform attributeName="transform" type="rotate" values="0 10 10;360 10 10" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>`;

    // Create the notification
    const notification = document.createElement('div');
    notification.id = 'llm-progress-notification';
    this.llmProgressNotification = notification;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 300px;
      opacity: 0;
      transform: translateX(20px);
      transition: all 0.3s ease;
    `;

    notification.innerHTML = `
      ${loadingIcon}
      <div>
        <div>Initializing Upload Guard LLM...</div>
        <div id="llm-progress-text" style="font-size: 12px; opacity: 0.8; margin-top: 2px;">Starting up...</div>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
  }

  static updateLLMProgress(message: string): void {
    if (this.llmProgressNotification) {
      const progressText = this.llmProgressNotification.querySelector('#llm-progress-text');
      if (progressText) {
        progressText.textContent = message;
      }
    }
  }

  static hideLLMInitializationNotification(): void {
    if (this.llmProgressNotification) {
      this.llmProgressNotification.style.opacity = '0';
      this.llmProgressNotification.style.transform = 'translateX(20px)';
      setTimeout(() => {
        if (this.llmProgressNotification) {
          this.llmProgressNotification.remove();
          this.llmProgressNotification = null;
        }
      }, 300);
    }
  }

  static showExtensionActiveNotification(): void {
    const activeIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1Z" fill="#059669"/>
      <path d="M13.707 7.707L9 12.414L6.293 9.707L7.707 8.293L9 9.586L12.293 6.293L13.707 7.707Z" fill="white"/>
    </svg>`;

    // Create a special top-right notification
    const notification = document.createElement('div');
    notification.id = 'doc-scanner-active-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #059669, #047857);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 280px;
      opacity: 0;
      transform: translateX(20px);
      transition: all 0.3s ease;
    `;

    notification.innerHTML = `
      ${activeIcon}
                          <span>ChatGPT Upload Guard Active</span>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(20px)';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }, 4000);
  }

  static showErrorNotification(message: string): void {
    this.createNotification(
      'doc-scanner-error-notification',
      'error',
      'Scan Error',
      message,
      this.getErrorIcon(),
      7000
    );
  }

  static showErrorPopup(fileName: string, error: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.hideErrorPopup(); // Remove any existing popup
      
      // Create the modal using DOM APIs instead of innerHTML
      const modal = document.createElement('div');
      modal.id = 'doc-scanner-error-modal';
      
      // Create modal structure
      const modalBackdrop = document.createElement('div');
      modalBackdrop.className = 'doc-scanner-modal-backdrop';
      
      const content = document.createElement('div');
      content.className = 'doc-scanner-modal-content';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'doc-scanner-modal-header';
      
      // Create icon
      const iconContainer = document.createElement('div');
      iconContainer.className = 'doc-scanner-threat-icon';
      iconContainer.style.backgroundColor = '#dc2626';
      
      // Add SVG icon
      iconContainer.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      
      // Create header text
      const headerText = document.createElement('div');
      
      const headerTitle = document.createElement('h2');
      headerTitle.textContent = 'Scanning Error';
      
      const headerSubtitle = document.createElement('p');
      headerSubtitle.textContent = 'Unable to scan document';
      
      headerText.appendChild(headerTitle);
      headerText.appendChild(headerSubtitle);
      
      header.appendChild(iconContainer);
      header.appendChild(headerText);
      
      // Create body with warning
      const body = document.createElement('div');
      body.className = 'doc-scanner-modal-body';
      
      body.innerHTML = `
        <div class="doc-scanner-summary">
          <h3>Error Details</h3>
          <p>An error occurred while scanning the document.</p>
        </div>
        <div class="doc-scanner-warning">
          <strong>⚠️ Warning:</strong> Unable to scan this document for security threats. This could be due to:
          <ul>
            <li>Unsupported file format</li>
            <li>Corrupted file</li>
            <li>Network connection issues</li>
            <li>AI processing errors</li>
          </ul>
          <p>Proceed with caution when uploading unscanned files.</p>
        </div>
      `;
      
      // Create footer with buttons
      const footer = document.createElement('div');
      footer.className = 'doc-scanner-modal-footer';
      
      const errorBlockBtn = document.createElement('button');
      errorBlockBtn.id = 'doc-scanner-error-block';
      errorBlockBtn.className = 'doc-scanner-btn danger';
      errorBlockBtn.textContent = 'Block Upload';
      
      const errorProceedBtn = document.createElement('button');
      errorProceedBtn.id = 'doc-scanner-error-proceed';
      errorProceedBtn.className = 'doc-scanner-btn secondary';
      errorProceedBtn.textContent = 'Upload Anyway';
      
      footer.appendChild(errorBlockBtn);
      footer.appendChild(errorProceedBtn);
      
      // Assemble modal
      content.appendChild(header);
      content.appendChild(body);
      content.appendChild(footer);
      modalBackdrop.appendChild(content);
      modal.appendChild(modalBackdrop);
      
      document.body.appendChild(modal);
      this.errorModal = modal;

      // Add event listeners
      errorBlockBtn.addEventListener('click', () => {
        this.hideErrorPopup();
        resolve(false); // Block upload
      });

      errorProceedBtn.addEventListener('click', () => {
        this.hideErrorPopup();
        resolve(true); // Allow upload
      });

      // Close on backdrop click
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.hideErrorPopup();
          resolve(false); // Block by default
        }
      });
    });
  }

  static hideErrorPopup(): void {
    if (this.errorModal) {
      this.errorModal.remove();
      this.errorModal = null;
    }
  }

  private static createNotification(
    id: string,
    type: 'safe' | 'error' | 'warning',
    title: string,
    message: string,
    iconSvg: string,
    autoRemoveDelay: number
  ): void {
    const sanitizedTitle = sanitizeHTML(title);
    const sanitizedMessage = sanitizeHTML(message);
    
    const notification = document.createElement('div');
    notification.id = id;
    
    const notificationContainer = document.createElement('div');
    notificationContainer.className = `doc-scanner-notification ${type}`;
    
    // Create icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'doc-scanner-notification-icon';
    
    // Create SVG icon (using a safer approach)
    const iconWrapper = document.createElement('div');
    iconWrapper.innerHTML = iconSvg; // SVG is trusted content from our code, not user input
    while (iconWrapper.firstChild) {
      iconContainer.appendChild(iconWrapper.firstChild);
    }
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'doc-scanner-notification-content';
    
    // Create title element
    const titleElement = document.createElement('strong');
    titleElement.textContent = sanitizedTitle;
    
    // Create message element
    const messageElement = document.createElement('span');
    messageElement.textContent = sanitizedMessage;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'doc-scanner-notification-close';
    closeButton.textContent = '×';
    
    // Build the notification structure
    contentContainer.appendChild(titleElement);
    contentContainer.appendChild(messageElement);
    notificationContainer.appendChild(iconContainer);
    notificationContainer.appendChild(contentContainer);
    notificationContainer.appendChild(closeButton);
    notification.appendChild(notificationContainer);

    document.body.appendChild(notification);

    // Add close button event listener
    closeButton.addEventListener('click', () => {
      notification.remove();
    });

    // Auto-remove after specified delay
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, autoRemoveDelay);
  }

  private static getCheckIcon(): string {
    return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M16.67 6L8.33 14.33L3.33 9.33" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  private static getErrorIcon(): string {
    return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  static showThreatWarning(fileName: string, analysis: ThreatAnalysis): void {
    // Don't show warning for safe documents
    if (analysis.riskLevel === 'safe') {
      return;
    }

    const warningIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" 
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    // Minimize displayed information
    this.createNotification(
      'doc-scanner-threat-warning',
      'warning',
      `⚠️ Security Threat Detected`,
      `Document contains potential security threats. Risk Level: ${analysis.riskLevel.toUpperCase()}`,
      warningIcon,
      10000 // Show for 10 seconds
    );
  }

  static showThreatPopup(fileName: string, analysis: ThreatAnalysis): Promise<boolean> {
    return new Promise((resolve) => {
      this.hideThreatPopup(); // Remove any existing popup
      
      const modal = document.createElement('div');
      modal.id = 'doc-scanner-threat-modal';
      
      const riskColor = analysis.riskLevel === 'high' ? '#dc2626' : 
                       analysis.riskLevel === 'medium' ? '#ea580c' : 
                       analysis.riskLevel === 'low' ? '#ca8a04' : '#059669';
      
      // Create modal structure
      const modalBackdrop = document.createElement('div');
      modalBackdrop.className = 'doc-scanner-modal-backdrop';
      
      const content = document.createElement('div');
      content.className = 'doc-scanner-modal-content';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'doc-scanner-modal-header';
      
      // Create icon
      const iconContainer = document.createElement('div');
      iconContainer.className = 'doc-scanner-threat-icon';
      iconContainer.style.backgroundColor = riskColor;
      
      // Add SVG icon
      iconContainer.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      
      // Create header text
      const headerText = document.createElement('div');
      const headerTitle = document.createElement('h2');
      headerTitle.textContent = 'Security Threat Detected';
      const headerSubtitle = document.createElement('p');
      headerSubtitle.textContent = 'Document contains security threats';
      headerText.appendChild(headerTitle);
      headerText.appendChild(headerSubtitle);
      header.appendChild(iconContainer);
      header.appendChild(headerText);
      
      // Create body with risk level, summary and warning
      const body = document.createElement('div');
      body.className = 'doc-scanner-modal-body';
      
      body.innerHTML = `
        <div class="doc-scanner-risk-level">
          <span class="doc-scanner-risk-badge ${analysis.riskLevel}">
            ${analysis.riskLevel.toUpperCase()} RISK
          </span>
          <span class="doc-scanner-confidence">
            Confidence: ${Math.round(analysis.confidence * 100)}%
          </span>
        </div>
        
        <div class="doc-scanner-summary">
          <h3>Summary</h3>
          <p>This document contains potentially malicious content that may attempt to manipulate AI systems.</p>
        </div>
        
        <div class="doc-scanner-warning">
          <strong>⚠️ Warning:</strong> This document may contain prompt injection attacks that could:
          <ul>
            <li>Manipulate AI responses</li>
            <li>Bypass safety guidelines</li>
            <li>Extract sensitive information</li>
            <li>Perform unauthorized actions</li>
          </ul>
        </div>
      `;
      
      // Create footer with buttons
      const footer = document.createElement('div');
      footer.className = 'doc-scanner-modal-footer';
      
      const threatBlockBtn = document.createElement('button');
      threatBlockBtn.id = 'doc-scanner-block';
      threatBlockBtn.className = 'doc-scanner-btn danger';
      threatBlockBtn.textContent = 'Block Upload';
      
      const threatProceedBtn = document.createElement('button');
      threatProceedBtn.id = 'doc-scanner-proceed';
      threatProceedBtn.className = 'doc-scanner-btn secondary';
      threatProceedBtn.textContent = 'Proceed Anyway';
      
      footer.appendChild(threatBlockBtn);
      footer.appendChild(threatProceedBtn);
      
      // Assemble modal
      content.appendChild(header);
      content.appendChild(body);
      content.appendChild(footer);
      modalBackdrop.appendChild(content);
      modal.appendChild(modalBackdrop);
      
      document.body.appendChild(modal);
      this.threatModal = modal;

      // Add event listeners
      threatBlockBtn.addEventListener('click', () => {
        this.hideThreatPopup();
        resolve(false); // Block upload
      });

      threatProceedBtn.addEventListener('click', () => {
        this.hideThreatPopup();
        resolve(true); // Allow upload
      });

      // Close on backdrop click
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          this.hideThreatPopup();
          resolve(false); // Block by default
        }
      });
    });
  }

  static hideThreatPopup(): void {
    if (this.threatModal) {
      this.threatModal.remove();
      this.threatModal = null;
    }
  }
}