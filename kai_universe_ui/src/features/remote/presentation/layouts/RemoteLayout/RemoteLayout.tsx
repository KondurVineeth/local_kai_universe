import { Outlet } from 'react-router-dom';

import { selectSecondarySidebarHidden } from '@features/shell';
import { useAppSelector } from '@shared/store/hooks';

import { AddDeviceWizard } from '../../components/AddDeviceWizard';
import { LearnHowItWorksModal } from '../../components/LearnHowItWorksModal';
import { RemoteBootstrap } from '../../components/RemoteBootstrap';
import { RemoteSecondarySidebar } from '../../components/RemoteSecondarySidebar';
import { ThisDeviceDialog } from '../../components/ThisDeviceDialog';
import { selectAuthStatus } from '../../store/selectors';

// Two-pane geometry inside the feature outlet: left secondary sidebar
// (Network Devices + This device + Personal Network panels) and main
// content. The right rail ("Models on Remote Device") is contributed
// through the shell's `RightPanelPlaceholder`, not rendered here — that
// keeps the global right-column width and toggle logic in one place
// instead of having two stacked right rails in dev mode.
//
// The sidebar is only rendered when the user is authenticated — the
// landing page occupies the full width and has its own layout.
export function RemoteLayout() {
  const sidebarHidden = useAppSelector(selectSecondarySidebarHidden);
  const authStatus = useAppSelector(selectAuthStatus);
  const showSidebar = !sidebarHidden && authStatus === 'authenticated';
  return (
    <div
      className="grid h-full min-h-0"
      style={{
        gridTemplateColumns: showSidebar ? '260px 1fr' : '1fr',
        // Cap the single row at the grid height — without an explicit row
        // track the implicit row is `auto` and grows to content, so the
        // device-detail scroll region never gets a bounded height.
        gridTemplateRows: 'minmax(0, 1fr)',
      }}
    >
      {showSidebar && <RemoteSecondarySidebar />}
      <main className="min-w-0 overflow-hidden">
        <Outlet />
      </main>
      <AddDeviceWizard />
      <ThisDeviceDialog />
      <LearnHowItWorksModal />
      <RemoteBootstrap />
    </div>
  );
}
