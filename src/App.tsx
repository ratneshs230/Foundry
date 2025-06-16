import React, { useState } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ProjectModal } from './components/ProjectModal';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { AgentChat } from './components/AgentChat';
import { AgentLogViewer } from './components/AgentLogViewer';
import { useAgents } from './hooks/useAgents';
import { FileNode, Project, UploadedFile } from './types';

const sampleProject: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    path: '/src',
    children: [
      {
        id: '2',
        name: 'App.tsx',
        type: 'file',
        path: '/src/App.tsx',
        content: 'import React from \'react\';\n\nfunction App() {\n  return (\n    <div className="App">\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;',
        language: 'typescript'
      },
      {
        id: '3',
        name: 'index.css',
        type: 'file',
        path: '/src/index.css',
        content: 'body {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Roboto\';\n}',
        language: 'css'
      }
    ]
  },
  {
    id: '4',
    name: 'package.json',
    type: 'file',
    path: '/package.json',
    content: '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  }\n}',
    language: 'json'
  }
];

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProject, setShowProject] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | undefined>();
  
  const {
    messages,
    agentStatus,
    selectedModel,
    availableModels,
    agentConversation,
    clearMessages,
    changeModel,
    setApiKey,
    setProjectDir
  } = useAgents();

  const handleConnect = (apiKey: string) => {
    setApiKey(apiKey);
    setIsConnected(true);
    setShowSettings(false);
  };

  const handleSelectProject = async (path: string, name: string) => {
    setProject({ name, path, files: [] });
    setProjectDir(path);
    // List files from real file system recursively
    if (window.electronAPI) {
      const tree = await window.electronAPI.listDirRecursive(path);
      // Assign unique IDs
      const assignIds = (nodes: any[], parentId = ''): FileNode[] => nodes.map((n, i) => ({
        ...n,
        id: parentId + i,
        children: n.children ? assignIds(n.children, parentId + i + '-') : undefined
      }));
      setFiles(assignIds(tree));
    }
    setShowProject(false);
  };

  const handleFileChange = async (file: FileNode, content: string) => {
    if (window.electronAPI) {
      await window.electronAPI.writeFile(file.path, content);
    }
    setFiles((prev: FileNode[]) => prev.map((f: FileNode) => f.id === file.id ? { ...f, content } : f));
    if (selectedFile?.id === file.id) {
      setSelectedFile({ ...selectedFile, content });
    }
  };

  const handleSendMessage = (content: string, attachments?: UploadedFile[]) => {
    agentConversation(content, attachments);
  };

  const handleNewChat = () => {
    clearMessages();
  };

  const handleModelChange = (model: any) => {
    changeModel(model);
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <Header
        isConnected={isConnected}
        onOpenSettings={() => setShowSettings(true)}
        onOpenProject={() => setShowProject(true)}
        projectName={project?.name}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-gray-700">
          <FileExplorer
            files={files}
            onSelectFile={setSelectedFile}
            selectedFile={selectedFile}
          />
        </div>
        
        <div className="flex-1 flex">
          <div className="flex-1 border-r border-gray-700">
            <CodeEditor
              file={selectedFile}
              onFileChange={handleFileChange}
            />
          </div>
          
          <div className="w-96 flex flex-col border-r border-gray-700">
            <AgentChat
              messages={messages}
              agentStatus={agentStatus}
              onSendMessage={handleSendMessage}
              isConnected={isConnected}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              availableModels={availableModels}
              onNewChat={handleNewChat}
            />
            <button
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold border-t border-gray-800"
              onClick={() => setShowLog((v) => !v)}
            >
              {showLog ? 'Hide Agent Log' : 'Show Agent Log'}
            </button>
            {showLog && (
              <div className="flex-1 min-h-0 max-h-80 border-t border-gray-800">
                <AgentLogViewer />
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onConnect={handleConnect}
        isConnected={isConnected}
      />

      <ProjectModal
        isOpen={showProject}
        onClose={() => setShowProject(false)}
        onSelectProject={handleSelectProject}
      />
    </div>
  );
}

export default App;