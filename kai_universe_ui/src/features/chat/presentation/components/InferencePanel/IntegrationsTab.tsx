import { DotsThree, MagnifyingGlass, Plus, Trash } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Input,
  Switch,
} from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import {
  installIntegration,
  reconcileIntegrations,
  toggleIntegration,
  uninstallIntegration,
} from '../../store/configSlice';
import {
  selectAvailableIntegrations,
  selectEnabledIntegrationIds,
} from '../../store/selectors';

import { InstallPluginDialog } from './InstallPluginDialog';

export function IntegrationsTab() {
  const available = useAppSelector(selectAvailableIntegrations);
  const enabled = useAppSelector(selectEnabledIntegrationIds);
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState('');
  const [installing, setInstalling] = useState(false);
  // CONFIG-021: drop any persisted enabled ids that no longer point at a
  // known available integration. Idempotent — running on mount is enough.
  useEffect(() => {
    dispatch(reconcileIntegrations());
  }, [dispatch]);
  const filtered = available.filter((i) =>
    i.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );
  return (
    <div className="flex flex-1 flex-col gap-3 p-3">
      <h2 className="px-1 text-caption font-semibold uppercase tracking-wide text-fg-subtle">
        Integrations
      </h2>
      <Button
        variant="secondary"
        size="sm"
        leadingIcon={<Icon icon={Plus} size="sm" />}
        className="w-full"
        onClick={() => setInstalling(true)}
      >
        Install
      </Button>
      <Input
        inputSize="sm"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter plugins..."
        leadingIcon={<Icon icon={MagnifyingGlass} size="sm" />}
        aria-label="Filter integrations"
      />
      {filtered.length === 0 ? (
        <p className="px-2 py-4 text-center text-xs text-fg-subtle">No integrations match.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {filtered.map((i) => (
            <IntegrationRow
              key={i.id}
              integration={i}
              enabled={enabled.includes(i.id)}
              onToggle={() => dispatch(toggleIntegration(i.id))}
              onUninstall={() => dispatch(uninstallIntegration(i.id))}
            />
          ))}
        </ul>
      )}
      {installing && (
        <InstallPluginDialog
          existingNames={available.map((i) => i.name)}
          onCancel={() => setInstalling(false)}
          onInstall={({ name, description }) => {
            dispatch(installIntegration({ name, description }));
            setInstalling(false);
          }}
        />
      )}
    </div>
  );
}

interface IntegrationRowProps {
  readonly integration: { readonly id: string; readonly name: string; readonly description: string; readonly userInstalled?: boolean };
  readonly enabled: boolean;
  readonly onToggle: () => void;
  readonly onUninstall: () => void;
}

function IntegrationRow({ integration, enabled, onToggle, onUninstall }: IntegrationRowProps) {
  return (
    <li className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg-raised">
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        aria-label={`Toggle ${integration.name}`}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs text-fg-default">{integration.name}</span>
        <span className="truncate text-caption text-fg-subtle">{integration.description}</span>
      </div>
      {integration.userInstalled && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" iconOnly aria-label={`More options for ${integration.name}`}>
              <Icon icon={DotsThree} size="sm" weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem onSelect={onUninstall} className="text-danger">
              <Icon icon={Trash} size="xs" />
              <span>Uninstall</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}
