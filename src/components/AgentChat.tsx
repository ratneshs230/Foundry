import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Code, MessageSquare, Plus, Paperclip, X, Trash2, Settings } from 'lucide-react';
import { Message, AgentStatus, UploadedFile } from '../types';

interface AgentChatProps {
  messages: Message[];
  agentStatus: AgentStatus;
  onSendMessage: (content: string, attachments?: UploadedFile[]) => void;
  isConnected: boolean;
  onNewChat: () => void;
}

export function AgentChat({ 
  messages, 
  agentStatus, 
  onSendMessage, 
  isConnected, 
  onNewChat
}: AgentChatProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && isConnected) {
      onSendMessage(input.trim(), attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const uploadedFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          content: event.target?.result || '',
          url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        };
        setAttachments(prev => [...prev, uploadedFile]);
      };
      
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(file => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMessageIcon = (sender: string) => {
    switch (sender) {
      case 'user':
        return <User className="w-5 h-5" />;
      case 'supervisor':
        return <MessageSquare className="w-5 h-5" />;
      case 'coder':
        return <Code className="w-5 h-5" />;
      default:
        return <Bot className="w-5 h-5" />;
    }
  };

  const getMessageColor = (sender: string) => {
    switch (sender) {
      case 'user':
        return 'text-blue-400';
      case 'supervisor':
        return 'text-purple-400';
      case 'coder':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Agent Communication</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onNewChat}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
        
        <div className="flex space-x-4 text-xs">
          <div className={`flex items-center space-x-1 ${
            agentStatus.supervisor === 'active' ? 'text-purple-400' : 'text-gray-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              agentStatus.supervisor === 'active' ? 'bg-purple-400 animate-pulse' : 'bg-gray-500'
            }`} />
            <span>Supervisor</span>
          </div>
          <div className={`flex items-center space-x-1 ${
            agentStatus.coder === 'active' ? 'text-green-400' : 'text-gray-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              agentStatus.coder === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
            }`} />
            <span>Coder</span>
          </div>
          <div className={`flex items-center space-x-1 ${
            agentStatus.user === 'active' ? 'text-blue-400' : 'text-gray-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              agentStatus.user === 'active' ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'
            }`} />
            <span>User</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex space-x-3">
            <div className={`flex-shrink-0 ${getMessageColor(message.sender)}`}>
              {getMessageIcon(message.sender)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-sm font-medium ${getMessageColor(message.sender)}`}>
                  {message.sender.charAt(0).toUpperCase() + message.sender.slice(1)}
                </span>
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className={`text-sm ${
                message.type === 'code' 
                  ? 'bg-gray-900 p-3 rounded font-mono text-gray-300'
                  : 'text-gray-300'
              }`}>
                {message.content}
              </div>
              
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map(file => (
                    <div key={file.id} className="flex items-center space-x-2 p-2 bg-gray-700 rounded text-xs">
                      <Paperclip className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300">{file.name}</span>
                      <span className="text-gray-500">({formatFileSize(file.size)})</span>
                      {file.url && file.type.startsWith('image/') && (
                        <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-700">
        {attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {attachments.map(file => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-300">{file.name}</span>
                  <span className="text-gray-500">({formatFileSize(file.size)})</span>
                  {file.url && file.type.startsWith('image/') && (
                    <img src={file.url} alt={file.name} className="w-6 h-6 object-cover rounded" />
                  )}
                </div>
                <button
                  onClick={() => removeAttachment(file.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isConnected ? "Describe what you want to build..." : "Connect to OpenAI API first"}
              disabled={!isConnected}
              className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.json,.xml,.md,.yml,.yaml,.sql,.sh,.bat,.ps1,.php,.rb,.go,.rs,.swift,.kt,.scala,.clj,.hs,.elm,.vue,.svelte,.astro"
        />
      </div>
    </div>
  );
}