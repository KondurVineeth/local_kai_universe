import { Outlet } from 'react-router-dom';

import { selectSecondarySidebarHidden } from '@features/shell';
import { useAppSelector } from '@shared/store/hooks';

import { LocalServerSecondarySidebar } from '../../components/LocalServerSecondarySidebar';
import { SyntheticTrafficRunner } from '../../components/SyntheticTrafficRunner';

// The Local Server in-page sidebar shows server vitals, an API catalog
// nav (filters the supported-endpoints panel), and quick actions
// (restart / clear logs / docs). NOT a copy of the PrimaryNavRail — that
// was the previous version's mistake. Hidden when the global sidebar-
// collapse toggle is off.
export function LocalServerLayout() {
  const sidebarHidden = useAppSelector(selectSecondarySidebarHidden);
  return (
    <div
      className="grid h-full min-h-0"
      style={{
        gridTemplateColumns: sidebarHidden ? '1fr' : '260px 1fr',
        // Cap the single row at the grid height — without an explicit row
        // track the implicit row is `auto` and grows to content, so inner
        // scroll regions never get a bounded height.
        gridTemplateRows: 'minmax(0, 1fr)',
      }}
    >
      {!sidebarHidden && <LocalServerSecondarySidebar />}
      <main className="min-w-0 overflow-hidden">
        <Outlet />
      </main>
      <SyntheticTrafficRunner />
    </div>
  );
}
