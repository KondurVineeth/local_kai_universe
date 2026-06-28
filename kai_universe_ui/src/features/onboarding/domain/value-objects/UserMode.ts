// ZL Universe's product surface offers two modes (User / Developer) post-2026
// consolidation; we mirror that. `User` shows only the chat interface with
// auto-configured defaults; `Developer` exposes the full inference panel,
// keyboard shortcuts, and advanced chat actions.
//
// The selected mode is captured during onboarding and persisted. Future
// chat-feature gating reads it via the public selector.
export const USER_MODES = ['user', 'developer'] as const;
export type UserMode = (typeof USER_MODES)[number];
