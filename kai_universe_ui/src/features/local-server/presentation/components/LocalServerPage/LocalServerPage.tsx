import { ScrollArea } from '@shared/ds/primitives';
import { useAppSelector } from '@shared/store/hooks';
import { useServerStatusPolling } from "../../hooks";
import {
  selectManageTokensOpen,
  selectMcpJsonOpen,
  selectServerSettingsOpen,
} from '../../store/selectors';
import { DeveloperLogsSection } from '../DeveloperLogsSection';
import { LoadedModelsSection } from '../LoadedModelsSection';
import { LocalServerTopBar } from '../LocalServerTopBar';
import { ManageTokensDialog } from '../ManageTokensDialog';
import { McpJsonDialog } from '../McpJsonDialog';
import { ServerSettingsPopover } from '../ServerSettingsPopover';
import { SupportedEndpointsSection } from '../SupportedEndpointsSection';

export function LocalServerPage() {
  useServerStatusPolling();
  const serverSettingsOpen = useAppSelector(selectServerSettingsOpen);
  const mcpJsonOpen = useAppSelector(selectMcpJsonOpen);
  const manageTokensOpen = useAppSelector(selectManageTokensOpen);

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <LocalServerTopBar />
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            <LoadedModelsSection />
            <SupportedEndpointsSection />
            <DeveloperLogsSection />
          </div>
        </ScrollArea>
      </div>

      {serverSettingsOpen && <ServerSettingsPopover />}
      {mcpJsonOpen && <McpJsonDialog />}
      {manageTokensOpen && <ManageTokensDialog />}
    </div>
  );
}
