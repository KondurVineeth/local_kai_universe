// Who authored a message in a chat thread. The three values cover the
// chat-completion API contract — `system` (instructions/persona), `user`
// (prompt), `assistant` (model response). `tool` could be added later for
// tool-use rounds; deliberately omitted from Phase 1.
export type MessageRole = 'system' | 'user' | 'assistant';
