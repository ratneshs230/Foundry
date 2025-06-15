export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'supervisor' | 'coder';
  content: string;
  timestamp: Date;a
  type: 'text' | 'code' | 'system';
  attachments?: UploadedFile[];
}

export interface AgentStatus {
  supervisor: 'idle' | 'thinking' | 'active';
  coder: 'idle' | 'coding' | 'active';
}

export interface Project {
  name: string;
  path: string;
  files: FileNode[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string | ArrayBuffer;
  url?: string;
}

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
}