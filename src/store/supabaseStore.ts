import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AgentMessage, AgentRun, AgentRunStatus, AgentStateStore, AgentStep } from '../core/types.js';

export type SupabaseStoreOptions = {
  url: string;
  anonKey: string;
};

export class SupabaseStateStore implements AgentStateStore {
  private readonly client: SupabaseClient;

  constructor(opts: SupabaseStoreOptions) {
    this.client = createClient(opts.url, opts.anonKey, {
      auth: { persistSession: false },
    });
  }

  async createRun(initial: Omit<AgentRun, 'createdAt' | 'updatedAt' | 'status'> & { status?: AgentRunStatus }): Promise<AgentRun> {
    const now = new Date().toISOString();
    const payload: AgentRun = {
      ...initial,
      status: initial.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    };
    const { error } = await this.client.from('agent_runs').insert({
      run_id: payload.runId,
      agent_id: payload.agentId,
      status: payload.status,
      created_at: payload.createdAt,
      updated_at: payload.updatedAt,
      messages: payload.messages,
      steps: payload.steps,
      cursor: payload.cursor ?? null,
    });
    if (error) throw error;
    return payload;
  }

  async getRun(runId: string): Promise<AgentRun | null> {
    const { data, error } = await this.client.from('agent_runs').select('*').eq('run_id', runId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      runId: data.run_id,
      agentId: data.agent_id,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      messages: data.messages ?? [],
      steps: data.steps ?? [],
      cursor: data.cursor ?? undefined,
    } satisfies AgentRun;
  }

  async appendMessages(runId: string, messages: AgentMessage[]): Promise<void> {
    const { data, error } = await this.client.from('agent_runs').select('messages').eq('run_id', runId).single();
    if (error) throw error;
    const next = [...(data?.messages ?? []), ...messages];
    const { error: upErr } = await this.client
      .from('agent_runs')
      .update({ messages: next, updated_at: new Date().toISOString() })
      .eq('run_id', runId);
    if (upErr) throw upErr;
  }

  async appendStep(runId: string, step: AgentStep): Promise<void> {
    const { data, error } = await this.client.from('agent_runs').select('steps').eq('run_id', runId).single();
    if (error) throw error;
    const next = [...(data?.steps ?? []), step];
    const { error: upErr } = await this.client
      .from('agent_runs')
      .update({ steps: next, updated_at: new Date().toISOString() })
      .eq('run_id', runId);
    if (upErr) throw upErr;
  }

  async setStatus(runId: string, status: AgentRunStatus): Promise<void> {
    const { error } = await this.client
      .from('agent_runs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('run_id', runId);
    if (error) throw error;
  }

  async setCursor(runId: string, cursor: AgentRun['cursor']): Promise<void> {
    const { error } = await this.client
      .from('agent_runs')
      .update({ cursor, updated_at: new Date().toISOString() })
      .eq('run_id', runId);
    if (error) throw error;
  }
}

