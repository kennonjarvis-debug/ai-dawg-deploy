import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, FileDiff, GitBranch, GitCommit, Layers, LineChart, Loader2, RefreshCw, ShieldAlert, SignalHigh, SignalLow, SignalMedium, Sparkles, X } from 'lucide-react';

function getApiBase() {
  try {
    const params = new URLSearchParams(window.location.search);
    const qp = params.get('api');
    if (qp) return qp;
    const env = (import.meta && import.meta.env && import.meta.env.VITE_MONITOR_API) || '';
    if (env) return env;
    const ls = window.localStorage.getItem('monitor_api_base');
    if (ls) return ls;
  } catch {}
  return 'http://localhost:3001';
}

const API_BASE = getApiBase();

function classNames(...xs) { return xs.filter(Boolean).join(' '); }

function ProgressBar({ label, level }) {
  const map = { 'ahead': { pct: 85, color: 'bg-green-500' }, 'on track': { pct: 70, color: 'bg-green-400' }, 'needs attention': { pct: 40, color: 'bg-yellow-500' }, 'blocked': { pct: 15, color: 'bg-red-500' } };
  const { pct, color } = map[level] || { pct: 0, color: 'bg-gray-600' };
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1"><span>{label || 'Progress'}</span><span>{level || 'unknown'}</span></div>
      <div className="w-full h-2 rounded bg-neutral-800"><div className={classNames('h-2 rounded transition-all', color)} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const map = { high: 'bg-red-500/20 text-red-300 border border-red-500/30', medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30', low: 'bg-green-500/20 text-green-300 border border-green-500/30' };
  return <span className={classNames('px-2 py-0.5 rounded text-xs', map[priority] || 'bg-gray-700 text-gray-300 border border-gray-600')}>{priority || 'unrated'}</span>;
}

function useSSE(setConnected, onLog) {
  useEffect(() => {
    let es;
    try {
      es = new EventSource(`${API_BASE}/api/logs/stream`);
      setConnected('connecting');
      es.onmessage = (evt) => {
        try { const msg = JSON.parse(evt.data); if (msg.type === 'connected' || msg.type === 'heartbeat') setConnected('connected'); if (msg.type === 'log') onLog(msg); } catch {}
      };
      es.onerror = () => setConnected('disconnected');
    } catch { setConnected('disconnected'); }
    return () => { if (es) es.close(); };
  }, [setConnected, onLog]);
}

export default function Dashboard() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connection, setConnection] = useState('disconnected');
  const [selected, setSelected] = useState(null);
  const [master, setMaster] = useState(null);
  const [analyzing, setAnalyzing] = useState({});
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const refresh = async () => {
    setLoading(true); setError('');
    try { const r = await fetch(`${API_BASE}/api/instances/all`); if (!r.ok) throw new Error(await r.text()); const data = await r.json(); setInstances(data); }
    catch { setError('Backend unavailable'); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (!autoRefresh) return; const iv = setInterval(refresh, 30000); return () => clearInterval(iv); }, [autoRefresh]);
  useSSE(setConnection, (msg) => { if (!msg || !msg.id) return; setInstances((prev) => prev.map((it) => (String(it.id) === String(msg.id) ? { ...it, logs: msg.lines, lastActivityTs: msg.ts } : it))); });

  const analyzeOne = async (id) => {
    setAnalyzing((x) => ({ ...x, [id]: true }));
    try {
      const r = await fetch(`${API_BASE}/api/analyze/instance/${id}`, { method: 'POST' });
      const data = await r.json();
      if (data.error && (data.error.includes('OPENAI_API_KEY') || data.error.includes('API_KEY'))) {
        setError('AI analysis requires OPENAI_API_KEY on server. Set it and restart monitor-server.js');
        return;
      }
      setInstances((prev) => prev.map((it) => (String(it.id) === String(id) ? { ...it, ai: data } : it)));
      if (selected && String(selected.id) === String(id)) openInstance(id);
    }
    catch (e) { setError('AI analysis failed: ' + e.message); }
    finally { setAnalyzing((x) => ({ ...x, [id]: false })); }
  };

  const analyzeMaster = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/analyze/master`, { method: 'POST' });
      const data = await r.json();
      if (data.error && (data.error.includes('OPENAI_API_KEY') || data.error.includes('API_KEY'))) {
        setError('AI analysis requires OPENAI_API_KEY on server. Restart monitor with: export OPENAI_API_KEY=sk-proj-... && MONITOR_PORT=3002 node monitor-server.js');
        setLoading(false);
        return;
      }
      setMaster(data);
    }
    catch (e) { setError('Master analysis failed: ' + e.message); }
    finally { setLoading(false); }
  };
  const openInstance = async (id) => { try { const r = await fetch(`${API_BASE}/api/instance/${id}/status`); const data = await r.json(); setSelected(data); } catch { const it = instances.find((x) => String(x.id) === String(id)); setSelected(it || null); } };
  const addNote = async () => { if (!selected || !noteText.trim()) return; setSavingNote(true); try { await fetch(`${API_BASE}/api/instance/${selected.id}/memory`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: [noteText.trim()] }) }); setNoteText(''); openInstance(selected.id); } finally { setSavingNote(false); } };
  const saveDecisionFromAI = async () => { if (!selected || !selected.ai) return; const ai = selected.ai || {}; const summary = `Status: ${ai.current_status || 'N/A'} | Next: ${ai.next_task || 'N/A'} | Priority: ${ai.priority || 'N/A'}`; try { await fetch(`${API_BASE}/api/instance/${selected.id}/memory`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decisions: [{ summary }] }) }); openInstance(selected.id); } catch {} };

  const connectionIcon = useMemo(() => (connection === 'connected' ? <SignalHigh className="text-green-400" size={16} /> : connection === 'connecting' ? <SignalMedium className="text-yellow-400" size={16} /> : <SignalLow className="text-red-400" size={16} />), [connection]);

  const InstanceCard = ({ item }) => {
    const now = Date.now(); const last = item.lastActivityTs || 0; const minutes = (now - last) / 60000; let live = 'idle'; if (minutes <= 2) live = 'active'; if (item?.ai?.progress === 'blocked') live = 'blocked'; const liveColor = live === 'active' ? 'text-green-400' : live === 'blocked' ? 'text-red-400' : 'text-gray-400';
    const progress = item?.ai?.progress || 'on track'; const prio = item?.ai?.priority || 'medium'; const changedCount = item?.git?.changedFiles?.length || 0; const commits = item?.git?.commitCount || 0; const lastCommit = item?.git?.lastCommit?.subject || 'N/A';
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 hover:border-neutral-700 transition cursor-pointer" onClick={() => openInstance(item.id)}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2"><Layers size={16} className="text-blue-300" /><h3 className="text-white font-semibold">{item.name}</h3></div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1"><GitBranch size={14} /><span>{item.branch}</span><span className="mx-1">•</span><Activity size={14} className={liveColor} /><span className={liveColor}>{live}</span></div>
          </div>
          <div className="flex items-center gap-2"><PriorityBadge priority={prio} /></div>
        </div>
        <div className="mt-4 space-y-3">
          <ProgressBar label="Progress" level={progress} />
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-neutral-800/60 rounded p-2 flex items-center gap-2 text-gray-300"><GitCommit size={14} className="text-blue-300" /><span>{commits} commits</span></div>
            <div className="bg-neutral-800/60 rounded p-2 flex items-center gap-2 text-gray-300"><FileDiff size={14} className="text-purple-300" /><span>{changedCount} changes</span></div>
            <div className="bg-neutral-800/60 rounded p-2 flex items-center gap-2 text-gray-300"><LineChart size={14} className="text-teal-300" /><span>ahead {item?.git?.ahead || 0}</span></div>
          </div>
          <div className="text-xs text-gray-400 truncate">Last: {lastCommit}</div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500" onClick={(e) => { e.stopPropagation(); analyzeOne(item.id); }} disabled={!!analyzing[item.id]}>{analyzing[item.id] ? <Loader2 className="animate-spin" size={14} /> : <Bot size={14} />}Analyze with AI</button>
          <div className="text-[10px] text-gray-500">Updated {minutes.toFixed(1)}m ago</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><h1 className="text-2xl font-semibold text-white">AI Development Dashboard</h1><span className="text-xs px-2 py-1 rounded bg-neutral-800 border border-neutral-700 flex items-center gap-2">{connectionIcon} {connection}</span></div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-500" onClick={analyzeMaster}><Sparkles size={14} /> Master AI Recommendation</button>
            <button className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-neutral-800 text-gray-200 border border-neutral-700 hover:bg-neutral-700" onClick={refresh}><RefreshCw size={14} /> Refresh</button>
            <label className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800"><input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} /> Auto-refresh</label>
          </div>
        </div>

        {error && (<div className="mt-4 p-3 rounded bg-red-900/30 border border-red-800 text-sm flex items-center gap-2"><ShieldAlert className="text-red-400" size={16} />{error} — showing last cached data if available.</div>)}

        {master && (
          <div className="mt-4 p-4 rounded bg-neutral-900 border border-neutral-800">
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 text-white font-medium"><Sparkles size={16} className="text-yellow-300" /> Master Recommendation</div><button className="text-gray-400 hover:text-gray-200" onClick={() => setMaster(null)}><X size={16} /></button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Overall Health:</span> <span className="text-gray-200">{master.overall_health || 'n/a'}</span></div>
              <div><span className="text-gray-400">Critical Path:</span> <span className="text-gray-200">{master.critical_path || 'n/a'}</span></div>
              <div className="md:col-span-2"><div className="text-gray-400">Integration Risks</div><pre className="mt-1 text-gray-200 bg-neutral-950/60 p-2 rounded border border-neutral-800 whitespace-pre-wrap">{Array.isArray(master.integration_risks) ? master.integration_risks.join('\n') : (master.integration_risks || '')}</pre></div>
              <div className="md:col-span-2"><div className="text-gray-400">Bottlenecks</div><pre className="mt-1 text-gray-200 bg-neutral-950/60 p-2 rounded border border-neutral-800 whitespace-pre-wrap">{Array.isArray(master.bottlenecks) ? master.bottlenecks.join('\n') : (master.bottlenecks || '')}</pre></div>
              <div className="md:col-span-2"><div className="text-gray-400">Priority Order</div><pre className="mt-1 text-gray-200 bg-neutral-950/60 p-2 rounded border border-neutral-800 whitespace-pre-wrap">{Array.isArray(master.priority_order) ? master.priority_order.join('\n') : (master.priority_order || '')}</pre></div>
              <div className="md:col-span-2"><div className="text-gray-400">Coordination</div><pre className="mt-1 text-gray-200 bg-neutral-950/60 p-2 rounded border border-neutral-800 whitespace-pre-wrap">{Array.isArray(master.coordination) ? master.coordination.join('\n') : (master.coordination || '')}</pre></div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((it) => (<InstanceCard key={it.id} item={it} />))}
          {instances.length === 0 && !loading && (<div className="text-sm text-gray-400">No instances found. Check configuration.</div>)}
        </div>

        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
            <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-lg" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between"><div className="text-white font-medium flex items-center gap-2"><Layers size={16} className="text-blue-300" /> {selected.name} <span className="text-xs text-gray-500">[{selected.branch}]</span></div><button className="text-gray-400 hover:text-gray-200" onClick={() => setSelected(null)}><X size={16} /></button></div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">AI Analysis</div>
                  <div className="bg-neutral-900/60 rounded p-3 border border-neutral-800 text-sm space-y-1">
                    <div><span className="text-gray-400">Status:</span> {selected?.ai?.current_status || 'N/A'}</div>
                    <div><span className="text-gray-400">Next:</span> {selected?.ai?.next_task || 'N/A'}</div>
                    <div><span className="text-gray-400">Dependencies:</span> {Array.isArray(selected?.ai?.dependencies) ? selected.ai.dependencies.join(', ') : (selected?.ai?.dependencies || 'N/A')}</div>
                    <div><span className="text-gray-400">Blockers:</span> {Array.isArray(selected?.ai?.potential_blockers) ? selected.ai.potential_blockers.join(', ') : (selected?.ai?.potential_blockers || 'None')}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Recent Logs</div>
                  <pre className="bg-neutral-900/60 rounded p-3 border border-neutral-800 h-56 overflow-auto text-xs text-gray-300 whitespace-pre-wrap">{(selected.logs || []).slice(-200).join('\n')}</pre>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Memory: Notes</div>
                  <div className="bg-neutral-900/60 rounded p-3 border border-neutral-800 h-40 overflow-auto text-xs text-gray-300 whitespace-pre-wrap">
                    {(selected?.memory?.notes || []).slice(-20).map((n, idx) => (<div key={idx} className="mb-1">[{new Date(n.ts).toLocaleString()}] {n.text}</div>))}
                    {(!selected?.memory?.notes || selected.memory.notes.length === 0) && (<div className="text-gray-500">No notes yet.</div>)}
                  </div>
                  <div className="flex gap-2"><input className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-gray-200 placeholder:text-gray-500" placeholder="Add a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} /><button className="text-xs px-3 py-1.5 rounded bg-neutral-800 text-gray-200 border border-neutral-700 hover:bg-neutral-700" onClick={addNote} disabled={savingNote || !noteText.trim()}>{savingNote ? 'Saving...' : 'Add Note'}</button></div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Memory: Decisions</div>
                  <div className="bg-neutral-900/60 rounded p-3 border border-neutral-800 h-40 overflow-auto text-xs text-gray-300 whitespace-pre-wrap">
                    {(selected?.memory?.decisions || []).slice(-20).map((d, idx) => (<div key={idx} className="mb-1">[{new Date(d.ts).toLocaleString()}] {d.summary}</div>))}
                    {(!selected?.memory?.decisions || selected.memory.decisions.length === 0) && (<div className="text-gray-500">No decisions yet.</div>)}
                  </div>
                  <div className="flex gap-2"><button className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50" onClick={saveDecisionFromAI} disabled={!selected?.ai}>Save Decision from AI</button></div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-400">Git Diff (vs base)</div>
                  <pre className="bg-neutral-900/60 rounded p-3 border border-neutral-800 h-40 overflow-auto text-xs text-gray-300 whitespace-pre-wrap">{selected?.git?.diffStat || 'No diff'}</pre>
                </div>
              </div>
              <div className="p-4 border-t border-neutral-800 flex items-center justify-end"><button className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500" onClick={() => analyzeOne(selected.id)}><Bot size={14} /> Re-Analyze</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
