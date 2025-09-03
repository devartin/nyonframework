import OpenAI from 'openai';
import { AgentRuntime } from '../../core/agent.js';
import { createStateStoreFromEnvOrBody } from '../../store/storeFactory.js';
import type { AgentDefinition } from '../../core/types.js';

export async function handler(event: any) {
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, body: 'Method Not Allowed' };
	}
	const body = JSON.parse(event.body || '{}');
	const { model, userInput, agentId, systemPrompt } = body;
	if (!model || !userInput || !agentId) {
		return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
	}
	const store = createStateStoreFromEnvOrBody(body);
	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
	const runtime = new AgentRuntime({ store, openai });
	const def: AgentDefinition = { id: agentId, name: agentId, model, systemPrompt };
	const run = await runtime.startRun(def, userInput);
	const fresh = await store.getRun(run.runId);
	return { statusCode: 200, body: JSON.stringify({ runId: run.runId, status: fresh?.status ?? 'running' }) };
}

