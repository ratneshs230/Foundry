class GeminiChat {
    constructor() {
        this.apiKey = null;
        this.messages = [];
        this.isTyping = false;
        this.chatHistory = [];
        
        this.initializeElements();
        this.loadApiKey();
        this.loadChatHistory();
        this.setupEventListeners();
    }

    initializeElements() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.apiKeyPrompt = document.getElementById('apiKeyPrompt');
        this.configBtn = document.getElementById('configBtn');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.fileInput = document.getElementById('fileInput');
        this.fileBtn = document.getElementById('fileBtn');
        this.selectedFiles = document.getElementById('selectedFiles');
        this.attachedFiles = [];
    }

    async loadApiKey() {
        try {
            const result = await chrome.storage.sync.get(['geminiApiKey']);
            if (result.geminiApiKey) {
                this.apiKey = result.geminiApiKey;
                this.enableChat();
            } else {
                this.showApiKeyPrompt();
            }
        } catch (error) {
            console.error('Error loading API key:', error);
            this.showApiKeyPrompt();
        }
    }

    async loadChatHistory() {
        try {
            const result = await chrome.storage.local.get(['chatHistory']);
            if (result.chatHistory && result.chatHistory.length > 0) {
                this.chatHistory = result.chatHistory;
                this.displayChatHistory();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    async saveChatHistory() {
        try {
            await chrome.storage.local.set({ chatHistory: this.chatHistory });
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    displayChatHistory() {
        this.hideWelcomeMessage();
        this.chatHistory.forEach(message => {
            this.addMessageToDOM(message.text, message.sender, message.files);
        });
    }

    async clearChatHistory() {
        if (confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
            this.chatHistory = [];
            this.messagesContainer.innerHTML = '';
            this.showWelcomeMessage();
            await chrome.storage.local.remove(['chatHistory']);
        }
    }

    enableChat() {
        this.messageInput.disabled = false;
        this.sendBtn.disabled = false;
        this.fileBtn.disabled = false;
        this.messageInput.placeholder = "Type your message...";
        this.apiKeyPrompt.style.display = 'none';
        if (this.chatHistory.length === 0) {
            this.welcomeMessage.style.display = 'block';
        }
    }

    showApiKeyPrompt() {
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;
        this.fileBtn.disabled = true;
        this.messageInput.placeholder = "Configure API key first...";
        this.welcomeMessage.style.display = 'none';
        this.apiKeyPrompt.style.display = 'flex';
    }

    setupEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        this.configBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        this.clearChatBtn.addEventListener('click', () => {
            this.clearChatHistory();
        });

        this.fileBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Listen for storage changes
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.geminiApiKey) {
                if (changes.geminiApiKey.newValue) {
                    this.apiKey = changes.geminiApiKey.newValue;
                    this.enableChat();
                } else {
                    this.apiKey = null;
                    this.showApiKeyPrompt();
                }
            }
        });
    }

    handleFileSelection(files) {
        Array.from(files).forEach(file => {
            if (this.isValidFile(file)) {
                this.attachedFiles.push(file);
                this.displayAttachedFile(file);
            } else {
                this.showError(`File "${file.name}" is not supported. Please use images (PNG, JPG, GIF, WebP) or documents (PDF, TXT, DOC, DOCX).`);
            }
        });
        this.fileInput.value = ''; // Reset file input
    }

    isValidFile(file) {
        const validTypes = [
            'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        return validTypes.includes(file.type) && file.size <= maxSize;
    }

    displayAttachedFile(file) {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'attached-file';
        fileDiv.innerHTML = `
            <div class="file-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${this.formatFileSize(file.size)})</span>
            </div>
            <button class="remove-file" data-filename="${file.name}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        fileDiv.querySelector('.remove-file').addEventListener('click', () => {
            this.removeAttachedFile(file.name);
            fileDiv.remove();
        });

        this.selectedFiles.appendChild(fileDiv);
        this.selectedFiles.style.display = 'block';
    }

    removeAttachedFile(filename) {
        this.attachedFiles = this.attachedFiles.filter(file => file.name !== filename);
        if (this.attachedFiles.length === 0) {
            this.selectedFiles.style.display = 'none';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if ((!message && this.attachedFiles.length === 0) || this.isTyping) return;

        const messageData = {
            text: message || '[File attachment]',
            sender: 'user',
            files: this.attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
            timestamp: Date.now()
        };

        this.messageInput.value = '';
        this.addMessage(messageData.text, 'user', messageData.files);
        this.chatHistory.push(messageData);
        this.hideWelcomeMessage();
        
        await this.getAIResponse(message, this.attachedFiles);
        
        // Clear attached files after sending
        this.attachedFiles = [];
        this.selectedFiles.innerHTML = '';
        this.selectedFiles.style.display = 'none';
        
        await this.saveChatHistory();
    }

    hideWelcomeMessage() {
        if (this.welcomeMessage.style.display !== 'none') {
            this.welcomeMessage.style.display = 'none';
        }
    }

    showWelcomeMessage() {
        this.welcomeMessage.style.display = 'block';
    }

    addMessage(text, sender, files = []) {
        const messageData = {
            text,
            sender,
            files,
            timestamp: Date.now()
        };

        if (sender === 'ai') {
            this.chatHistory.push(messageData);
        }

        this.addMessageToDOM(text, sender, files);
    }

    addMessageToDOM(text, sender, files = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        let content = '';
        
        // Add file attachments display
        if (files && files.length > 0) {
            content += '<div class="message-files">';
            files.forEach(file => {
                const isImage = file.type && file.type.startsWith('image/');
                content += `
                    <div class="message-file">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${isImage ? 
                                '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>' :
                                '<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>'
                            }
                        </svg>
                        <span>${file.name}</span>
                    </div>
                `;
            });
            content += '</div>';
        }
        
        // Add message text
        if (text && text !== '[File attachment]') {
            const formattedText = this.formatMessage(text);
            content += `<div class="message-text">${formattedText}</div>`;
        }
        
        messageDiv.innerHTML = content;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        return typingDiv;
    }

    removeTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    async getAIResponse(message, files = []) {
        if (!this.apiKey) {
            this.addMessage('Please configure your API key in settings.', 'ai');
            return;
        }

        this.isTyping = true;
        this.sendBtn.disabled = true;
        this.messageInput.disabled = true;
        this.fileBtn.disabled = true;
        const typingIndicator = this.showTypingIndicator();

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;
            
            const parts = [];
            
            // Add text message if provided
            if (message) {
                parts.push({ text: message });
            }
            
            // Add file attachments
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    const base64Data = await this.fileToBase64(file);
                    parts.push({
                        inline_data: {
                            mime_type: file.type,
                            data: base64Data
                        }
                    });
                } else if (file.type === 'text/plain') {
                    const text = await file.text();
                    parts.push({ 
                        text: `Content of file "${file.name}":\n\n${text}` 
                    });
                } else {
                    parts.push({ 
                        text: `[Document: ${file.name} (${file.type})] - Please note that I can see this is a ${file.type} file named "${file.name}", but I cannot directly read its contents. Please describe what you'd like me to help you with regarding this file.` 
                    });
                }
            }

            const requestBody = {
                contents: [{ parts }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                const candidate = data.candidates[0];
                
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    const aiResponse = candidate.content.parts[0].text;
                    this.removeTypingIndicator(typingIndicator);
                    this.addMessage(aiResponse, 'ai');
                } else if (candidate.finishReason === 'SAFETY') {
                    this.removeTypingIndicator(typingIndicator);
                    this.addMessage('I cannot provide a response to that request due to safety guidelines. Please try rephrasing your question.', 'ai');
                } else {
                    throw new Error('No valid response content received from Gemini API');
                }
            } else {
                throw new Error('No candidates in API response');
            }

        } catch (error) {
            console.error('Error calling Gemini API:', error);
            this.removeTypingIndicator(typingIndicator);
            
            let errorMessage = 'Sorry, I encountered an error. ';
            
            if (error.message.includes('400')) {
                errorMessage += 'Invalid request. Please check your message and try again.';
            } else if (error.message.includes('401')) {
                errorMessage += 'Invalid API key. Please check your API key in settings.';
            } else if (error.message.includes('403')) {
                errorMessage += 'API access forbidden. Please verify your API key and billing settings.';
            } else if (error.message.includes('429')) {
                errorMessage += 'Too many requests. Please wait a moment and try again.';
            } else if (error.message.includes('500')) {
                errorMessage += 'Server error. Please try again in a few moments.';
            } else if (error.message.includes('SAFETY')) {
                errorMessage = 'I cannot provide a response to that request due to safety guidelines. Please try rephrasing your question.';
            } else {
                errorMessage += 'Please try again or check your internet connection.';
            }
            
            this.addMessage(errorMessage, 'ai');
        } finally {
            this.isTyping = false;
            this.sendBtn.disabled = false;
            this.messageInput.disabled = false;
            this.fileBtn.disabled = false;
            this.messageInput.focus();
            await this.saveChatHistory();
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        this.messagesContainer.appendChild(errorDiv);
        this.scrollToBottom();
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }
}

// Initialize the chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GeminiChat();
});