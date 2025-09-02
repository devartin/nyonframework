export type ToolInvocation = {
  toolName: string;
  input: unknown;
};

export type ToolResult = {
  toolName: string;
  output: unknown;
  error?: string;
};

export type AgentMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolInvocations?: ToolInvocation[];
};

export type AgentStep = {
  stepId: string;
  timestamp: string;
  inputMessageId: string;
  modelCall?: {
    provider: 'openai';
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    reasoning?: string;
  };
  toolResults?: ToolResult[];
  outputMessageId?: string;
  nextAction?: 'continue' | 'finish' | 'await-webhook';
};

export type AgentRunStatus = 'pending' | 'running' | 'awaiting' | 'completed' | 'failed' | 'cancelled';

export type AgentRun = {
  runId: string;
  agentId: string;
  status: AgentRunStatus;
  createdAt: string;
  updatedAt: string;
  messages: AgentMessage[];
  steps: AgentStep[];
  cursor?: {
    // Opaque checkpoint to resume long workflows in serverless environments
    lastStepId?: string;
    context?: Record<string, unknown>;
  };
};

export type Tool = {
  name: string;
  description: string;
  // Validate and coerce input
  parse: (input: unknown) => unknown;
  // Execute tool logic
  call: (input: unknown) => Promise<unknown>;
};

export type AgentDefinition = {
  id: string;
  name: string;
  model: string;
  systemPrompt?: string;
  tools?: Tool[];
  maxSteps?: number;
};

export interface AgentStateStore {
  createRun(initial: Omit<AgentRun, 'createdAt' | 'updatedAt' | 'status'> & { status?: AgentRunStatus }): Promise<AgentRun>;
  getRun(runId: string): Promise<AgentRun | null>;
  appendMessages(runId: string, messages: AgentMessage[]): Promise<void>;
  appendStep(runId: string, step: AgentStep): Promise<void>;
  setStatus(runId: string, status: AgentRunStatus): Promise<void>;
  setCursor(runId: string, cursor: AgentRun['cursor']): Promise<void>;
}

