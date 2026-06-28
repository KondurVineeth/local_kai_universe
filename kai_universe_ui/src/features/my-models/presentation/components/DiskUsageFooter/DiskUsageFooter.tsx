import { CopySimple, DotsThree, Gear } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
} from '@shared/ds/primitives';
import { formatBytes } from '@shared/lib/format';
import { useAppSelector } from '@shared/store/hooks';

import { selectInstalledQuantByModel } from '../../store/selectors';

import type { Model } from '@shared/domain/model/entities/Model';
import type { Bytes } from '@shared/domain/primitives/Bytes';

interface DiskUsageFooterProps {
  readonly models: readonly Model[];
}

// Platform-aware models directory. Matches the path pattern RowActionsMenu
// uses for "Copy Absolute Path" so the two surfaces never disagree. The real
// path will come from settings once a directory picker ships.
function modelsDir(): string {
  const isWindows =
    typeof window !== 'undefined' && window.universe?.platform === 'win32';
  return isWindows ? 'C:\\Users\\you\\.zluniverse\\models' : '/Users/you/.zluniverse/models';
}

export function DiskUsageFooter({ models }: DiskUsageFooterProps) {
  const navigate = useNavigate();
  // One subscription, one map. Iterating model-by-model with a hook each
  // would violate rules-of-hooks the moment the installed set changes.
  const quantByModel = useAppSelector(selectInstalledQuantByModel);
  const dir = modelsDir();
  const totalBytes = models.reduce((sum, m) => {
    const quant = quantByModel[m.id];
    const variant = m.variants.find((v) => v.quantization === quant) ?? m.variants[0];
    return sum + Number(variant?.sizeBytes ?? 0n);
  }, 0);

  // Reveal-in-file-manager needs an IPC bridge that isn't wired yet, so it's
  // omitted rather than shipped as a dead item (same call RowActionsMenu
  // makes). Copy + Settings both genuinely work.
  const onCopyPath = () => {
    void navigator.clipboard?.writeText(dir);
  };
  const onConfigure = () => {
    navigate('/settings/model-defaults');
  };

  return (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border-default bg-bg-surface px-4 py-2 text-[10px] text-fg-subtle">
      <span>
        You have {models.length} local model{models.length === 1 ? '' : 's'}, taking up{' '}
        <span className="text-fg-default">
          {formatBytes(totalBytes as unknown as Bytes)}
        </span>{' '}
        of disk space
      </span>
      <div className="flex items-center gap-1">
        <code className="rounded-sm bg-bg-raised px-1.5 py-0.5 font-mono text-fg-default">
          {dir}
        </code>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" iconOnly aria-label="Models directory actions">
              <Icon icon={DotsThree} size="sm" weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuLabel>Models directory</DropdownMenuLabel>
            <DropdownMenuItem onSelect={onCopyPath}>
              <Icon icon={CopySimple} size="xs" />
              <span>Copy directory path</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onConfigure}>
              <Icon icon={Gear} size="xs" />
              <span>Configure storage in Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </footer>
  );
}
