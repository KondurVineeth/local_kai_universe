import { createContext, useContext } from 'react';

import type { ChatMessagesStyle, ChatViewMode } from '@features/settings';

// Discrete text-size buckets the 0–100 `chatFontSize` slider maps onto.
// Kept as Tailwind built-in utilities (CLAUDE.md typography rule — no raw
// px, no custom plugin composites).
export type ChatTextSize = 'text-xs' | 'text-sm' | 'text-base' | 'text-lg';

// Maps the abstract 0–100 appearance slider onto a sane, observable text
// scale. Default 50 → `text-sm` (14px, the feed's historical body size).
export function fontSizeToTextClass(fontSize: number): ChatTextSize {
  if (fontSize < 25) return 'text-xs';
  if (fontSize < 63) return 'text-sm';
  if (fontSize < 88) return 'text-base';
  return 'text-lg';
}

// Chat-feature-local appearance settings, resolved once in MessageFeed and
// read by the message rows. Avoids prop-drilling three values through the
// memoized row components (and keeps `messageEqual` untouched).
export interface ChatAppearance {
  readonly textClass: ChatTextSize;
  readonly viewMode: ChatViewMode;
  readonly messagesStyle: ChatMessagesStyle;
}

const DEFAULT_APPEARANCE: ChatAppearance = {
  textClass: 'text-sm',
  viewMode: 'markdown',
  messagesStyle: 'bubble',
};

const ChatAppearanceContext = createContext<ChatAppearance>(DEFAULT_APPEARANCE);

export const ChatAppearanceProvider = ChatAppearanceContext.Provider;

export function useChatAppearance(): ChatAppearance {
  return useContext(ChatAppearanceContext);
}
