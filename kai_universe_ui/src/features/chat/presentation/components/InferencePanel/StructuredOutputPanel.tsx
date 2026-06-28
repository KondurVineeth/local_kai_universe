import { useEffect, useState } from 'react';

import { Switch, Textarea } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { setConfigField } from '../../store/configSlice';
import { selectInferenceConfig } from '../../store/selectors';

import { PanelSection } from './PanelSection';

// Soft cap for the schema textarea — large enough for any realistic JSON
// schema (the OpenAPI schema for OpenAPI itself is ~120k), small enough to
// keep input handling responsive on a paste of "the entire wikipedia" by
// accident. (CONFIG-006)
const SCHEMA_MAX_LENGTH = 200_000;
// Debounce dispatch by ~150ms so a fast keystroke run doesn't fire a
// store-wide replace on every key. The local draft keeps typing snappy.
// (CONFIG-006)
const DISPATCH_DEBOUNCE_MS = 150;

// Reference shows just a labelled toggle in the collapsed/typical state. When
// enabled, a JSON-schema textarea unfolds — mirrors ZL Universe's progressive
// disclosure pattern (Hick's Law: hide the schema until the user opts in).
export function StructuredOutputPanel() {
  const config = useAppSelector(selectInferenceConfig);
  const dispatch = useAppDispatch();
  const summary = config.structuredOutputEnabled ? 'JSON schema enforced' : 'Disabled';
  return (
    <PanelSection panelKey="structuredOutput" title="Structured Output" summary={summary}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-micro text-fg-muted">Structured Output</span>
          <Switch
            checked={config.structuredOutputEnabled}
            onCheckedChange={(v) =>
              dispatch(setConfigField({ key: 'structuredOutputEnabled', value: v }))
            }
            aria-label="Enable structured output"
          />
        </div>
        {config.structuredOutputEnabled && (
          <SchemaEditor
            value={config.structuredOutputSchema}
            onChange={(next) =>
              dispatch(setConfigField({ key: 'structuredOutputSchema', value: next }))
            }
          />
        )}
      </div>
    </PanelSection>
  );
}

interface SchemaEditorProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
}

// CONFIG-005: validate JSON parse on local draft so the user gets an inline
// error indicator the moment a stray comma sneaks in. The store always
// receives the raw text — invalid JSON shouldn't block the user's edit, just
// flag it.
// CONFIG-006: local draft + maxLength + debounced dispatch keeps the input
// snappy when a user pastes a 50k schema.
function SchemaEditor({ value, onChange }: SchemaEditorProps) {
  const [draft, setDraft] = useState(value);

  // External replace (e.g. preset apply) should reset the local draft.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Debounced flush — coalesces a burst of keystrokes into one dispatch.
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChange(draft), DISPATCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);

  const trimmed = draft.trim();
  let parseError: string | null = null;
  if (trimmed.length > 0) {
    try {
      JSON.parse(trimmed);
    } catch (e) {
      parseError = e instanceof Error ? e.message : 'Invalid JSON';
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        rows={6}
        monospace
        value={draft}
        maxLength={SCHEMA_MAX_LENGTH}
        onChange={(e) => setDraft(e.target.value)}
        aria-label="JSON schema"
        aria-invalid={parseError ? true : undefined}
      />
      <div className="flex items-center justify-between text-caption">
        {parseError ? (
          <span className="font-mono text-danger" role="alert">
            JSON parse error: {parseError}
          </span>
        ) : (
          <span className="text-fg-subtle">
            {trimmed.length > 0 ? 'Valid JSON' : 'Empty schema — model output unconstrained'}
          </span>
        )}
        <span className="text-fg-subtle">
          {draft.length.toLocaleString()} / {SCHEMA_MAX_LENGTH.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
