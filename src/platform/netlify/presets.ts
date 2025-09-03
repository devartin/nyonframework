import { createClient } from '@supabase/supabase-js';
import { createPresetHelpers } from '../../store/storeFactory.js';

export async function handler(event: any) {
  const params = event.queryStringParameters || {};
  const supabaseUrl = process.env.SUPABASE_URL || params.supabaseUrl || (event.body && JSON.parse(event.body).supabaseUrl);
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || params.supabaseAnonKey || (event.body && JSON.parse(event.body).supabaseAnonKey);
  if (!supabaseUrl || !supabaseAnonKey) return { statusCode: 400, body: JSON.stringify({ error: 'Missing Supabase config' }) };
  const helpers = createPresetHelpers({ supabaseUrl, supabaseAnonKey });
  if (event.httpMethod === 'GET') {
    if (helpers.kind === 'supabase') {
      const client = createClient(String(supabaseUrl), String(supabaseAnonKey), { auth: { persistSession: false } });
      const { data, error } = await client.from('agent_presets').select('*').order('created_at', { ascending: false });
      if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      return { statusCode: 200, body: JSON.stringify({ presets: data }) };
    } else {
      const data = await helpers.store.list();
      return { statusCode: 200, body: JSON.stringify({ presets: data }) };
    }
  }
  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const { name, agentId, model, systemPrompt, tools } = body || {};
    if (!name || !agentId || !model) return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    if (helpers.kind === 'supabase') {
      const client = createClient(String(supabaseUrl), String(supabaseAnonKey), { auth: { persistSession: false } });
      const { data, error } = await client.from('agent_presets').insert({
        name,
        agent_id: agentId,
        model,
        system_prompt: systemPrompt ?? null,
        tools: tools ?? null,
      }).select('*').single();
      if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      return { statusCode: 201, body: JSON.stringify({ preset: data }) };
    } else {
      const saved = await helpers.store.add({ name, agent_id: agentId, model, system_prompt: systemPrompt ?? null, tools: tools ?? null });
      return { statusCode: 201, body: JSON.stringify({ preset: saved }) };
    }
  }
  return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
}

