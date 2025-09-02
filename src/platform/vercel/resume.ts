import OpenAI from 'openai';
import { AgentRuntime } from '../../core/agent.js';
import { SupabaseStateStore } from '../../store/supabaseStore.js';
import type { AgentDefinition } from '../../core/types.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  const { supabaseUrl, supabaseAnonKey, runId, agentId, model, systemPrompt } = await req.json();
  if (!supabaseUrl || !supabaseAnonKey || !runId || !agentId || !model) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
  const store = new SupabaseStateStore({ url: supabaseUrl, anonKey: supabaseAnonKey });
  const run = await store.getRun(runId);
  if (!run) return new Response(JSON.stringify({ error: 'Run not found' }), { status: 404 });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const runtime = new AgentRuntime({ store, openai });
  const def: AgentDefinition = { id: agentId, name: agentId, model, systemPrompt };
  const continued = await runtime.continueRun(def, run);
  return new Response(JSON.stringify({ runId: continued.runId, status: continued.status, messages: continued.messages }), {
    headers: { 'content-type': 'application/json' },
  });
}

