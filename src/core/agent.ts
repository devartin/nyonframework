import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';
import { randomUUID } from 'crypto';
import { AgentDefinition, AgentMessage, AgentRun, AgentStateStore, AgentStep, Tool } from './types.js';

export type AgentRuntimeDeps = {
  store: AgentStateStore;
  openai: OpenAI;
};

export class AgentRuntime {
  private readonly store: AgentStateStore;
  private readonly openai: OpenAI;

  constructor(deps: AgentRuntimeDeps) {
    this.store = deps.store;
    this.openai = deps.openai;
  }

  async startRun(def: AgentDefinition, userInput: string): Promise<AgentRun> {
    const initialMessages: AgentMessage[] = [];
    if (def.systemPrompt) {
      initialMessages.push({ id: randomUUID(), role: 'system', content: def.systemPrompt });
    }
    initialMessages.push({ id: randomUUID(), role: 'user', content: userInput });

    const run = await this.store.createRun({
      runId: randomUUID(),
      agentId: def.id,
      messages: initialMessages,
      steps: [],
      cursor: {},
      status: 'pending',
    });

    await this.store.setStatus(run.runId, 'running');
    return run;
  }

  async continueRun(def: AgentDefinition, run: AgentRun): Promise<AgentRun> {
    if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
      return run;
    }

    const next = await this.singleStep(def, run);
    await this.store.appendStep(run.runId, next);
    const updatedRun = await this.store.getRun(run.runId);
    if (!updatedRun) throw new Error('Run missing after step');

    if (next.nextAction === 'finish') {
      await this.store.setStatus(run.runId, 'completed');
    } else if (next.nextAction === 'await-webhook') {
      await this.store.setStatus(run.runId, 'awaiting');
    } else {
      await this.store.setStatus(run.runId, 'running');
    }

    return (await this.store.getRun(run.runId))!;
  }

  private async singleStep(def: AgentDefinition, run: AgentRun): Promise<AgentStep> {
    const stepId = randomUUID();
    const startAt = new Date().toISOString();

    // Construct chat messages for OpenAI
    const messages: ChatCompletionMessageParam[] = run.messages
      .filter(m => m.role === 'system' || m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content }));

    const completion = await this.openai.chat.completions.create({
      model: def.model,
      messages,
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const assistantMessage: AgentMessage = {
      id: randomUUID(),
      role: 'assistant',
      content,
    };
    await this.store.appendMessages(run.runId, [assistantMessage]);

    const step: AgentStep = {
      stepId,
      timestamp: startAt,
      inputMessageId: run.messages[run.messages.length - 1]?.id ?? assistantMessage.id,
      modelCall: {
        provider: 'openai',
        model: def.model,
      },
      outputMessageId: assistantMessage.id,
      nextAction: 'finish',
    };

    return step;
  }
}

