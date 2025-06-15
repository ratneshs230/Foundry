class OptionsManager {
    constructor() {
        this.initializeElements();
        this.loadSettings();
        this.setupEventListeners();
    }

    initializeElements() {
        this.apiKeyInput = document.getElementById('apiKey');
        this.saveBtn = document.getElementById('saveBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.toggleBtn = document.getElementById('toggleVisibility');
        this.statusMessage = document.getElementById('statusMessage');
        this.eyeIcon = this.toggleBtn.querySelector('.eye-icon');
        this.eyeOffIcon = this.toggleBtn.querySelector('.eye-off-icon');
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['geminiApiKey']);
            if (result.geminiApiKey) {
                this.apiKeyInput.value = result.geminiApiKey;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Error loading settings', 'error');
        }
    }

    setupEventListeners() {
        this.saveBtn.addEventListener('click', () => this.saveSettings());
        this.clearBtn.addEventListener('click', () => this.clearSettings());
        this.toggleBtn.addEventListener('click', () => this.toggleVisibility());
        
        this.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveSettings();
            }
        });

        this.apiKeyInput.addEventListener('input', () => {
            this.hideStatus();
        });
    }

    async saveSettings() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showStatus('Please enter an API key', 'error');
            return;
        }

        // Basic validation for API key format
        if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
            this.showStatus('Invalid API key format. Please check your key.', 'error');
            return;
        }

        try {
            this.saveBtn.disabled = true;
            this.saveBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                Saving...
            `;

            await chrome.storage.sync.set({ geminiApiKey: apiKey });
            
            this.showStatus('API key saved successfully!', 'success');
            
            // Reset button
            setTimeout(() => {
                this.saveBtn.disabled = false;
                this.saveBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Save API Key
                `;
            }, 1000);

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving API key. Please try again.', 'error');
            
            this.saveBtn.disabled = false;
            this.saveBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
                Save API Key
            `;
        }
    }

    async clearSettings() {
        if (!confirm('Are you sure you want to clear your API key?')) {
            return;
        }

        try {
            await chrome.storage.sync.remove(['geminiApiKey']);
            this.apiKeyInput.value = '';
            this.showStatus('API key cleared successfully', 'success');
        } catch (error) {
            console.error('Error clearing settings:', error);
            this.showStatus('Error clearing API key', 'error');
        }
    }

    toggleVisibility() {
        const isPassword = this.apiKeyInput.type === 'password';
        
        if (isPassword) {
            this.apiKeyInput.type = 'text';
            this.eyeIcon.style.display = 'none';
            this.eyeOffIcon.style.display = 'block';
        } else {
            this.apiKeyInput.type = 'password';
            this.eyeIcon.style.display = 'block';
            this.eyeOffIcon.style.display = 'none';
        }
    }

    showStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type} show`;
        
        // Auto-hide after 3 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                this.hideStatus();
            }, 3000);
        }
    }

    hideStatus() {
        this.statusMessage.classList.remove('show');
    }
}

// Initialize options manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});