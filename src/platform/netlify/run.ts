import { SupabaseStateStore } from '../../store/supabaseStore.js';

export async function handler(event: any) {
	if (event.httpMethod !== 'GET') {
		return { statusCode: 405, body: 'Method Not Allowed' };
	}
	const params = event.queryStringParameters || {};
	const runId = params.runId;
	const supabaseUrl = process.env.SUPABASE_URL || params.supabaseUrl || '';
	const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || params.supabaseAnonKey || '';
	if (!runId || !supabaseUrl || !supabaseAnonKey) {
		return { statusCode: 400, body: JSON.stringify({ error: 'Missing runId or Supabase config' }) };
	}
	const store = new SupabaseStateStore({ url: supabaseUrl, anonKey: supabaseAnonKey });
	const run = await store.getRun(runId);
	if (!run) return { statusCode: 404, body: JSON.stringify({ error: 'Run not found' }) };
	return { statusCode: 200, body: JSON.stringify({ runId: run.runId, status: run.status, messages: run.messages, steps: run.steps }) };
}
