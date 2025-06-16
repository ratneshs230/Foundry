// TypeScript types for Electron preload API
export interface ElectronAPI {
  selectDirectory: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  createFile: (filePath: string, content?: string) => Promise<boolean>;
  createFolder: (folderPath: string) => Promise<boolean>;
  listDir: (dirPath: string) => Promise<Array<{ name: string; type: 'file' | 'folder'; path: string }>>;
  listDirRecursive: (dirPath: string) => Promise<FileNode[]>;
  checkAdmin: () => Promise<boolean>;
  elevate: () => Promise<boolean>;
  setChatgptApiKey: (key: string) => Promise<boolean>;
  getChatgptApiKey: () => Promise<string | null>;
  chatgptRequestSession: (payload: any) => Promise<any>;
  agentMessage: (msg: { from: string; to: string; message: string }) => Promise<any>;
  getAgentLogs: () => Promise<any[]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
