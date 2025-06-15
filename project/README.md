# Gemini AI Chat Chrome Extension

A beautiful Chrome extension that integrates with Google's Gemini AI for seamless chatting directly from your browser.

## Features

- 🤖 **Direct Gemini AI Integration** - Chat with Google's advanced AI assistant
- 🎨 **Beautiful Modern UI** - Glassmorphism design with smooth animations
- 🔒 **Secure API Key Storage** - Your API key is stored safely in your browser
- 💬 **Real-time Chat** - Instant responses with typing indicators
- ⚡ **Fast & Lightweight** - Optimized for performance
- 📱 **Responsive Design** - Works perfectly in the popup window

## Installation

1. **Download or clone this repository**
2. **Get your Gemini API key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
3. **Install the extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select this folder
4. **Configure your API key**:
   - Click the extension icon in your toolbar
   - Click "Configure API Key" or the settings icon
   - Paste your API key and save

## Usage

1. Click the extension icon in your Chrome toolbar
2. Start typing your message in the chat input
3. Press Enter or click the send button
4. Enjoy chatting with Gemini AI!

## Development

The extension is built with vanilla JavaScript and modern web APIs:

- `manifest.json` - Extension configuration
- `popup.html/js/css` - Main chat interface
- `options.html/js/css` - Settings page
- Chrome Extensions API for storage and permissions

## Privacy

- Your API key is stored locally in your browser using Chrome's secure storage
- No data is sent to any servers except Google's official Gemini API
- Your conversations are not stored or logged

## License

MIT License - feel free to modify and distribute!