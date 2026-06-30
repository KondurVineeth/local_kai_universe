import type {ChatStreamSimulator,SimulateOptions,} from '../../domain/ports/ChatStreamSimulator';
import type { MessageId } from '../../domain/value-objects/MessageId';
import type { MessageChunk } from '../../domain/ports/MessageChunk';
import type { Message } from '../../domain/entities/Message';
import type { ThreadId } from '../../domain/value-objects/ThreadId';

const API_URL = 'http://127.0.0.1:8000/api/v1/chat';

export class HttpChatStreamSimulator implements ChatStreamSimulator {
  async *simulate(
    _threadId: ThreadId,
    history: readonly Message[],
    _options?: SimulateOptions,
  ): AsyncIterable<MessageChunk> {
    const messages = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    const placeholderId = '' as MessageId;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: _options?.model ?? 'google/gemma-3-1b-it',   // use any model that is working
        messages,
        max_completion_tokens: 1024,
        temperature: 0,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend request failed (${response.status}): ${errorText}`);
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