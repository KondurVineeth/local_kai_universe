import {
  FileArrowUp,
  FilePlus,
  FolderSimplePlus,
  ImageSquare,
  Plus,
} from '@phosphor-icons/react';
import { useRef, useState, type ChangeEvent } from 'react';

import {
  Button,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from '@shared/ds/primitives';
import { useAppDispatch } from '@shared/store/hooks';

import { addAttachment } from '../../store/slice';

import type { Attachment, AttachmentKind } from '../../../domain/entities/Attachment';
import type { ThreadId } from '../../../domain/value-objects/ThreadId';

interface AttachFilePopoverProps {
  readonly threadId: ThreadId;
  readonly disabled?: boolean;
}

function newAttachmentId(): string {
  // crypto.randomUUID is available in Electron renderers (Chromium ≥ 92).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `att_${crypto.randomUUID()}`;
  }
  return `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

// Real OS file picker — clicking a popover item triggers the matching hidden
// `<input type="file">`. The renderer never reads the file's contents (this
// is still a clickable UI clone), but the user picks an actual file and we
// store the real name + size as the attachment chip. Cancelling the picker
// is a no-op (no change event fires).
//
// Folder picking uses Chromium's `webkitdirectory` attribute, which Electron
// supports natively. The first File's `webkitRelativePath` gives the top-
// level folder name we display.
export function AttachFilePopover({ threadId, disabled }: AttachFilePopoverProps) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const refFor = (kind: AttachmentKind) => {
    if (kind === 'image') return imageRef;
    if (kind === 'folder') return folderRef;
    if (kind === 'doc') return docRef;
    return fileRef;
  };

  const onPick = (kind: AttachmentKind) => {
    setOpen(false);
    // Defer one tick so Radix can finish closing before the file dialog
    // opens — without this, the popover's outside-click handler fires on
    // the dialog backdrop and leaves the UI in an odd state on macOS.
    requestAnimationFrame(() => refFor(kind).current?.click());
  };

  const onChange =
    (kind: AttachmentKind) => (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      let attachment: Attachment;
      if (kind === 'folder') {
        const first = files[0]!;
        const folderName = first.webkitRelativePath.split('/')[0] || first.name;
        attachment = {
          id: newAttachmentId(),
          name: `${folderName}/`,
          kind: 'folder',
        };
      } else {
        const file = files[0]!;
        attachment = {
          id: newAttachmentId(),
          name: file.name,
          kind,
          sizeBytes: file.size,
        };
      }
      dispatch(addAttachment({ threadId, attachment }));
      // Reset so picking the same file twice in a row still fires onChange.
      e.target.value = '';
    };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip content="Attach" side="top">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" iconOnly aria-label="Attach file" disabled={disabled}>
            <Icon icon={Plus} size="sm" />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent side="top" align="start" className="w-52 p-1">
        <ul className="flex flex-col">
          <PopoverItem icon={FileArrowUp} label="Upload file" onClick={() => onPick('file')} />
          <PopoverItem icon={ImageSquare} label="Add image" onClick={() => onPick('image')} />
          <PopoverItem icon={FolderSimplePlus} label="Attach folder" onClick={() => onPick('folder')} />
          <PopoverItem icon={FilePlus} label="Add document (RAG)" onClick={() => onPick('doc')} />
        </ul>
      </PopoverContent>
      <HiddenFileInputs
        fileRef={fileRef}
        imageRef={imageRef}
        folderRef={folderRef}
        docRef={docRef}
        onChange={onChange}
      />
    </Popover>
  );
}

// Hidden inputs live outside PopoverContent so they remain mounted even
// after the popover closes — refs need to survive the unmount that
// PopoverContent would otherwise force.
function HiddenFileInputs({
  fileRef,
  imageRef,
  folderRef,
  docRef,
  onChange,
}: {
  readonly fileRef: React.RefObject<HTMLInputElement>;
  readonly imageRef: React.RefObject<HTMLInputElement>;
  readonly folderRef: React.RefObject<HTMLInputElement>;
  readonly docRef: React.RefObject<HTMLInputElement>;
  readonly onChange: (kind: AttachmentKind) => (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <input ref={fileRef} type="file" className="hidden" onChange={onChange('file')} />
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={onChange('image')} />
      <input
        ref={folderRef}
        type="file"
        // webkitdirectory is non-standard but supported in Chromium / Electron.
        // React's TS types don't list it; cast through a record literal.
        {...({ webkitdirectory: '' } as Record<string, string>)}
        className="hidden"
        onChange={onChange('folder')}
      />
      <input
        ref={docRef}
        type="file"
        accept=".pdf,.txt,.md,.docx,.doc"
        className="hidden"
        onChange={onChange('doc')}
      />
    </>
  );
}

function PopoverItem({
  icon,
  label,
  onClick,
}: {
  readonly icon: typeof Plus;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-fg-default hover:bg-bg-raised"
      >
        <Icon icon={icon} size="sm" />
        <span>{label}</span>
      </button>
    </li>
  );
}
