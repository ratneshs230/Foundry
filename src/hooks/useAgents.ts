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
    setAgentStatus(prev => ({ ...prev, user: 'idle' }));
    addMessage('user', userMessage, 'text', attachments);
    if (!projectDir) {
      addMessage('system', 'Please select a project directory before starting.', 'system');
      return;
    }

    let ongoing = true;
    let round = 0;
    let reviewMsg = '';

    while (ongoing && round < 10) {
      round += 1;
      setAgentStatus(prev => ({ ...prev, supervisor: 'active', user: 'idle' }));
      const supervisorPrompt =
        round === 1
          ? `You are the Supervisor (Architect). The user wants: ${userMessage}\nDiscuss requirements, then instruct the Coder agent. Reply as Supervisor. The coder will work on real files in the project directory: ${projectDir}`
          : `You are the Supervisor continuing the project. Based on the last review: ${reviewMsg}\nProvide the next instructions for the Coder. If everything is complete reply with a short confirmation containing the word "complete".`;

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
      if (window.electronAPI) {
        window.electronAPI.agentMessage({ from: 'supervisor', to: 'coder', message: supervisorMsg });
      }

      setAgentStatus(prev => ({ ...prev, supervisor: 'idle', coder: 'active', user: 'idle' }));
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
      if (window.electronAPI) {
        window.electronAPI.agentMessage({ from: 'coder', to: 'supervisor', message: coderMsg });
      }

      try {
        const jsonBlock = coderMsg.replace(/```json|```/gi, '').trim();
        const match = jsonBlock.match(/\{[\s\S]*\}/);
        if (match) {
          const ops = JSON.parse(match[0]);
          if (Array.isArray(ops.operations)) {
            for (const op of ops.operations) {
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

      setAgentStatus(prev => ({ ...prev, coder: 'idle', supervisor: 'active', user: 'idle' }));
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
      reviewMsg = reviewRes.choices?.[0]?.message?.content || 'Supervisor review.';
      addMessage('supervisor', reviewMsg);

      if (window.electronAPI) {
        window.electronAPI.agentMessage({ from: 'supervisor', to: 'coder', message: reviewMsg });
      }

      if (/user input|user response|ask the user|need clarification|please provide|can you/i.test(reviewMsg)) {
        setAgentStatus(prev => ({ ...prev, supervisor: 'idle', user: 'active', coder: 'idle' }));
        const questionMatch = reviewMsg.match(/(?:question|ask|please provide|can you|clarify|input)[^\n\.!?]*[\n\.!?]/i);
        if (questionMatch) {
          addMessage('system', `Question for user: ${questionMatch[0].trim()}`, 'system');
        } else {
          addMessage('system', 'Supervisor needs your input. Please respond in simple words.', 'system');
        }
        ongoing = false;
      } else if (/complete|finished|nothing else|project is done/i.test(reviewMsg.toLowerCase())) {
        setAgentStatus(prev => ({ ...prev, supervisor: 'idle', user: 'idle', coder: 'idle' }));
        ongoing = false;
      }
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