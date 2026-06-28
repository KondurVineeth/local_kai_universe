import type { FolderId } from './Folder';
import type { ThreadId } from '../value-objects/ThreadId';
import type { Iso8601 } from '@shared/domain/primitives/Iso8601';

// A conversation. Lives in chat/domain (not @shared) because no other feature
// reaches into chat threads — promotion to shared would only happen if a
// second feature needed read access.
//
// `messageCount` is denormalized so the chat list can show "(N)" without
// loading every message. Updated atomically when messages append.
export interface Thread {
  readonly id: ThreadId;
  readonly title: string;
  readonly createdAt: Iso8601;
  readonly messageCount: number;
  readonly pinned?: boolean;
  readonly folderId?: FolderId | null;
}
