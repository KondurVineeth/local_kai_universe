import { ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

import { Button, Icon } from '@shared/ds/primitives';

import type { ReactNode } from 'react';

// Reusable "feature stub" empty state. Used by Discover / My Models /
// Developer / LM Link until those L1s land. Solves the dead-end-route
// problem (UX rule 1: every screen must answer "what's the one click").
//
// Renders a centered icon, a friendly "Coming in the next sprint" line,
// and a "Back to Chat" button. The receiving feature passes its own
// icon + name via props.
interface ComingSoonProps {
  readonly title: string;
  readonly icon: ReactNode;
  readonly blurb?: string;
}

export function ComingSoon({ title, icon, blurb }: ComingSoonProps) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3xl bg-bg-base px-xl text-center">
      <div className="text-fg-subtle">{icon}</div>
      <div className="flex max-w-md flex-col items-center gap-m">
        <h1 className="text-xl font-bold text-fg-default">{title}</h1>
        <p className="text-sm text-fg-muted">
          {blurb ??
            `${title} is on the roadmap. The Chat surface is the focus this sprint — head back there to start.`}
        </p>
      </div>
      <Button
        variant="primary"
        size="md"
        leadingIcon={<Icon icon={ArrowLeft} size="sm" weight="bold" />}
        onClick={() => navigate('/chat')}
      >
        Back to Chat
      </Button>
    </div>
  );
}
