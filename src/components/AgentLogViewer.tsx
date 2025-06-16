import React, { useEffect, useState } from 'react';

interface AgentLogEntry {
  timestamp: number;
  from: string;
  to: string;
  message: string;
}

export function AgentLogViewer() {
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    if (window.electronAPI) {
      const result = await window.electronAPI.getAgentLogs();
      setLogs(Array.isArray(result) ? result : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // Optionally, poll for updates or add a refresh button
  }, []);

  return (
    <div className="bg-gray-900 text-gray-200 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">Agent Communication Log</h2>
        <button
          onClick={fetchLogs}
          className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="space-y-2">
        {logs.length === 0 && <div className="text-gray-400">No logs yet.</div>}
        {logs.map((log, idx) => (
          <div key={idx} className="p-2 bg-gray-800 rounded border border-gray-700">
            <div className="flex items-center text-xs text-gray-400 mb-1">
              <span>{new Date(log.timestamp).toLocaleString()}</span>
              <span className="mx-2">|</span>
              <span>From: <span className="font-semibold text-blue-300">{log.from}</span></span>
              <span className="mx-2">→</span>
              <span>To: <span className="font-semibold text-green-300">{log.to}</span></span>
            </div>
            <div className="text-sm text-gray-200 whitespace-pre-line">{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
