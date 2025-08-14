import { ThreatAnalysis } from './threatDetector';

export class UIComponents {
  private static loadingOverlay: HTMLElement | null = null;
  private static threatModal: HTMLElement | null = null;
  private static errorModal: HTMLElement | null = null;

  static showLoadingSpinner(fileName: string): void {
    this.hideLoadingSpinner(); // Remove any existing spinner

    const overlay = document.createElement('div');
    overlay.id = 'doc-scanner-loading';
    overlay.innerHTML = `
      <div class="doc-scanner-loading-backdrop">
        <div class="doc-scanner-loading-content">
          <div class="doc-scanner-spinner"></div>
          <h3>Scanning Document</h3>
          <p>Analyzing "${fileName}" for security threats...</p>
          <small>This may take a few moments</small>
        </div>
      </div>
    `;

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
      `"${fileName}" passed security scan`,
      this.getCheckIcon(),
      5000
    );
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

      const modal = document.createElement('div');
      modal.id = 'doc-scanner-error-modal';

      modal.innerHTML = `
        <div class="doc-scanner-modal-backdrop">
          <div class="doc-scanner-modal-content">
            <div class="doc-scanner-modal-header">
              <div class="doc-scanner-threat-icon" style="background-color: #dc2626">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h2>Scanning Error</h2>
                <p>Document: <strong>${fileName}</strong></p>
              </div>
            </div>

            <div class="doc-scanner-modal-body">
              <div class="doc-scanner-summary">
                <h3>Error Details</h3>
                <p>${error}</p>
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
            </div>

            <div class="doc-scanner-modal-footer">
              <button id="doc-scanner-error-block" class="doc-scanner-btn danger">
                Block Upload
              </button>
              <button id="doc-scanner-error-proceed" class="doc-scanner-btn secondary">
                Upload Anyway
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.errorModal = modal;

      // Add event listeners
      const blockBtn = modal.querySelector('#doc-scanner-error-block') as HTMLElement;
      const proceedBtn = modal.querySelector('#doc-scanner-error-proceed') as HTMLElement;

      blockBtn.addEventListener('click', () => {
        this.hideErrorPopup();
        resolve(false); // Block upload
      });

      proceedBtn.addEventListener('click', () => {
        this.hideErrorPopup();
        resolve(true); // Allow upload
      });

      // Close on backdrop click
      const backdrop = modal.querySelector('.doc-scanner-modal-backdrop') as HTMLElement;
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
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
    const notification = document.createElement('div');
    notification.id = id;
    notification.innerHTML = `
      <div class="doc-scanner-notification ${type}">
        <div class="doc-scanner-notification-icon">
          ${iconSvg}
        </div>
        <div class="doc-scanner-notification-content">
          <strong>${title}</strong>
          <span>${message}</span>
        </div>
        <button class="doc-scanner-notification-close">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Add close button event listener
    const closeButton = notification.querySelector('.doc-scanner-notification-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notification.remove();
      });
    }

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

    const riskColor = analysis.riskLevel === 'high' ? '#dc2626' : 
                     analysis.riskLevel === 'medium' ? '#ea580c' : '#ca8a04';

    const warningIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" 
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const threatsText = analysis.threats.length > 0 
      ? ` Threats: ${analysis.threats.join(', ')}`
      : '';

    this.createNotification(
      'doc-scanner-threat-warning',
      'warning',
      `⚠️ Security Threat Detected`,
      `"${fileName}" contains potential prompt injection attacks.${threatsText} Risk Level: ${analysis.riskLevel.toUpperCase()}`,
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

      modal.innerHTML = `
        <div class="doc-scanner-modal-backdrop">
          <div class="doc-scanner-modal-content">
            <div class="doc-scanner-modal-header">
              <div class="doc-scanner-threat-icon" style="background-color: ${riskColor}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h2>Security Threat Detected</h2>
                <p>Document: <strong>${fileName}</strong></p>
              </div>
            </div>

            <div class="doc-scanner-modal-body">
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
                <p>${analysis.summary}</p>
              </div>

              ${analysis.threats.length > 0 ? `
                <div class="doc-scanner-threats">
                  <h3>Detected Threats</h3>
                  <ul>
                    ${analysis.threats.map(threat => `<li>${threat}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              <div class="doc-scanner-warning">
                <strong>⚠️ Warning:</strong> This document may contain prompt injection attacks that could:
                <ul>
                  <li>Manipulate AI responses</li>
                  <li>Bypass safety guidelines</li>
                  <li>Extract sensitive information</li>
                  <li>Perform unauthorized actions</li>
                </ul>
              </div>
            </div>

            <div class="doc-scanner-modal-footer">
              <button id="doc-scanner-block" class="doc-scanner-btn danger">
                Block Upload
              </button>
              <button id="doc-scanner-proceed" class="doc-scanner-btn secondary">
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.threatModal = modal;

      // Add event listeners
      const blockBtn = modal.querySelector('#doc-scanner-block') as HTMLElement;
      const proceedBtn = modal.querySelector('#doc-scanner-proceed') as HTMLElement;

      blockBtn.addEventListener('click', () => {
        this.hideThreatPopup();
        resolve(false); // Block upload
      });

      proceedBtn.addEventListener('click', () => {
        this.hideThreatPopup();
        resolve(true); // Allow upload
      });

      // Close on backdrop click
      const backdrop = modal.querySelector('.doc-scanner-modal-backdrop') as HTMLElement;
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
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