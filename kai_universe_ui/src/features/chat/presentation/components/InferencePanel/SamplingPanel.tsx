import { Slider, Switch } from '@shared/ds/primitives';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { setConfigField } from '../../store/configSlice';
import { selectInferenceConfig } from '../../store/selectors';

import { PanelSection } from './PanelSection';
import { ValueBox } from './ValueBox';

export function SamplingPanel() {
  const config = useAppSelector(selectInferenceConfig);
  const dispatch = useAppDispatch();
  return (
    <PanelSection
      panelKey="sampling"
      title="Sampling"
      summary={`top-k ${config.topK} · top-p ${config.topPEnabled ? config.topP.toFixed(2) : 'off'}`}
    >
      <div className="flex flex-col gap-3">
        <TopKRow
          value={config.topK}
          onChange={(v) => dispatch(setConfigField({ key: 'topK', value: v }))}
        />
        <ToggleableRow
          label="Repeat Penalty"
          enabled={config.repeatPenaltyEnabled}
          onToggle={(v) => dispatch(setConfigField({ key: 'repeatPenaltyEnabled', value: v }))}
          value={config.repeatPenalty}
          min={1}
          max={2}
          step={0.01}
          format={(n) => n.toFixed(2)}
          onChange={(v) => dispatch(setConfigField({ key: 'repeatPenalty', value: v }))}
        />
        <ToggleableRow
          label="Top P Sampling"
          enabled={config.topPEnabled}
          onToggle={(v) => dispatch(setConfigField({ key: 'topPEnabled', value: v }))}
          value={config.topP}
          min={0}
          max={1}
          step={0.01}
          format={(n) => n.toFixed(2)}
          onChange={(v) => dispatch(setConfigField({ key: 'topP', value: v }))}
        />
        <ToggleableRow
          label="Min P Sampling"
          enabled={config.minPEnabled}
          onToggle={(v) => dispatch(setConfigField({ key: 'minPEnabled', value: v }))}
          value={config.minP}
          min={0}
          max={1}
          step={0.01}
          format={(n) => n.toFixed(2)}
          onChange={(v) => dispatch(setConfigField({ key: 'minP', value: v }))}
        />
      </div>
    </PanelSection>
  );
}

function TopKRow({ value, onChange }: { readonly value: number; readonly onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-micro text-fg-muted">Top K Sampling</span>
        <ValueBox
          value={value}
          min={1}
          max={200}
          step={1}
          onChange={onChange}
          ariaLabel="Top K Sampling"
        />
      </div>
      <Slider value={value} min={1} max={200} step={1} onValueChange={onChange} aria-label="Top K slider" />
    </div>
  );
}

interface ToggleableRowProps {
  readonly label: string;
  readonly enabled: boolean;
  readonly onToggle: (v: boolean) => void;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly format?: (n: number) => string;
  readonly onChange: (v: number) => void;
}

// Enable-toggle row (Top P / Min P / Repeat Penalty). When the checkbox is
// off, the slider+value collapse to keep the panel scannable.
function ToggleableRow({
  label,
  enabled,
  onToggle,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: ToggleableRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-micro text-fg-muted">
          <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Enable ${label}`} />
          <span>{label}</span>
        </span>
        {enabled && (
          <ValueBox
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={onChange}
            format={format}
            ariaLabel={label}
          />
        )}
      </div>
      {enabled && (
        <Slider
          value={value}
          min={min}
          max={max}
          step={step}
          onValueChange={onChange}
          aria-label={`${label} slider`}
        />
      )}
    </div>
  );
}
