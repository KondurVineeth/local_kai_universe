import type { Message } from '../entities/Message';

export type ContextOverflowMode =
  | 'truncate-start'
  | 'truncate-middle'
  | 'rolling-window'
  | 'error';

export class ConversationHistoryTrimmer {
  private static readonly CHARS_PER_TOKEN = 4;

  static trim(
    history: readonly Message[],
    maxContextTokens: number,
    mode: ContextOverflowMode,
  ): readonly Message[] {
    const estimateTokens = (messages: readonly Message[]) =>
      messages.reduce(
        (sum, message) =>
          sum +
          Math.ceil(
            message.content.length /
              ConversationHistoryTrimmer.CHARS_PER_TOKEN,
          ),
        0,
      );

    if (estimateTokens(history) <= maxContextTokens) {
      return history;
    }

    switch (mode) {
      case 'truncate-start':
        return this.truncateStart(history, maxContextTokens);

      case 'truncate-middle':
        return this.truncateMiddle(history, maxContextTokens);

    case 'rolling-window':
        return this.truncateStart(history, maxContextTokens);

      case 'error':
        throw new Error(
          'Conversation exceeds model context window.',
        );

      default:
        return history;
    }
  }

  private static truncateStart(
    history: readonly Message[],
    maxTokens: number,
  ): readonly Message[] {
    const trimmed = [...history];

    while (
      trimmed.length > 1 &&
      this.estimate(trimmed) > maxTokens
    ) {
      trimmed.splice(0, 1);
    }

    return trimmed;
  }

  private static truncateMiddle(
    history: readonly Message[],
    maxTokens: number,
  ): readonly Message[] {
    const trimmed = [...history];

    while (
      trimmed.length > 2 &&
      this.estimate(trimmed) > maxTokens
    ) {
      const middle = Math.floor(trimmed.length / 2);
      trimmed.splice(middle, 1);
    }

    return trimmed;
  }

  private static estimate(
    history: readonly Message[],
  ): number {
    return history.reduce(
      (sum, message) =>
        sum +
        Math.ceil(
          message.content.length /
            ConversationHistoryTrimmer.CHARS_PER_TOKEN,
        ),
      0,
    );
  }
}