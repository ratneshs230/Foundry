import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { FileNode } from '../types';

interface FileExplorerProps {
  files: FileNode[];
  onSelectFile: (file: FileNode | undefined) => void;
  selectedFile?: FileNode;
}

export function FileExplorer({ files, onSelectFile, selectedFile }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode | null } | null>(null);

  // Helper to reload the file tree
  const reloadTree = async () => {
    if (window.electronAPI && files[0]) {
      const rootPath = files[0].path.split(/[\\/]/).slice(0, -1).join('/') || files[0].path;
      const tree = await window.electronAPI.listDirRecursive(rootPath);
      // Assign unique IDs
      const assignIds = (nodes: any[], parentId = ''): FileNode[] => nodes.map((n, i) => ({
        ...n,
        id: parentId + i,
        children: n.children ? assignIds(n.children, parentId + i + '-') : undefined
      }));
      onSelectFile(undefined);
      setTimeout(() => onSelectFile(undefined), 0); // force deselect
      return assignIds(tree);
    }
    return files;
  };

  // Context menu for file/folder actions
  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleCreateFile = async (parent: FileNode) => {
    const name = prompt('Enter new file name:');
    if (name && window.electronAPI) {
      const filePath = parent.type === 'folder' ? `${parent.path}/${name}` : `${parent.path}/${name}`;
      await window.electronAPI.createFile(filePath, '');
      await reloadTree();
    }
    setContextMenu(null);
  };

  const handleCreateFolder = async (parent: FileNode) => {
    const name = prompt('Enter new folder name:');
    if (name && window.electronAPI) {
      const folderPath = parent.type === 'folder' ? `${parent.path}/${name}` : `${parent.path}/${name}`;
      await window.electronAPI.createFolder(folderPath);
      await reloadTree();
    }
    setContextMenu(null);
  };

  const handleDelete = async (node: FileNode) => {
    if (window.electronAPI && window.confirm(`Delete ${node.name}?`)) {
      await window.electronAPI.deleteFile(node.path);
      await reloadTree();
    }
    setContextMenu(null);
  };

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
      <div key={node.id} onContextMenu={e => handleContextMenu(e, node)}>
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
    <div className="bg-gray-800 h-full overflow-y-auto" onClick={() => setContextMenu(null)}>
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Project Files</h3>
        <button onClick={() => handleCreateFolder(files[0])} className="text-xs text-blue-300 hover:text-white flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>New Folder</span>
        </button>
        <button onClick={() => handleCreateFile(files[0])} className="text-xs text-blue-300 hover:text-white flex items-center space-x-1 ml-2">
          <Plus className="w-4 h-4" />
          <span>New File</span>
        </button>
      </div>
      <div className="p-2">
        {files.map(node => renderNode(node))}
      </div>
      {contextMenu && contextMenu.node && (
        <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }} className="bg-gray-900 border border-gray-700 rounded shadow-lg">
          <button onClick={() => handleCreateFile(contextMenu.node)} className="block w-full px-4 py-2 text-left text-sm text-blue-300 hover:bg-gray-700">New File</button>
          <button onClick={() => handleCreateFolder(contextMenu.node)} className="block w-full px-4 py-2 text-left text-sm text-blue-300 hover:bg-gray-700">New Folder</button>
          <button onClick={() => handleDelete(contextMenu.node)} className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700">Delete</button>
        </div>
      )}
    </div>
  );
}