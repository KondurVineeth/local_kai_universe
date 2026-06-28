import { Key, Plus, Trash, X } from '@phosphor-icons/react';
import { useState } from 'react';

import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { selectApiTokens } from '../../store/selectors';
import {
  apiTokenCreated,
  apiTokenDeleted,
  apiTokenRevoked,
  manageTokensOpenSet,
} from '../../store/slice';

import type { ApiToken } from '../../store/slice';

// Full-featured Manage API Tokens dialog — list / create / revoke / delete,
// all backed by the local-server slice's seeded fixture tokens. No real
// credentials are minted; secrets are masked previews.
export function ManageTokensDialog() {
  const dispatch = useAppDispatch();
  const tokens = useAppSelector(selectApiTokens);
  const close = () => dispatch(manageTokensOpenSet(false));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={close}
    >
      <div
        className="flex max-h-[80vh] w-[560px] flex-col overflow-hidden rounded-lg border border-border-default bg-bg-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <div className="flex items-center gap-2">
            <Icon icon={Key} size="sm" className="text-fg-muted" />
            <h2 className="text-sm font-semibold text-fg-default">Manage API Tokens</h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-sm p-1 text-fg-subtle hover:bg-bg-active hover:text-fg-default"
          >
            <Icon icon={X} size="xs" weight="bold" />
          </button>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <CreateTokenForm
            onCreate={(label) => dispatch(apiTokenCreated({ label }))}
          />
          <TokenList
            tokens={tokens}
            onRevoke={(id) => dispatch(apiTokenRevoked(id))}
            onDelete={(id) => dispatch(apiTokenDeleted(id))}
          />
        </div>

        <footer className="flex items-center justify-end border-t border-border-default px-5 py-3">
          <Button variant="primary" size="sm" onClick={close}>
            Done
          </Button>
        </footer>
      </div>
    </div>
  );
}

function CreateTokenForm({ onCreate }: { readonly onCreate: (label: string) => void }) {
  const [label, setLabel] = useState('');
  const submit = () => {
    if (!label.trim()) return;
    onCreate(label.trim());
    setLabel('');
  };
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-default bg-bg-base p-3">
      <span className="text-xs font-medium text-fg-default">Create a new token</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Token label, e.g. “Production server”"
          className="flex-1 rounded-md border border-border-strong bg-bg-base px-2.5 py-1.5 text-xs text-fg-default placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="New token label"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={submit}
          disabled={!label.trim()}
          leadingIcon={<Icon icon={Plus} size="xs" />}
        >
          Create
        </Button>
      </div>
      <p className="text-[10px] text-fg-subtle">
        The full secret is shown only once at creation. This mock issues a masked
        preview only.
      </p>
    </div>
  );
}

function TokenList({
  tokens,
  onRevoke,
  onDelete,
}: {
  readonly tokens: readonly ApiToken[];
  readonly onRevoke: (id: string) => void;
  readonly onDelete: (id: string) => void;
}) {
  if (tokens.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-default px-4 py-6 text-center text-xs text-fg-subtle">
        No API tokens yet. Create one above to authenticate requests to the local
        server.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {tokens.map((token) => (
        <TokenRow
          key={token.id}
          token={token}
          onRevoke={() => onRevoke(token.id)}
          onDelete={() => onDelete(token.id)}
        />
      ))}
    </ul>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function TokenRow({
  token,
  onRevoke,
  onDelete,
}: {
  readonly token: ApiToken;
  readonly onRevoke: () => void;
  readonly onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-border-default bg-bg-base px-3 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-medium text-fg-default">
            {token.label}
          </span>
          {token.revoked && (
            <span className="rounded-sm bg-bg-active px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-fg-subtle">
              Revoked
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-fg-subtle">{token.secretPreview}</span>
        <span className="text-[10px] text-fg-subtle">
          Created {formatDate(token.createdAt)} ·{' '}
          {token.lastUsedAt ? `last used ${formatDate(token.lastUsedAt)}` : 'never used'}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!token.revoked && (
          <Button variant="ghost" size="sm" onClick={onRevoke}>
            Revoke
          </Button>
        )}
        <Tooltip content="Delete token" side="left">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onDelete}
            aria-label={`Delete ${token.label}`}
          >
            <Icon icon={Trash} size="xs" />
          </Button>
        </Tooltip>
      </div>
    </li>
  );
}
