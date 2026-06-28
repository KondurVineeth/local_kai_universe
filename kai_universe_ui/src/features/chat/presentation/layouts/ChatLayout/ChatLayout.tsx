import { Outlet } from 'react-router-dom';

import { selectSecondarySidebarHidden } from '@features/shell';
import { useAppSelector } from '@shared/store/hooks';

import { ChatSecondarySidebar } from '../../components/ChatSecondarySidebar';

export function ChatLayout() {
  const sidebarHidden = useAppSelector(selectSecondarySidebarHidden);
  return (
    <div className="grid h-full min-h-0 grid-cols-[auto_1fr] grid-rows-[minmax(0,1fr)]">
      {/* Animated chat-list sidebar column. Width slides between 260 ↔ 0 px on
          toggle (mirrors the right-panel pattern in AppShellLayout). Always
          rendered so the inner aside can animate; overflow-hidden clips off-screen
          state. ease-out 200ms — Doherty-compliant micro-animation. */}
      <div
        className="overflow-hidden transition-[width] duration-200 ease-out"
        style={{ width: sidebarHidden ? 0 : 260 }}
        aria-hidden={sidebarHidden}
      >
        <ChatSecondarySidebar />
      </div>
      <main className="min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
