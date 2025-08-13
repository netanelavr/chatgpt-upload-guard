import { ThreatAnalysis } from './threatDetector';

export class UIComponents {
  private static loadingOverlay: HTMLElement | null = null;
  private static threatModal: HTMLElement | null = null;

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
    const notification = document.createElement('div');
    notification.id = 'doc-scanner-safe-notification';
    notification.innerHTML = `
      <div class="doc-scanner-notification safe">
        <div class="doc-scanner-notification-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M16.67 6L8.33 14.33L3.33 9.33" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="doc-scanner-notification-content">
          <strong>Document Safe</strong>
          <span>"${fileName}" passed security scan</span>
        </div>
        <button class="doc-scanner-notification-close" >×</button>
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

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  static showThreatPopup(fileName: string, analysis: ThreatAnalysis): Promise<boolean> {
    return new Promise((resolve) => {
      this.hideThreatPopup(); // Remove any existing popup

      const modal = document.createElement('div');
      modal.id = 'doc-scanner-threat-modal';
      
      const riskColor = analysis.riskLevel === 'high' ? '#dc2626' : 
                       analysis.riskLevel === 'medium' ? '#ea580c' : '#ca8a04';

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

  static showErrorNotification(message: string): void {
    const notification = document.createElement('div');
    notification.id = 'doc-scanner-error-notification';
    notification.innerHTML = `
      <div class="doc-scanner-notification error">
        <div class="doc-scanner-notification-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="doc-scanner-notification-content">
          <strong>Scan Error</strong>
          <span>${message}</span>
        </div>
        <button class="doc-scanner-notification-close" >×</button>
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

    // Auto-remove after 7 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 7000);
  }
}