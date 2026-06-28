import { Plus, ShieldCheck, Trash } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

import {
  INTEGRATION_TOOL_CATALOG,
  selectAllowedToolIds,
  toolAllowed,
  toolDisallowed,
} from '@features/settings';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
} from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { PanelLayout, SettingGroup } from '../shared/SettingsPrimitives';

import type { IntegrationToolFixture } from '@features/settings';

export function IntegrationsPanel() {
  return (
    <PanelLayout title="Integrations">
      <ToolCallConfirmationGroup />
    </PanelLayout>
  );
}

function ToolCallConfirmationGroup() {
  const dispatch = useAppDispatch();
  const allowedIds = useAppSelector(selectAllowedToolIds);

  const allowedTools = useMemo(
    () =>
      allowedIds
        .map((id) => INTEGRATION_TOOL_CATALOG.find((t) => t.id === id))
        .filter((t): t is IntegrationToolFixture => t !== undefined),
    [allowedIds],
  );
  const available = useMemo(
    () => INTEGRATION_TOOL_CATALOG.filter((t) => !allowedIds.includes(t.id)),
    [allowedIds],
  );

  return (
    <SettingGroup sectionTitle="Tool Call Confirmation">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm text-fg-default">Tools allowed to run without confirmation</span>
          <span className="text-xs text-fg-subtle">
            Tools added here skip the per-call confirmation prompt during chat.
          </span>
        </div>
        <AddToolMenu
          available={available}
          onAdd={(id) => dispatch(toolAllowed(id))}
        />
      </div>

      {allowedTools.length === 0 ? (
        <div className="border-t border-border-default px-4 py-8 text-center">
          <Icon icon={ShieldCheck} size="lg" />
          <p className="mt-2 text-sm font-medium text-fg-default">No tools allowed yet</p>
          <p className="mt-0.5 text-xs text-fg-subtle">
            Every tool call will ask for confirmation. Add a tool above to let it run automatically.
          </p>
        </div>
      ) : (
        allowedTools.map((tool) => (
          <AllowedToolRow
            key={tool.id}
            tool={tool}
            onRemove={() => dispatch(toolDisallowed(tool.id))}
          />
        ))
      )}
    </SettingGroup>
  );
}

function AddToolMenu({
  available,
  onAdd,
}: {
  readonly available: readonly IntegrationToolFixture[];
  readonly onAdd: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          disabled={available.length === 0}
          leadingIcon={<Icon icon={Plus} size="sm" />}
        >
          Add tool
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Available tools</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {available.length === 0 ? (
          <DropdownMenuItem disabled>All tools already added</DropdownMenuItem>
        ) : (
          available.map((tool) => (
            <DropdownMenuItem key={tool.id} onSelect={() => onAdd(tool.id)}>
              {tool.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AllowedToolRow({
  tool,
  onRemove,
}: {
  readonly tool: IntegrationToolFixture;
  readonly onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border-default px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-bg-raised text-fg-subtle">
          <Icon icon={ShieldCheck} size="sm" />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium text-fg-default">{tool.name}</span>
          <span className="text-xs text-fg-subtle">{tool.description}</span>
        </div>
      </div>
      {confirming ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="danger" size="sm" onClick={onRemove}>
            Remove
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={() => setConfirming(true)}
          aria-label={`Remove ${tool.name}`}
        >
          <Icon icon={Trash} size="sm" />
        </Button>
      )}
    </div>
  );
}
