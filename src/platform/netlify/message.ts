import OpenAI from 'openai';
import { AgentRuntime } from '../../core/agent.js';
import { createStateStoreFromEnvOrBody } from '../../store/storeFactory.js';
import type { AgentDefinition, AgentMessage } from '../../core/types.js';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const body = JSON.parse(event.body || '{}');
  const { runId, agentId, model, systemPrompt, userInput } = body || {};
  if (!runId || !agentId || !model || !userInput) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }
  const store = createStateStoreFromEnvOrBody(body);
  const run = await store.getRun(runId);
  if (!run) return { statusCode: 404, body: JSON.stringify({ error: 'Run not found' }) };
  const userMsg: AgentMessage = { id: crypto.randomUUID(), role: 'user', content: userInput };
  await store.appendMessages(runId, [userMsg]);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const runtime = new AgentRuntime({ store, openai });
  const def: AgentDefinition = { id: agentId, name: agentId, model, systemPrompt };
  const continued = await runtime.continueRun(def, { ...run, messages: [...run.messages, userMsg] });
  return { statusCode: 200, body: JSON.stringify({ runId: continued.runId, status: continued.status, messages: continued.messages }) };
}

