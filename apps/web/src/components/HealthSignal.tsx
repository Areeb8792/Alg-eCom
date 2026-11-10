import React, { useEffect, useState } from 'react';
import { checkHealthLive, checkHealthReady } from '../services/api.js';
import { Activity, Database, CheckCircle2, AlertTriangle } from 'lucide-react';

export const HealthSignal: React.FC = () => {
  const [live, setLive] = useState<boolean | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [dbResponseMs, setDbResponseMs] = useState<number | null>(null);

  const pollHealth = async () => {
    try {
      const l = await checkHealthLive();
      setLive(l.status === 'ok');
    } catch {
      setLive(false);
    }

    try {
      const r = await checkHealthReady();
      setReady(r.status === 'ok');
      setDbResponseMs(r.checks?.database?.responseTimeMs ?? null);
    } catch {
      setReady(false);
    }
  };

  useEffect(() => {
    pollHealth();
    const interval = setInterval(pollHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-40 bg-ink/90 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 text-xs space-grotesk flex items-center gap-3 shadow-lg">
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-[10px] tracking-wider uppercase opacity-70">API:</span>
        {live === null ? (
          <span className="text-zinc-400">...</span>
        ) : live ? (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> LIVE
          </span>
        ) : (
          <span className="text-red-400 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> DOWN
          </span>
        )}
      </div>

      <div className="w-[1px] h-3 bg-white/20" />

      <div className="flex items-center gap-1.5">
        <Database className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-[10px] tracking-wider uppercase opacity-70">DB:</span>
        {ready === null ? (
          <span className="text-zinc-400">...</span>
        ) : ready ? (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> READY {dbResponseMs ? `(${dbResponseMs}ms)` : ''}
          </span>
        ) : (
          <span className="text-red-400 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> DISCONNECTED
          </span>
        )}
      </div>
    </div>
  );
};
