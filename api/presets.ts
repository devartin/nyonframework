import { createPresetHelpers } from '../src/store/storeFactory.js';

export default async function handler(req: any, res: any) {
  const supabaseUrl = process.env.SUPABASE_URL || req.query?.supabaseUrl || req.body?.supabaseUrl;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || req.query?.supabaseAnonKey || req.body?.supabaseAnonKey;
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(400).json({ error: 'Missing Supabase config' });
    return;
  }
  try {
    const presets = createPresetHelpers({ supabaseUrl, supabaseAnonKey });
    if (req.method === 'GET') {
      if (presets.kind === 'supabase') {
        const { createClient } = await import('@supabase/supabase-js');
        const client = createClient(String(supabaseUrl), String(supabaseAnonKey), { auth: { persistSession: false } });
        const { data, error } = await client.from('agent_presets').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        res.status(200).json({ presets: data });
        return;
      } else {
        const data = await presets.store.list();
        res.status(200).json({ presets: data });
        return;
      }
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { name, agentId, model, systemPrompt, tools } = body || {};
      if (!name || !agentId || !model) return res.status(400).json({ error: 'Missing required fields' });
      if (presets.kind === 'supabase') {
        const { createClient } = await import('@supabase/supabase-js');
        const client = createClient(String(supabaseUrl), String(supabaseAnonKey), { auth: { persistSession: false } });
        const { data, error } = await client.from('agent_presets').insert({
          name,
          agent_id: agentId,
          model,
          system_prompt: systemPrompt ?? null,
          tools: tools ?? null,
        }).select('*').single();
        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json({ preset: data });
        return;
      } else {
        const saved = await presets.store.add({ name, agent_id: agentId, model, system_prompt: systemPrompt ?? null, tools: tools ?? null });
        res.status(201).json({ preset: saved });
        return;
      }
    }
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' });
    return;
  }
  res.status(405).json({ error: 'Method Not Allowed' });
}

