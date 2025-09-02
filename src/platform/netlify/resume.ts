import OpenAI from 'openai';
import { AgentRuntime } from '../../core/agent.js';
import { SupabaseStateStore } from '../../store/supabaseStore.js';
import type { AgentDefinition } from '../../core/types.js';

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { supabaseUrl, supabaseAnonKey, runId, agentId, model, systemPrompt } = JSON.parse(event.body || '{}');
  if (!supabaseUrl || !supabaseAnonKey || !runId || !agentId || !model) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }
  const store = new SupabaseStateStore({ url: supabaseUrl, anonKey: supabaseAnonKey });
  const run = await store.getRun(runId);
  if (!run) return { statusCode: 404, body: JSON.stringify({ error: 'Run not found' }) };
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const runtime = new AgentRuntime({ store, openai });
  const def: AgentDefinition = { id: agentId, name: agentId, model, systemPrompt };
  const continued = await runtime.continueRun(def, run);
  return { statusCode: 200, body: JSON.stringify({ runId: continued.runId, status: continued.status }) };
}

