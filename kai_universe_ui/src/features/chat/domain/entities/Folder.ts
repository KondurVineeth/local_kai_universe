export type FolderId = string & { readonly __brand: 'FolderId' };

// Curated palette for folder color tags. `null` (or absent) means no tag;
// the folder icon falls back to the default muted color.
export type FolderColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink';

// A folder is a flat grouping for threads in the sidebar. Drag/move via the
// row-actions menu in v1; nested folders are out of scope.
export interface Folder {
  readonly id: FolderId;
  readonly name: string;
  readonly expanded: boolean;
  // Optional accent. Persisted via the chat slice; absence renders the
  // default muted folder icon. UI is set/cleared from the row's "Color"
  // submenu.
  readonly color?: FolderColor | null;
}
