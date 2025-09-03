import { Redis } from '@upstash/redis';
import type { AgentMessage, AgentRun, AgentRunStatus, AgentStateStore, AgentStep } from '../core/types.js';

export type RedisStoreOptions = {
  url: string;
  token: string;
  namespace?: string;
};

export class RedisStateStore implements AgentStateStore {
  private readonly redis: Redis;
  private readonly ns: string;

  constructor(opts: RedisStoreOptions) {
    this.redis = new Redis({ url: opts.url, token: opts.token });
    this.ns = opts.namespace ?? 'nyon';
  }

  private key(runId: string): string { return `${this.ns}:run:${runId}`; }

  async createRun(initial: Omit<AgentRun, 'createdAt' | 'updatedAt' | 'status'> & { status?: AgentRunStatus }): Promise<AgentRun> {
    const now = new Date().toISOString();
    const run: AgentRun = { ...initial, status: initial.status ?? 'pending', createdAt: now, updatedAt: now } as AgentRun;
    await this.redis.set(this.key(run.runId), run);
    return run;
  }

  async getRun(runId: string): Promise<AgentRun | null> {
    const run = await this.redis.get<AgentRun>(this.key(runId));
    return (run as any) ?? null;
  }

  async appendMessages(runId: string, messages: AgentMessage[]): Promise<void> {
    const run = await this.getRun(runId);
    if (!run) throw new Error('Run not found');
    run.messages = [...run.messages, ...messages];
    run.updatedAt = new Date().toISOString();
    await this.redis.set(this.key(runId), run);
  }

  async appendStep(runId: string, step: AgentStep): Promise<void> {
    const run = await this.getRun(runId);
    if (!run) throw new Error('Run not found');
    run.steps = [...run.steps, step];
    run.updatedAt = new Date().toISOString();
    await this.redis.set(this.key(runId), run);
  }

  async setStatus(runId: string, status: AgentRunStatus): Promise<void> {
    const run = await this.getRun(runId);
    if (!run) throw new Error('Run not found');
    run.status = status;
    run.updatedAt = new Date().toISOString();
    await this.redis.set(this.key(runId), run);
  }

  async setCursor(runId: string, cursor: AgentRun['cursor']): Promise<void> {
    const run = await this.getRun(runId);
    if (!run) throw new Error('Run not found');
    run.cursor = cursor;
    run.updatedAt = new Date().toISOString();
    await this.redis.set(this.key(runId), run);
  }
}

export class RedisPresetStore {
  private readonly redis: Redis;
  private readonly ns: string;
  constructor(opts: RedisStoreOptions) {
    this.redis = new Redis({ url: opts.url, token: opts.token });
    this.ns = opts.namespace ?? 'nyon';
  }
  private listKey(): string { return `${this.ns}:presets`; }
  async list(): Promise<any[]> {
    const arr = await this.redis.lrange(this.listKey(), 0, -1);
    return (arr as unknown[]).map((v: unknown) => JSON.parse(String(v)));
  }
  async add(preset: any): Promise<any> {
    await this.redis.lpush(this.listKey(), JSON.stringify(preset));
    return preset;
  }
}

