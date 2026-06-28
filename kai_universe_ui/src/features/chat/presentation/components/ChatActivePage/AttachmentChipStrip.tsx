import {
  FileText,
  FolderSimple,
  ImageSquare,
  Paperclip,
  X,
} from '@phosphor-icons/react';

import { Icon } from '@shared/ds/primitives';
import { useAppDispatch } from '@shared/store/hooks';

import { removeAttachment } from '../../store/slice';

import type { Attachment, AttachmentKind } from '../../../domain/entities/Attachment';
import type { ThreadId } from '../../../domain/value-objects/ThreadId';

const ICON_BY_KIND: Record<AttachmentKind, typeof Paperclip> = {
  file: Paperclip,
  image: ImageSquare,
  folder: FolderSimple,
  doc: FileText,
};

interface AttachmentChipStripProps {
  readonly threadId: ThreadId;
  readonly attachments: readonly Attachment[];
  // While a stream is in flight, removing an attachment that's already part of
  // the in-flight prompt would desync the message → chip strip lock-step that
  // the dock displays. AttachFilePopover already gates Add during streaming;
  // this prop closes the asymmetry on the Remove side
  // (BUG-CHAT-COMPOSE-010).
  readonly streaming?: boolean;
}

// Chip strip shown above the input dock. Doubles as the RAG/Document
// indicator when the attachment kind is `doc` — matching ZL Universe's UX
// where attached documents are referenced by the assistant.
export function AttachmentChipStrip({
  threadId,
  attachments,
  streaming = false,
}: AttachmentChipStripProps) {
  const dispatch = useAppDispatch();
  if (attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2">
      {attachments.map((a) => (
        <span
          key={a.id}
          className="inline-flex items-center gap-1 rounded-md bg-bg-raised px-1.5 py-0.5 text-caption text-fg-default"
        >
          <Icon icon={ICON_BY_KIND[a.kind]} size="xs" />
          <span className="max-w-[160px] truncate">{a.name}</span>
          <button
            type="button"
            onClick={() => dispatch(removeAttachment({ threadId, attachmentId: a.id }))}
            aria-label={`Remove ${a.name}`}
            disabled={streaming}
            className="rounded-sm text-fg-subtle hover:text-fg-default disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon icon={X} size="xs" />
          </button>
        </span>
      ))}
    </div>
  );
}
