import { useState, useCallback } from 'react';
import { Message, AgentStatus, FileNode, UploadedFile } from '../types';

export function useAgents() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    supervisor: 'idle',
    coder: 'idle',
    user: 'idle'
  });
  const [projectDir, setProjectDir] = useState<string>('');

  // Set ChatGPT API key via Electron IPC
  const setApiKey = useCallback(async (key: string) => {
    if (window.electronAPI) {
      await window.electronAPI.setChatgptApiKey(key);
    }
  }, []);

  // Add a message to the chat log and log via IPC
  const addMessage = useCallback((sender: Message['sender'] | 'system', content: string, type: Message['type'] = 'text', attachments?: UploadedFile[]) => {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: sender as Message['sender'],
      content,
      timestamp: new Date(),
      type,
      attachments
    };
    setMessages((prev: Message[]) => [...prev, message]);
    if (window.electronAPI) {
      window.electronAPI.agentMessage({ from: sender, to: 'all', message: content });
    }
    return message;
  }, []);

  // Fetch agent logs from Electron
  const fetchAgentLogs = useCallback(async () => {
    if (window.electronAPI) {
      return await window.electronAPI.getAgentLogs();
    }
    return [];
  }, []);

  // Open folder picker and set project directory
  const pickProjectDir = useCallback(async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.selectDirectory();
      if (dir) setProjectDir(dir);
      return dir;
    }
    return null;
  }, []);

  // Real agent conversation using ChatGPT API and file system
  const agentConversation = useCallback(async (userMessage: string, attachments?: UploadedFile[]) => {
    setAgentStatus((prev: AgentStatus) => ({ ...prev, user: 'idle' }));
    addMessage('user', userMessage, 'text', attachments);
    if (!projectDir) {
      addMessage('system', 'Please select a project directory before starting.', 'system');
      return;
    }
    setAgentStatus((prev: AgentStatus) => ({ ...prev, supervisor: 'active', user: 'idle' }));
    // Supervisor: Analyze requirements
    const supervisorPrompt = `You are the Supervisor (Architect). The user wants: ${userMessage}\nDiscuss requirements, then instruct the Coder agent. Reply as Supervisor. The coder will work on real files in the project directory: ${projectDir}`;
    let supervisorRes;
    try {
      supervisorRes = await window.electronAPI.chatgptRequestSession({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are the Supervisor (Architect).' },
          { role: 'user', content: supervisorPrompt }
        ],
        max_tokens: 1024
      });
    } catch (err) {
      addMessage('system', `Supervisor ChatGPT request error: ${err}`, 'system');
      return;
    }
    const supervisorMsg = supervisorRes.choices?.[0]?.message?.content || 'Supervisor response.';
    addMessage('supervisor', supervisorMsg);
    // Log supervisor message
    if (window.electronAPI) {
      window.electronAPI.agentMessage({ from: 'supervisor', to: 'coder', message: supervisorMsg });
    }
    setAgentStatus((prev: AgentStatus) => ({ ...prev, supervisor: 'idle', coder: 'active', user: 'idle' }));
    // Coder: Implement instructions
    const coderPrompt = `You are the Coder (Engineer). Supervisor says: ${supervisorMsg}\nYou must generate and apply real file operations (create/modify/delete) in the project directory: ${projectDir}. Reply as Coder.\nFormat file operations as JSON: {\n  "operations": [\n    {"action": "create|modify|delete", "path": "relative/or/absolute/path", "content": "..."} ...\n  ]\n}`;
    let coderRes;
    try {
      coderRes = await window.electronAPI.chatgptRequestSession({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are the Coder (Engineer).' },
          { role: 'user', content: coderPrompt }
        ],
        max_tokens: 2048
      });
    } catch (err) {
      addMessage('system', `Coder ChatGPT request error: ${err}`, 'system');
      return;
    }
    const coderMsg = coderRes.choices?.[0]?.message?.content || 'Coder response.';
    addMessage('coder', coderMsg, 'code');
    // Log coder message
    if (window.electronAPI) {
      window.electronAPI.agentMessage({ from: 'coder', to: 'supervisor', message: coderMsg });
    }
    // Parse coderMsg for file operations and apply them using Electron file APIs
    try {
      // Remove Markdown code block markers if present
      let jsonBlock = coderMsg.replace(/```json|```/gi, '').trim();
      // Extract the first valid JSON object
      const match = jsonBlock.match(/\{[\s\S]*\}/);
      if (match) {
        const ops = JSON.parse(match[0]);
        if (Array.isArray(ops.operations)) {
          for (const op of ops.operations) {
            // Always resolve path relative to projectDir
            const absPath = op.path.startsWith(projectDir) ? op.path : `${projectDir.replace(/\\$/, '')}/${op.path.replace(/^\\|\//, '')}`;
            if (op.action === 'create') {
              await window.electronAPI.createFile(absPath, op.content || '');
            } else if (op.action === 'modify') {
              await window.electronAPI.writeFile(absPath, op.content || '');
            } else if (op.action === 'delete') {
              await window.electronAPI.deleteFile(absPath);
            }
          }
        }
      }
    } catch (e) {
      addMessage('system', `Failed to parse or apply file operations: ${e}`, 'system');
    }
    setAgentStatus((prev: AgentStatus) => ({ ...prev, coder: 'idle', supervisor: 'active', user: 'idle' }));
    // Supervisor: Review
    const reviewPrompt = `You are the Supervisor. Review the Coder's implementation: ${coderMsg}`;
    let reviewRes;
    try {
      reviewRes = await window.electronAPI.chatgptRequestSession({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are the Supervisor.' },
          { role: 'user', content: reviewPrompt }
        ],
        max_tokens: 1024
      });
    } catch (err) {
      addMessage('system', `Supervisor review ChatGPT request error: ${err}`, 'system');
      return;
    }
    const reviewMsg = reviewRes.choices?.[0]?.message?.content || 'Supervisor review.';
    addMessage('supervisor', reviewMsg);
    // If supervisor wants user input, set user status to active and ask a simple question
    if (/user input|user response|ask the user|need clarification|please provide|can you/i.test(reviewMsg)) {
      setAgentStatus((prev: AgentStatus) => ({ ...prev, supervisor: 'idle', user: 'active', coder: 'idle' }));
      // Optionally, extract a simple question from the reviewMsg
      const questionMatch = reviewMsg.match(/(?:question|ask|please provide|can you|clarify|input)[^\n\.!?]*[\n\.!?]/i);
      if (questionMatch) {
        addMessage('system', `Question for user: ${questionMatch[0].trim()}`, 'system');
      } else {
        addMessage('system', 'Supervisor needs your input. Please respond in simple words.', 'system');
      }
    } else {
      setAgentStatus((prev: AgentStatus) => ({ ...prev, supervisor: 'idle', user: 'idle', coder: 'idle' }));
    }
    if (window.electronAPI) {
      window.electronAPI.agentMessage({ from: 'supervisor', to: 'coder', message: reviewMsg });
    }
  }, [addMessage, projectDir]);

  return {
    messages,
    agentStatus,
    agentConversation,
    clearMessages: useCallback(() => {
      setMessages([]);
      setAgentStatus({ supervisor: 'idle', coder: 'idle', user: 'idle' });
    }, []),
    setApiKey,
    setProjectDir,
    pickProjectDir,
    fetchAgentLogs
  };
}