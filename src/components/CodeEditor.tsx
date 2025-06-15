import React from 'react';
import { FileNode } from '../types';

interface CodeEditorProps {
  file?: FileNode;
  onFileChange: (file: FileNode, content: string) => void;
}

export function CodeEditor({ file, onFileChange }: CodeEditorProps) {
  if (!file) {
    return (
      <div className="bg-gray-900 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="mb-2">Select a file to edit</div>
          <div className="text-sm">Choose a file from the project explorer</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 h-full flex flex-col">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-300">{file.path}</span>
        <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
          {file.language || 'text'}
        </span>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={file.content || ''}
          onChange={(e) => onFileChange(file, e.target.value)}
          className="w-full h-full bg-transparent text-gray-300 font-mono text-sm resize-none outline-none"
          placeholder="Start typing your code here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}