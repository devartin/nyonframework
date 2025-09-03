// Vercel's runtime will inject req/res. Avoid importing @vercel/node types to keep deps light.
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
	const { model, userInput, agentId, systemPrompt } = body || {};
	if (!model || !userInput || !agentId) {
		res.status(400).json({ error: 'Missing required fields' });
		return;
	}
	const store = createStateStoreFromEnvOrBody(body);
	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
	const runtime = new AgentRuntime({ store, openai });
	const def: AgentDefinition = { id: agentId, name: agentId, model, systemPrompt };
	const run = await runtime.startRun(def, userInput);
	const continued = await runtime.continueRun(def, run);
	res.status(200).json({ runId: continued.runId, status: continued.status, messages: continued.messages });
}

