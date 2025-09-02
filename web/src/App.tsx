import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

type StartResponse = { runId: string; status: string } | { runId: string; status: string; messages?: unknown };

type RunResponse = { runId: string; status: string; messages: Message[] };

function classNames(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

export default function App() {
	const [provider, setProvider] = useState<'netlify' | 'vercel'>('netlify');
	const [supabaseUrl, setSupabaseUrl] = useState<string>('');
	const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>('');
	const [model, setModel] = useState<string>('gpt-4o-mini');
	const [systemPrompt, setSystemPrompt] = useState<string>('You are a helpful, concise assistant.');
	const [agentId, setAgentId] = useState<string>('playground');
	const [runId, setRunId] = useState<string>('');
	const [input, setInput] = useState<string>('');
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
	}, [messages]);

	const baseApi = useMemo(() => {
		return provider === 'netlify' ? '' : '';
	}, [provider]);

	const apiPaths = useMemo(() => {
		if (provider === 'netlify') {
			return {
				start: '/.netlify/functions/start',
				resume: '/.netlify/functions/resume',
				run: '/.netlify/functions/run',
				message: '/.netlify/functions/message',
			};
		}
		return {
			start: '/api/start',
			resume: '/api/resume',
			run: '/api/run',
			message: '/api/message',
		};
	}, [provider]);

	const refreshRun = useCallback(async (id: string) => {
		const u = new URL(baseApi + apiPaths.run, window.location.origin);
		u.searchParams.set('runId', id);
		if (supabaseUrl) u.searchParams.set('supabaseUrl', supabaseUrl);
		if (supabaseAnonKey) u.searchParams.set('supabaseAnonKey', supabaseAnonKey);
		const resp = await fetch(u.toString());
		if (!resp.ok) return;
		const data: RunResponse = await resp.json();
		setMessages(data.messages || []);
	}, [baseApi, apiPaths.run, supabaseUrl, supabaseAnonKey]);

	const startRun = useCallback(async (userInput: string) => {
		setLoading(true);
		try {
			const resp = await fetch(baseApi + apiPaths.start, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ supabaseUrl, supabaseAnonKey, model, agentId, userInput, systemPrompt }),
			});
			if (!resp.ok) throw new Error(`Start failed: ${resp.status}`);
			const data: StartResponse = await resp.json();
			setRunId((data as any).runId);
			await refreshRun((data as any).runId);
		} finally {
			setLoading(false);
		}
	}, [supabaseUrl, supabaseAnonKey, model, agentId, systemPrompt, baseApi, apiPaths.start, refreshRun]);

	const sendMessage = useCallback(async (userInput: string) => {
		setLoading(true);
		try {
			const resp = await fetch(baseApi + apiPaths.message, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ supabaseUrl, supabaseAnonKey, model, agentId, runId, systemPrompt, userInput }),
			});
			if (!resp.ok) throw new Error(`Message failed: ${resp.status}`);
			await refreshRun(runId);
		} finally {
			setLoading(false);
		}
	}, [supabaseUrl, supabaseAnonKey, model, agentId, runId, systemPrompt, baseApi, apiPaths.message, refreshRun]);

	const resumeRun = useCallback(async () => {
		if (!runId) return;
		setLoading(true);
		try {
			const resp = await fetch(baseApi + apiPaths.resume, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ supabaseUrl, supabaseAnonKey, agentId, model, runId, systemPrompt }),
			});
			if (!resp.ok) throw new Error(`Resume failed: ${resp.status}`);
			await refreshRun(runId);
		} finally {
			setLoading(false);
		}
	}, [runId, supabaseUrl, supabaseAnonKey, agentId, model, baseApi, apiPaths.resume, systemPrompt, refreshRun]);

	const onSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;
		if (!runId) {
			await startRun(input.trim());
		} else {
			await sendMessage(input.trim());
		}
		setInput('');
	}, [input, runId, startRun, sendMessage]);

	return (
		<div className="h-screen w-screen bg-neutral-950 text-neutral-100 grid grid-cols-12">
			<aside className="col-span-3 border-r border-neutral-800 p-6 space-y-6">
				<h1 className="text-2xl font-semibold">Nyon Agents</h1>
				<div className="space-y-3">
					<label className="block text-sm text-neutral-400">Provider</label>
					<select className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2" value={provider} onChange={e => setProvider(e.target.value as any)}>
						<option value="netlify">Netlify</option>
						<option value="vercel">Vercel</option>
					</select>
				</div>
				<div className="space-y-3">
					<label className="block text-sm text-neutral-400">Supabase URL</label>
					<input className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2" placeholder="https://xyz.supabase.co" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} />
					<label className="block text-sm text-neutral-400">Supabase anon key</label>
					<input className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2" placeholder="eyJ..." value={supabaseAnonKey} onChange={e => setSupabaseAnonKey(e.target.value)} />
				</div>
				<div className="space-y-3">
					<label className="block text-sm text-neutral-400">Agent ID</label>
					<input className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2" value={agentId} onChange={e => setAgentId(e.target.value)} />
					<label className="block text-sm text-neutral-400">Model</label>
					<input className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2" value={model} onChange={e => setModel(e.target.value)} />
					<label className="block text-sm text-neutral-400">System Prompt</label>
					<textarea className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 h-28" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} />
				</div>
				<div className="space-y-3">
					<button className="w-full bg-brand-600 hover:bg-brand-500 transition rounded px-4 py-2" disabled={!runId} onClick={resumeRun}>Resume</button>
					<button className="w-full bg-neutral-800 hover:bg-neutral-700 transition rounded px-4 py-2" onClick={() => runId && refreshRun(runId)}>Refresh</button>
				</div>
				<p className="text-xs text-neutral-500">Set OPENAI_API_KEY on your platform. Optionally set SUPABASE_URL and SUPABASE_ANON_KEY as env to avoid passing in requests.</p>
			</aside>
			<main className="col-span-9 flex flex-col h-full">
				<div ref={listRef} className="flex-1 overflow-auto p-6 space-y-4">
					{messages.map(m => (
						<div key={m.id} className={classNames('max-w-3xl', m.role === 'user' ? 'ml-auto' : '')}>
							<div className={classNames('rounded-2xl px-4 py-3', m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-neutral-900 border border-neutral-800')}>{m.content}</div>
						</div>
					))}
					{loading && <div className="text-neutral-500 text-sm">Thinking…</div>}
				</div>
				<form onSubmit={onSubmit} className="p-6 border-t border-neutral-800 flex gap-3">
					<input className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-4 py-3" placeholder="Send a message" value={input} onChange={e => setInput(e.target.value)} />
					<button className="bg-brand-600 hover:bg-brand-500 transition rounded px-6 py-3" disabled={loading || !supabaseUrl || !supabaseAnonKey}>Send</button>
				</form>
			</main>
		</div>
	);
}
