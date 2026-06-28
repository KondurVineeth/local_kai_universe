// A mock attachment shown as a chip strip above the input. v1 = display only.
// Real upload + indexing land with RAG/Doc work post-deadline.
export type AttachmentKind = 'file' | 'image' | 'folder' | 'doc';

export interface Attachment {
  readonly id: string;
  readonly name: string;
  readonly kind: AttachmentKind;
  readonly sizeBytes?: number;
}
