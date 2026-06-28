import { DownloadsIndicator } from '../DownloadsIndicator';
import { GlobalModelPicker } from '../GlobalModelPicker';
import { ModeChip } from '../ModeChip';
import { RightPanelToggle } from '../RightPanelToggle';
import { SidebarCollapseToggle } from '../SidebarCollapseToggle';

// LMS-SHELL-004 — Top Header Bar.
//
// IA / hierarchy: the GlobalModelPicker is the dominant element of the header
// (NN/g "make it biggest" — current model is the most important state).
// Window-control affordances flank it on either side, subordinate. The bar
// itself is the macOS drag region (we use `titleBarStyle: 'hiddenInset'`).
//
// The ModeChip sits on the LEFT cluster (next to the sidebar toggle). Mode
// is a global-state indicator — putting it left mirrors macOS conventions
// (status info on the left, action affordances on the right) and keeps the
// model picker visually centered without competition.
//
// macOS traffic lights sit at x:14 with ~58px total width; the left cluster
// needs to clear them or the SidebarCollapseToggle renders under the close
// /min/zoom buttons. We read `window.universe.platform` (exposed by preload)
// so Win/Linux builds — when they ship — get the tighter `pl-2`.
const isMacOS =
  typeof window !== 'undefined' && window.universe?.platform === 'darwin';

export function TopHeaderBar() {
  return (
    <header
      className={`flex h-10 items-center gap-2 border-b border-border-default bg-bg-surface pr-2 ${
        isMacOS ? 'pl-[80px]' : 'pl-2'
      }`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <SidebarCollapseToggle />
        <ModeChip />
      </div>
      <div
        className="ml-auto mr-auto"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <GlobalModelPicker />
      </div>
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <DownloadsIndicator />
        <RightPanelToggle />
      </div>
    </header>
  );
}
