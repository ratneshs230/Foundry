import React, { useState } from 'react';
import { X, FolderPlus, Folder } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (path: string, name: string) => void;
}

export function ProjectModal({ isOpen, onClose, onSelectProject }: ProjectModalProps) {
  const [projectPath, setProjectPath] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isNewProject, setIsNewProject] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!projectPath.trim()) return;
    const name = projectName.trim() || projectPath.split(/[/\\]/).pop() || 'Untitled Project';
    onSelectProject(projectPath, name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Project Setup</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setIsNewProject(true)}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                isNewProject 
                  ? 'border-blue-500 bg-blue-900 bg-opacity-50 text-blue-300'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              <FolderPlus className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm">New Project</div>
            </button>
            <button
              onClick={() => setIsNewProject(false)}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                !isNewProject 
                  ? 'border-blue-500 bg-blue-900 bg-opacity-50 text-blue-300'
                  : 'border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              <Folder className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm">Existing Project</div>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Directory
            </label>
            <input
              type="text"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              placeholder={isNewProject ? "C:\\MyProjects\\NewApp" : "C:\\MyProjects\\ExistingApp"}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {isNewProject && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name (Optional)
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome App"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div className="pt-4 flex space-x-3">
            <button
              onClick={handleSubmit}
              disabled={!projectPath.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {isNewProject ? 'Create Project' : 'Open Project'}
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