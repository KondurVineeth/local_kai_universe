import { Outlet } from 'react-router-dom';

import { selectSecondarySidebarHidden } from '@features/shell';
import { useAppSelector } from '@shared/store/hooks';

import { DiscoverSecondarySidebar } from '../../components/DiscoverSecondarySidebar';

export function DiscoverLayout() {
  const sidebarHidden = useAppSelector(selectSecondarySidebarHidden);
  return (
    <div
      className="grid h-full min-h-0"
      style={{
        gridTemplateColumns: sidebarHidden ? '1fr' : '260px 1fr',
        // Cap the single row at the grid height — without an explicit row
        // track the implicit row is `auto` and grows to content, so the
        // inner ScrollArea never gets a bounded height and overflows.
        gridTemplateRows: 'minmax(0, 1fr)',
      }}
    >
      {!sidebarHidden && <DiscoverSecondarySidebar />}
      <main className="min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
