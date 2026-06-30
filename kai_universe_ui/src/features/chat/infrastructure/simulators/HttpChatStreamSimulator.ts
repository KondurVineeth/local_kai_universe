import type {
  ChatStreamSimulator,
  SimulateOptions,
} from '../../domain/ports/ChatStreamSimulator';

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

    const messages = [];

    // Add system prompt first (if any)
    if (_options?.config?.systemPrompt?.trim()) {
      messages.push({
        role: 'system',
        content: _options.config.systemPrompt,
      });
    }

    // Add conversation history (skip empty assistant placeholder)
    messages.push(
      ...history
        .filter(
          (message) =>
            !(
              message.role === 'assistant' &&
              message.content.trim() === ''
            ),
        )
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    );

    const placeholderId = '' as MessageId;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: _options?.model ?? 'google/gemma-3-1b-it',

        messages,

        max_completion_tokens:
            _options?.config?.limitResponseLength
                ? 1024
                : 4096,

        temperature:
            _options?.config?.temperature ?? 0.6,

        top_p:
            _options?.config?.topP ?? 0.95,

        top_k:
            _options?.config?.topK ?? 20,

        repetition_penalty:
            _options?.config?.repeatPenalty ?? 1.1,

        // seed:
        //     _options?.loadConfig?.seed ?? null,

        stream: false,
    }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Backend request failed (${response.status}): ${errorText}`,
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