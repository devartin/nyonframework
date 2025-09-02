import OpenAI from 'openai';
import { AgentRuntime } from '../../core/agent.js';
import { SupabaseStateStore } from '../../store/supabaseStore.js';
import type { AgentDefinition } from '../../core/types.js';

export const runtime = 'nodejs';
export const maxDuration = 60; // adjust via project plan

export async function POST(req: Request): Promise<Response> {
  const { supabaseUrl, supabaseAnonKey, model, userInput, agentId, systemPrompt } = await req.json();
  if (!supabaseUrl || !supabaseAnonKey || !model || !userInput || !agentId) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
  const store = new SupabaseStateStore({ url: supabaseUrl, anonKey: supabaseAnonKey });
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const runtime = new AgentRuntime({ store, openai });
  const def: AgentDefinition = { id: agentId, name: agentId, model, systemPrompt };
  const run = await runtime.startRun(def, userInput);
  const continued = await runtime.continueRun(def, run);
  return new Response(JSON.stringify({ runId: continued.runId, status: continued.status, messages: continued.messages }), {
    headers: { 'content-type': 'application/json' },
  });
}

