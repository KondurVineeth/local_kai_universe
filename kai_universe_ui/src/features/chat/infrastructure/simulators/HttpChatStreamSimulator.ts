import type {
  ChatStreamSimulator,
  SimulateOptions,
} from '../../domain/ports/ChatStreamSimulator';

import { ConversationHistoryTrimmer } from '../../domain/services/ConversationHistoryTrimmer';

import type { MessageChunk } from '../../domain/ports/MessageChunk';
import type { Message } from '../../domain/entities/Message';
import type { MessageId } from '../../domain/value-objects/MessageId';
import type { ThreadId } from '../../domain/value-objects/ThreadId';

const API_URL = 'http://127.0.0.1:8000/api/v1/chat';

export class HttpChatStreamSimulator implements ChatStreamSimulator {
  async *simulate(
    _threadId: ThreadId,
    history: readonly Message[],
    _options?: SimulateOptions,
  ): AsyncIterable<MessageChunk> {
    console.log('Simulate options keys:', Object.keys(_options ?? {}));
    console.log('Simulate options:', _options);
    if (!_options?.model) {
      throw new Error('No model selected.');
    }

    const trimmedHistory =
    ConversationHistoryTrimmer.trim(
        history,
        32768,
        _options?.config?.contextOverflow ?? 'truncate-middle',
    );

    const messages: {
      role: string;
      content: string;
    }[] = [];

    // Add system prompt (if provided)
    if (_options?.config?.systemPrompt?.trim()) {
      messages.push({
        role: 'system',
        content: _options.config.systemPrompt,
      });
    }

    // Add conversation history (skip empty assistant placeholder)
    messages.push(
      ...trimmedHistory
        .filter(
          (message) =>
            !(
              message.role === 'assistant' &&
              message.content.trim() === ''
            )
        )
        .map((message) => ({
          role: message.role,
          content: message.content,
        }))
    );

    // Trim conversation according to the selected overflow policy.
    // Replace 32768 with the currently loaded model's context length
    // from the Load configuration.

    const placeholderId = '' as MessageId;
    console.log(
  'Messages sent to backend:',
  messages.map((m) => ({
    role: m.role,
    content: m.content,
  })),
);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: _options.model,
        messages,
        max_completion_tokens: _options?.config?.limitResponseLength ? 1024 : 4096,
        temperature: _options?.config?.temperature ?? 0.6,
        top_p: _options?.config?.topP ?? 0.95,
        top_k: _options?.config?.topK ?? 20,
        repetition_penalty: _options?.config?.repeatPenalty ?? 1.1,
        // TODO:
        // Wire seed from the Load configuration.
        // seed: ...
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Backend request failed (${response.status}): ${errorText}`
      );
    }

    const result = await response.json();

    yield {
      threadId: _threadId,
      messageId: placeholderId,
      kind: 'body',
      delta: result.choices?.[0]?.message?.content ?? '',
      done: false,
    };

    yield {
      threadId: _threadId,
      messageId: placeholderId,
      kind: 'body',
      delta: '',
      done: true,
    };
  }
}