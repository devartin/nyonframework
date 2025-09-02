export default async function handler(req: any, res: any) {
	if (req.method !== 'GET') {
		res.status(405).json({ error: 'Method Not Allowed' });
		return;
	}
	const runId = req.query?.runId as string | undefined;
	const supabaseUrl = process.env.SUPABASE_URL || (req.query?.supabaseUrl as string) || '';
	const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || (req.query?.supabaseAnonKey as string) || '';
	if (!runId || !supabaseUrl || !supabaseAnonKey) {
		res.status(400).json({ error: 'Missing runId or Supabase config' });
		return;
	}
	const { SupabaseStateStore } = await import('../src/store/supabaseStore.js');
	const store = new SupabaseStateStore({ url: supabaseUrl, anonKey: supabaseAnonKey });
	const run = await store.getRun(runId);
	if (!run) {
		res.status(404).json({ error: 'Run not found' });
		return;
	}
	res.status(200).json({ runId: run.runId, status: run.status, messages: run.messages, steps: run.steps });
}
