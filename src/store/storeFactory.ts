import { SupabaseStateStore } from './supabaseStore.js';
import { RedisStateStore, RedisPresetStore } from './redisStore.js';
import type { AgentStateStore } from '../core/types.js';

export function createStateStoreFromEnvOrBody(bodyOrParams: any): AgentStateStore {
  const supabaseUrl = process.env.SUPABASE_URL || bodyOrParams?.supabaseUrl;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || bodyOrParams?.supabaseAnonKey;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || bodyOrParams?.upstashUrl;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || bodyOrParams?.upstashToken;

  if (supabaseUrl && supabaseAnonKey) {
    return new SupabaseStateStore({ url: supabaseUrl, anonKey: supabaseAnonKey });
  }
  if (upstashUrl && upstashToken) {
    return new RedisStateStore({ url: upstashUrl, token: upstashToken });
  }
  throw new Error('No state store configured: provide SUPABASE_* or UPSTASH_*');
}

export function createPresetHelpers(bodyOrParams: any) {
  const supabaseUrl = process.env.SUPABASE_URL || bodyOrParams?.supabaseUrl;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || bodyOrParams?.supabaseAnonKey;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || bodyOrParams?.upstashUrl;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || bodyOrParams?.upstashToken;

  if (supabaseUrl && supabaseAnonKey) {
    return { kind: 'supabase' as const };
  }
  if (upstashUrl && upstashToken) {
    return { kind: 'redis' as const, store: new RedisPresetStore({ url: upstashUrl, token: upstashToken }) };
  }
  throw new Error('No preset store configured: provide SUPABASE_* or UPSTASH_*');
}

