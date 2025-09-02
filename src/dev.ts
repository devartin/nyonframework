import { OpenAI } from 'openai';
import { AgentRuntime } from './core/agent.js';
import { SupabaseStateStore } from './store/supabaseStore.js';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  const openaiKey = process.env.OPENAI_API_KEY!;
  if (!supabaseUrl || !supabaseAnonKey || !openaiKey) {
    console.error('Missing env SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY');
    process.exit(1);
  }
  const store = new SupabaseStateStore({ url: supabaseUrl, anonKey: supabaseAnonKey });
  const openai = new OpenAI({ apiKey: openaiKey });
  const runtime = new AgentRuntime({ store, openai });
  const def = { id: 'dev', name: 'dev', model: 'gpt-4o-mini', systemPrompt: 'You are concise.' } as const;
  const run = await runtime.startRun(def as any, 'Say hello world.');
  const cont = await runtime.continueRun(def as any, run);
  console.log(JSON.stringify({ status: cont.status, messages: cont.messages.slice(-2) }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

