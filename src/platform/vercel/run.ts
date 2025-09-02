import { SupabaseStateStore } from '../../store/supabaseStore.js';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function GET(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const runId = url.searchParams.get('runId');
	const supabaseUrl = process.env.SUPABASE_URL || url.searchParams.get('supabaseUrl') || '';
	const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || url.searchParams.get('supabaseAnonKey') || '';
	if (!runId || !supabaseUrl || !supabaseAnonKey) {
		return new Response(JSON.stringify({ error: 'Missing runId or Supabase config' }), { status: 400 });
	}
	const store = new SupabaseStateStore({ url: supabaseUrl, anonKey: supabaseAnonKey });
	const run = await store.getRun(runId);
	if (!run) return new Response(JSON.stringify({ error: 'Run not found' }), { status: 404 });
	return new Response(JSON.stringify({ runId: run.runId, status: run.status, messages: run.messages, steps: run.steps }), {
		headers: { 'content-type': 'application/json' },
	});
}
