import React, { useState } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ProjectModal } from './components/ProjectModal';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { AgentChat } from './components/AgentChat';
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
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | undefined>();
  
  const { 
    messages, 
    agentStatus, 
    selectedModel,
    availableModels,
    simulateAgentConversation, 
    clearMessages,
    changeModel
  } = useAgents();

  const handleConnect = (apiKey: string) => {
    // Simulate API connection
    setIsConnected(true);
    setShowSettings(false);
  };

  const handleSelectProject = (path: string, name: string) => {
    setProject({ name, path, files: sampleProject });
    setFiles(sampleProject);
    setShowProject(false);
  };

  const handleFileChange = (file: FileNode, content: string) => {
    const updateFileContent = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === file.id) {
          return { ...node, content };
        }
        if (node.children) {
          return { ...node, children: updateFileContent(node.children) };
        }
        return node;
      });
    };

    setFiles(updateFileContent(files));
    if (selectedFile?.id === file.id) {
      setSelectedFile({ ...selectedFile, content });
    }
  };

  const handleSendMessage = (content: string, attachments?: UploadedFile[]) => {
    simulateAgentConversation(content, files, attachments);
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
          
          <div className="w-96">
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