import { Outlet } from 'react-router-dom';

import { selectSecondarySidebarHidden } from '@features/shell';
import { useAppSelector } from '@shared/store/hooks';

import { DeveloperDocsSecondarySidebar } from '../../components/DeveloperDocsSecondarySidebar';

export function DeveloperDocsLayout() {
  const sidebarHidden = useAppSelector(selectSecondarySidebarHidden);
  return (
    <div
      className="grid h-full min-h-0"
      style={{
        gridTemplateColumns: sidebarHidden ? '1fr' : '260px 1fr',
        // Cap the single row at the grid height. Without an explicit row
        // track the implicit row is `auto` and grows to content, so the
        // sidebar's inner ScrollArea (flex-1) never gets a bounded height
        // and the nav list overflows instead of scrolling.
        gridTemplateRows: 'minmax(0, 1fr)',
      }}
    >
      {!sidebarHidden && <DeveloperDocsSecondarySidebar />}
      <main className="min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
