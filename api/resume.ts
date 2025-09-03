import OpenAI from 'openai';
import { AgentRuntime } from '../src/core/agent.js';
import { createStateStoreFromEnvOrBody } from '../src/store/storeFactory.js';
import type { AgentDefinition } from '../src/core/types.js';

export default async function handler(req: any, res: any) {
	if (req.method !== 'POST') {
		res.status(405).json({ error: 'Method Not Allowed' });
		return;
	}
	let body: any = req.body;
	if (typeof body === 'string') {
		try { body = JSON.parse(body); } catch { body = {}; }
	}
	const { runId, agentId, model, systemPrompt } = body || {};
	if (!runId || !agentId || !model) {
		res.status(400).json({ error: 'Missing required fields' });
		return;
	}
	const store = createStateStoreFromEnvOrBody(body);
	const run = await store.getRun(runId);
	if (!run) {
		res.status(404).json({ error: 'Run not found' });
		return;
	}
	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
	const runtime = new AgentRuntime({ store, openai });
	const def: AgentDefinition = { id: agentId, name: agentId, model, systemPrompt };
	const continued = await runtime.continueRun(def, run);
	res.status(200).json({ runId: continued.runId, status: continued.status, messages: continued.messages });
}

