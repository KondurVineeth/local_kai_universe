import { describe, expect, it } from 'vitest';

import {
  addAttachment,
  chatReducer,
  clearAttachments,
  clearDraft,
  setDraft,
} from '../../../../src/features/chat/presentation/store/slice';

import type { ThreadId } from '../../../../src/features/chat/domain/value-objects/ThreadId';
import type {
  Attachment,
  ChatState,
} from '../../../../src/features/chat/presentation/store/slice';

const TID = 't_1' as ThreadId;

const initialState: ChatState = {
  threads: [],
  selectedThreadId: null,
  messagesByThread: {},
  folders: [],
  notesByThread: {},
  attachmentsByThread: {},
  draftsByThread: {},
  splitThreadId: null,
  pendingFolderRenameId: null,
  reasoningOpenOverrides: {},
  reasoningOverridesByThread: {},
  notesUpdatedByThread: {},
  multiSelectedThreadIds: {},
};

const att = (id: string, name: string, sizeBytes?: number): Attachment => ({
  id,
  name,
  kind: 'file',
  sizeBytes,
});

describe('chatReducer — composition cluster', () => {
  it('addAttachment dedupes by name + kind + sizeBytes', () => {
    const a = att('a1', 'foo.pdf', 100);
    const b = att('a2', 'foo.pdf', 100); // duplicate by content, distinct id
    const s1 = chatReducer(initialState, addAttachment({ threadId: TID, attachment: a }));
    const s2 = chatReducer(s1, addAttachment({ threadId: TID, attachment: b }));
    expect(s2.attachmentsByThread[TID]).toHaveLength(1);
    expect(s2.attachmentsByThread[TID]?.[0]?.id).toBe('a1');
  });

  it('addAttachment keeps distinct sizes / names as separate entries', () => {
    const a = att('a1', 'foo.pdf', 100);
    const b = att('a2', 'foo.pdf', 200); // different size → not a dupe
    const c = att('a3', 'bar.pdf', 100); // different name → not a dupe
    const s1 = chatReducer(initialState, addAttachment({ threadId: TID, attachment: a }));
    const s2 = chatReducer(s1, addAttachment({ threadId: TID, attachment: b }));
    const s3 = chatReducer(s2, addAttachment({ threadId: TID, attachment: c }));
    expect(s3.attachmentsByThread[TID]).toHaveLength(3);
  });

  it('clearAttachments removes the thread entry entirely', () => {
    const s1 = chatReducer(
      initialState,
      addAttachment({ threadId: TID, attachment: att('a1', 'foo.pdf', 100) }),
    );
    const s2 = chatReducer(s1, clearAttachments(TID));
    expect(s2.attachmentsByThread[TID]).toBeUndefined();
  });

  it('setDraft / clearDraft round-trips per thread', () => {
    const s1 = chatReducer(initialState, setDraft({ threadId: TID, draft: 'hello' }));
    expect(s1.draftsByThread[TID]).toBe('hello');
    const s2 = chatReducer(s1, setDraft({ threadId: TID, draft: 'hi' }));
    expect(s2.draftsByThread[TID]).toBe('hi');
    const s3 = chatReducer(s2, clearDraft(TID));
    expect(s3.draftsByThread[TID]).toBeUndefined();
  });
});
