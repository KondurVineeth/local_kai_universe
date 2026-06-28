import { type ReactNode } from 'react';

import { ScrollArea } from '@shared/ds/primitives';

import { NotesPanel } from './NotesPanel';
import { PresetManager } from './PresetManager';
import { SamplingPanel } from './SamplingPanel';
import { SettingsPanel } from './SettingsPanel';
import { SpeculativeDecodingPanel } from './SpeculativeDecodingPanel';
import { StructuredOutputPanel } from './StructuredOutputPanel';
import { SystemPromptPanel } from './SystemPromptPanel';

// Settings tab — preset manager + collapsible inference panels grouped by
// purpose. Each accordion is its own card (subtle bg, rounded corners) so
// adjacent open panels don't bleed into one wall. Inter-card gap is 8px;
// inter-group gap is larger so PROMPT / GENERATION / ADVANCED / PER-CHAT
// each reads as a discrete region.
export function SettingsTab() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PresetManager />
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-5 px-2 py-3">
          <Group label="Prompt">
            <SystemPromptPanel />
          </Group>
          <Group label="Generation">
            <SettingsPanel />
            <SamplingPanel />
          </Group>
          <Group label="Advanced">
            <StructuredOutputPanel />
            <SpeculativeDecodingPanel />
          </Group>
          <Group label="Per-chat">
            <NotesPanel />
          </Group>
        </div>
      </ScrollArea>
    </div>
  );
}

function Group({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-1 text-caption font-semibold uppercase tracking-wider text-fg-subtle">
        {label}
      </div>
      {children}
    </div>
  );
}
