import { Outlet } from 'react-router-dom';

import { selectSecondarySidebarHidden } from '@features/shell';
import { useAppSelector } from '@shared/store/hooks';

import { MyModelsSecondarySidebar } from '../../components/MyModelsSecondarySidebar';

export function MyModelsLayout() {
  const sidebarHidden = useAppSelector(selectSecondarySidebarHidden);
  return (
    <div
      className="grid h-full min-h-0"
      style={{
        gridTemplateColumns: sidebarHidden ? '1fr' : '260px 1fr',
        // Cap the single row at the grid height — without an explicit row
        // track the implicit row is `auto` and grows to content, so the
        // models table never gets a bounded height and overflows.
        gridTemplateRows: 'minmax(0, 1fr)',
      }}
    >
      {!sidebarHidden && <MyModelsSecondarySidebar />}
      <main className="min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
