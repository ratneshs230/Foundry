import React, { useState } from 'react';
import { X, Key, Shield, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (apiKey: string) => void;
  isConnected: boolean;
}

export function SettingsModal({ isOpen, onClose, onConnect, isConnected }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    
    setIsConnecting(true);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    onConnect(apiKey);
    setIsConnecting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>API Configuration</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-700">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 font-medium">Administrator Mode</span>
            </div>
            <p className="text-sm text-blue-200">
              This application requires administrator privileges for full file system access.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Key className="w-4 h-4 inline mr-1" />
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your API key is stored securely and used only for Gemini API calls.
            </p>
          </div>

          <div className="pt-4 flex space-x-3">
            <button
              onClick={handleConnect}
              disabled={!apiKey.trim() || isConnecting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {isConnecting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <span>{isConnected ? 'Reconnect' : 'Connect'}</span>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}