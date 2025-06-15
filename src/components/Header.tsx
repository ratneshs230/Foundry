import React from 'react';
import { Bot, Settings, FolderOpen } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  onOpenSettings: () => void;
  onOpenProject: () => void;
  projectName?: string;
}

export function Header({ isConnected, onOpenSettings, onOpenProject, projectName }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <Bot className="w-8 h-8 text-blue-500" />
          <h1 className="text-xl font-bold text-white">AI Code Generator</h1>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {projectName && (
          <div className="text-gray-300 text-sm">
            Project: <span className="text-white font-medium">{projectName}</span>
          </div>
        )}
        <button
          onClick={onOpenProject}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Open Project</span>
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}