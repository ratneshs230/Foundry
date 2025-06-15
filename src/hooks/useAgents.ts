import { useState, useCallback } from 'react';
import { Message, AgentStatus, FileNode, UploadedFile, GeminiModel } from '../types';

const GEMINI_MODELS: GeminiModel[] = [
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Most capable model for complex reasoning tasks',
    maxTokens: 2097152
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and efficient for most tasks',
    maxTokens: 1048576
  },
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    description: 'Reliable performance for general tasks',
    maxTokens: 32768
  },
  {
    id: 'gemini-1.5-pro-exp',
    name: 'Gemini 1.5 Pro Experimental',
    description: 'Latest experimental features and improvements',
    maxTokens: 2097152
  }
];

export function useAgents() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    supervisor: 'idle',
    coder: 'idle'
  });
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(GEMINI_MODELS[0]);

  const addMessage = useCallback((sender: Message['sender'], content: string, type: Message['type'] = 'text', attachments?: UploadedFile[]) => {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender,
      content,
      timestamp: new Date(),
      type,
      attachments
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  const simulateAgentConversation = useCallback(async (userMessage: string, files: FileNode[], attachments?: UploadedFile[]) => {
    // Add user message with attachments
    addMessage('user', userMessage, 'text', attachments);

    // Process attachments if any
    let attachmentContext = '';
    if (attachments && attachments.length > 0) {
      attachmentContext = `\n\nAttached files: ${attachments.map(f => f.name).join(', ')}`;
      
      // Simulate processing attachments
      await new Promise(resolve => setTimeout(resolve, 500));
      addMessage('supervisor', `I can see you've attached ${attachments.length} file(s). Let me analyze them along with your request.`);
    }

    // Supervisor responds first
    setAgentStatus(prev => ({ ...prev, supervisor: 'active' }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    addMessage('supervisor', `I understand you want to ${userMessage.toLowerCase()}${attachmentContext}. Using ${selectedModel.name} for optimal performance. Let me analyze the requirements and coordinate with the Coder agent to implement this functionality.`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addMessage('supervisor', 'Coder, please implement the following requirements:\n1. Create the necessary file structure\n2. Implement the core functionality\n3. Add proper error handling\n4. Ensure code quality and documentation\n5. Consider the attached files in the implementation', 'system');
    
    setAgentStatus(prev => ({ ...prev, supervisor: 'idle', coder: 'active' }));
    
    // Coder responds
    await new Promise(resolve => setTimeout(resolve, 2000));
    addMessage('coder', `Acknowledged, Supervisor. I'll start implementing the solution using ${selectedModel.name} capabilities. ${attachments ? `I've analyzed the ${attachments.length} attached file(s) and will incorporate them into the solution.` : ''}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addMessage('coder', `// Implementation based on your request: ${userMessage}
${attachments ? `// Incorporating attached files: ${attachments.map(f => f.name).join(', ')}\n` : ''}
function implementFeature() {
  // ${userMessage}
  ${attachments ? '// Processing uploaded files...\n  ' : ''}console.log('Feature implemented successfully with ${selectedModel.name}');
  return { 
    success: true, 
    message: 'Implementation complete',
    model: '${selectedModel.name}',
    attachments: ${attachments?.length || 0}
  };
}

// Additional files and components would be created here
export default implementFeature;`, 'code');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addMessage('coder', `Implementation complete! I've created the necessary files and implemented the requested functionality using ${selectedModel.name}. ${attachments ? `The ${attachments.length} uploaded file(s) have been processed and integrated into the solution. ` : ''}The code is ready for review.`);
    
    setAgentStatus(prev => ({ ...prev, coder: 'idle', supervisor: 'active' }));
    
    // Supervisor reviews
    await new Promise(resolve => setTimeout(resolve, 1000));
    addMessage('supervisor', `Excellent work, Coder! The implementation looks solid and makes good use of ${selectedModel.name}'s capabilities. I've reviewed the code and it meets all the requirements${attachments ? `, including proper handling of the uploaded files` : ''}. The feature is ready for deployment.`);
    
    setAgentStatus(prev => ({ ...prev, supervisor: 'idle' }));
  }, [addMessage, selectedModel]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setAgentStatus({ supervisor: 'idle', coder: 'idle' });
  }, []);

  const changeModel = useCallback((model: GeminiModel) => {
    setSelectedModel(model);
    addMessage('system', `Switched to ${model.name} - ${model.description}`, 'system');
  }, [addMessage]);

  return {
    messages,
    agentStatus,
    selectedModel,
    availableModels: GEMINI_MODELS,
    simulateAgentConversation,
    clearMessages,
    changeModel
  };
}