import { Hammer } from '@phosphor-icons/react';

import { selectOnboardingMode } from '@features/onboarding';
import { setRightPanelOpenForRoute } from '@features/shell';
import {
  Button,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  Tooltip,
} from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { setInferenceTab, toggleIntegration } from '../../store/configSlice';
import {
  selectAvailableIntegrations,
  selectEnabledIntegrationIds,
} from '../../store/selectors';

export function IntegrationsPopover() {
  const available = useAppSelector(selectAvailableIntegrations);
  const enabled = useAppSelector(selectEnabledIntegrationIds);
  const mode = useAppSelector(selectOnboardingMode);
  const dispatch = useAppDispatch();
  const enabledCount = enabled.length;
  const isUser = mode === 'user';
  return (
    <Popover>
      <Tooltip content={enabledCount > 0 ? `${enabledCount} active` : 'Plugins'} side="top">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" iconOnly aria-label="Plugins">
            <Icon icon={Hammer} size="sm" />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent side="top" align="start" className="w-72 p-1">
        <div className="px-2 py-1.5 text-caption font-semibold uppercase tracking-wide text-fg-subtle">
          Plugins
        </div>
        {available.length === 0 ? (
          <div className="flex flex-col gap-2 px-2 py-2">
            <p className="text-caption text-fg-subtle">
              {isUser
                ? 'No plugins installed. Developer mode is required to manage plugins.'
                : 'No plugins installed yet.'}
            </p>
            {!isUser && (
              // UX-CHAT-029: the empty state used to be a dead-end. Give it a
              // clickable path to the Integrations tab where plugins install.
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  dispatch(setRightPanelOpenForRoute({ route: 'chat', open: true }));
                  dispatch(setInferenceTab('integrations'));
                }}
              >
                Open Integrations
              </Button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {available.map((plugin) => (
              <li
                key={plugin.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg-raised"
              >
                <div className="flex flex-1 flex-col">
                  <span className="text-xs text-fg-default">{plugin.name}</span>
                  <span className="text-caption text-fg-subtle">{plugin.description}</span>
                </div>
                <Switch
                  checked={enabled.includes(plugin.id)}
                  onCheckedChange={() => dispatch(toggleIntegration(plugin.id))}
                  aria-label={`Toggle ${plugin.name}`}
                />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
