import { ArrowLeft, ArrowRight, CaretRight, Copy, MonitorPlay, Terminal, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';

import { APP_URLS } from '@shared/config/appUrls';
import { Badge, Button, Icon } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectWizardStep } from '../../store/selectors';
import {
  wizardClosed,
  wizardStepChanged,
} from '../../store/slice';
import { scheduleSimulatedPeerThunk } from '../../store/thunks';

import type { RemoteWizardStep } from '../../store/slice';

// Three-step wizard, modelled as a single modal that swaps its body:
//   choose-type — pick GUI or headless (single screen, two cards)
//   gui         — three-step instruction list with copy fields
//   headless    — three-step instruction list with copy fields
//
// "Close" from an instruction step schedules a peer-spawn so the user
// sees the device appear 3-5s later (mock realism). Close from the
// choose-type step is a pure cancel — no spawn — because the user
// hasn't actually "set up" anything yet.
export function AddDeviceWizard() {
  const step = useAppSelector(selectWizardStep);
  const dispatch = useAppDispatch();

  // Closing the wizard. From an instruction step it schedules a
  // peer-spawn (mock realism); from choose-type it's a pure cancel.
  // Memoised so the Escape-key effect can depend on it without
  // re-binding the listener on every render.
  const closeWizard = useCallback(() => {
    if (step === 'gui' || step === 'headless') {
      dispatch(scheduleSimulatedPeerThunk(step));
    }
    dispatch(wizardClosed());
  }, [step, dispatch]);

  // Escape routes through `closeWizard` (not a bare `wizardClosed`) so it
  // behaves identically to the Close button and backdrop click — i.e. it
  // still schedules the peer-spawn from an instruction step. Previously
  // Escape silently skipped the spawn, so the promised device never came.
  useEffect(() => {
    if (step === 'closed') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWizard();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, closeWizard]);

  if (step === 'closed') return null;

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Add a device"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={closeWizard}
    >
      <div
        className="w-[min(720px,calc(100vw-32px))] max-h-[calc(100vh-64px)] overflow-hidden rounded-lg border border-border-default bg-bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Header step={step} onClose={closeWizard} />
        <div className="px-2xl py-3xl">
          <StepBody step={step} />
        </div>
        <Footer step={step} onClose={closeWizard} />
      </div>
    </div>
  );
}

// Title bar carries the step indicator on instruction steps so the user
// knows where they are without needing a separate stepper component.
// On the choose-type step the indicator is dropped — there's only one
// screen, so a "1/1" pill would be noise.
function Header({
  step,
  onClose,
}: {
  readonly step: RemoteWizardStep;
  readonly onClose: () => void;
}) {
  const showIndicator = step === 'gui' || step === 'headless';
  return (
    <header className="flex items-center justify-between border-b border-border-default px-2xl py-l">
      <div className="flex items-center gap-m">
        <span className="text-sm font-semibold text-fg-default">Add a device</span>
        {showIndicator && (
          <span className="rounded-full bg-bg-raised px-m py-xs text-caption text-fg-subtle">
            {step === 'gui' ? 'GUI setup' : 'Headless setup'}
          </span>
        )}
      </div>
      <Button variant="ghost" size="sm" iconOnly aria-label="Close" onClick={onClose}>
        <Icon icon={X} size="sm" />
      </Button>
    </header>
  );
}

function StepBody({ step }: { readonly step: RemoteWizardStep }) {
  if (step === 'choose-type') return <ChooseTypeStep />;
  if (step === 'gui') return <GuiStep />;
  if (step === 'headless') return <HeadlessStep />;
  return null;
}

function ChooseTypeStep() {
  const dispatch = useAppDispatch();
  const [pick, setPick] = useState<'gui' | 'headless'>('gui');
  return (
    <div className="flex flex-col gap-2xl">
      <div className="flex flex-col gap-m">
        <h2 className="text-xl font-semibold text-fg-default">Add a remote machine</h2>
        <p className="text-sm text-fg-muted">
          End-to-end encrypted tunneling between your devices. Run models on one device and access them from another.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-l">
        <PickCard
          icon={MonitorPlay}
          title="My other device has a GUI"
          body="The device runs a graphical desktop and can launch the Universe app."
          selected={pick === 'gui'}
          onSelect={() => setPick('gui')}
        />
        <PickCard
          icon={Terminal}
          title="My other device is headless"
          body="For servers or machines without a screen. Requires terminal access only."
          badge="Advanced"
          selected={pick === 'headless'}
          onSelect={() => setPick('headless')}
        />
      </div>
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          onClick={() => dispatch(wizardStepChanged(pick))}
          trailingIcon={<Icon icon={ArrowRight} size="xs" weight="bold" />}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

interface PickCardProps {
  readonly icon: typeof MonitorPlay;
  readonly title: string;
  readonly body: string;
  readonly badge?: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

// Trimmed to 3 elements per card: icon (+optional badge), title, body.
// Earlier version had a duplicate "headline" sandwiched between title
// and body that re-stated what the icon already conveyed. 3 reads
// better than 4 by the rule of 3.
function PickCard({ icon, title, body, badge, selected, onSelect }: PickCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group flex flex-col items-start gap-l rounded-md border p-xl text-left transition-colors',
        selected
          ? 'border-accent bg-bg-raised'
          : 'border-border-default bg-bg-base hover:border-fg-subtle',
      )}
    >
      <div className="flex w-full items-start justify-between">
        <Icon icon={icon} size="md" className="text-fg-muted" />
        {badge && <Badge tone="accent">{badge}</Badge>}
      </div>
      <h3 className="text-sm font-semibold text-fg-default">{title}</h3>
      <p className="text-xs text-fg-muted">{body}</p>
    </button>
  );
}

function GuiStep() {
  return (
    <div className="flex flex-col gap-xl">
      <h2 className="text-xl font-semibold text-fg-default">
        Add a device to your Remote network
      </h2>
      <ol className="flex flex-col gap-2xl">
        <NumberedStep
          idx={1}
          title="Install Universe on the other device"
          body="Visit the download page and run the installer."
        >
          <CopyField value={APP_URLS.download} />
        </NumberedStep>
        <NumberedStep
          idx={2}
          title="Enable Remote on that device"
          body={
            <>Open <span className="font-mono text-fg-default">Remote</span> in the sidebar and follow its setup.</>
          }
        />
        <NumberedStep
          idx={3}
          title="They&rsquo;ll connect automatically"
          body="Once enabled, your devices find each other and appear here."
        />
      </ol>
    </div>
  );
}

function HeadlessStep() {
  return (
    <div className="flex flex-col gap-xl">
      <h2 className="text-xl font-semibold text-fg-default">
        Add a device to your Remote network
      </h2>
      <ol className="flex flex-col gap-2xl">
        <NumberedStep idx={1} title="Install Universe CLI on the new device">
          <CopyField value={APP_URLS.installScript} />
        </NumberedStep>
        <NumberedStep idx={2} title="Log in and enable Remote">
          <CopyField value="universe login" />
          <CopyField value="universe remote enable" />
        </NumberedStep>
        <NumberedStep
          idx={3}
          title="That&rsquo;s it"
          body="Your devices find each other and appear here."
        />
      </ol>
    </div>
  );
}

interface NumberedStepProps {
  readonly idx: number;
  readonly title: string;
  readonly body?: React.ReactNode;
  readonly children?: React.ReactNode;
}

// Step row composition: a circular numeral chip serves as the row's
// leading rail, title sits on the baseline, body and copy-fields stack
// underneath. The numeral chip is large enough to anchor the eye on
// dense modal surfaces — the earlier "1." caption-text version was lost
// against the title weight. Indent (pl-3xl) aligns body/copy content
// with the title text edge, not the numeral.
function NumberedStep({ idx, title, body, children }: NumberedStepProps) {
  return (
    <li className="flex gap-l">
      <span
        aria-hidden
        className="mt-xs flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-raised text-xs font-semibold text-fg-default"
      >
        {idx}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-m">
        <p className="text-sm font-semibold text-fg-default">{title}</p>
        {body && <p className="text-xs text-fg-muted">{body}</p>}
        {children && <div className="flex flex-col gap-s">{children}</div>}
      </div>
    </li>
  );
}

function CopyField({ value }: { readonly value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    void navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex items-center justify-between gap-m rounded-md border border-border-default bg-bg-base px-l py-m">
      <code className="truncate font-mono text-xs text-fg-default">{value}</code>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        onClick={onCopy}
      >
        <Icon icon={Copy} size="sm" />
      </Button>
    </div>
  );
}

function Footer({ step, onClose }: { readonly step: RemoteWizardStep; readonly onClose: () => void }) {
  const dispatch = useAppDispatch();
  if (step === 'choose-type') return null;
  return (
    <footer className="flex items-center justify-between border-t border-border-default px-2xl py-m">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => dispatch(wizardStepChanged('choose-type'))}
        leadingIcon={<Icon icon={ArrowLeft} size="xs" />}
      >
        Back
      </Button>
      <Button
        variant="primary"
        size="md"
        onClick={onClose}
        trailingIcon={<Icon icon={CaretRight} size="xs" weight="bold" />}
      >
        Close
      </Button>
    </footer>
  );
}
