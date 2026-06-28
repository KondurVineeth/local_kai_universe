import { Outlet } from 'react-router-dom';

import { SettingsSecondarySidebar } from '../../components/SettingsSecondarySidebar';

export function SettingsLayout() {
  return (
    <div
      className="grid h-full min-h-0"
      style={{
        gridTemplateColumns: '260px 1fr',
        // Cap the single row at the grid height — without an explicit row
        // track the implicit row is `auto` and grows to content, so the
        // panel body's scroll region never gets a bounded height.
        gridTemplateRows: 'minmax(0, 1fr)',
      }}
    >
      <SettingsSecondarySidebar />
      <main className="min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
