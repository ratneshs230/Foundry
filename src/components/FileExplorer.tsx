import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { FileNode } from '../types';

interface FileExplorerProps {
  files: FileNode[];
  onSelectFile: (file: FileNode) => void;
  selectedFile?: FileNode;
}

export function FileExplorer({ files, onSelectFile, selectedFile }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (nodeId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFile?.id === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center space-x-2 px-2 py-1 hover:bg-gray-700 cursor-pointer rounded transition-colors ${
            isSelected ? 'bg-blue-900 bg-opacity-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            } else {
              onSelectFile(node);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-400" />
              ) : (
                <Folder className="w-4 h-4 text-blue-400" />
              )}
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="w-4 h-4 text-gray-400" />
            </>
          )}
          <span className="text-sm text-gray-300 truncate">{node.name}</span>
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 h-full overflow-y-auto">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Project Files</h3>
      </div>
      <div className="p-2">
        {files.map(node => renderNode(node))}
      </div>
    </div>
  );
}