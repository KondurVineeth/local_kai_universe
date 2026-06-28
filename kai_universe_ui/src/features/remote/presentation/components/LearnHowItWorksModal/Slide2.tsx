import { SlideLeft } from './SlideShared';

export function Slide2() {
  return (
    <div className="flex h-full">
      <SlideLeft>
        <div className="flex flex-col gap-m">
          <p className="text-[10px] font-medium uppercase tracking-widest text-fg-subtle">
            Use local models on remote devices
          </p>
          <h2 className="text-xl font-bold text-fg-default">
            Your remote models, as if they were local.
          </h2>
          <p className="text-sm text-fg-subtle leading-relaxed">
            Access models from both your local and remote devices in the model loader.
          </p>
          <p className="text-sm text-fg-subtle leading-relaxed">
            Your chats remain local, while the heavy processing happens on more powerful
            devices you own.
          </p>
        </div>
      </SlideLeft>
      <div className="flex flex-1 items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a3a4a 0%, #0d2233 100%)' }}>
        <ModelPickerMockup />
      </div>
    </div>
  );
}

function ModelPickerMockup() {
  const rows = [
    { name: 'Llama 3.1 8B Instruct', quant: 'Q4_K_M', remote: false },
    { name: 'Gemma 2 27B IT', quant: 'Q5_K_S', remote: true },
    { name: 'Mistral 7B Instruct', quant: 'Q8_0', remote: false },
    { name: 'Qwen2.5 72B Instruct', quant: 'Q4_K_S', remote: true },
  ];
  return (
    <div className="w-72 overflow-hidden rounded-xl bg-bg-surface shadow-2xl">
      <div className="border-b border-border-subtle px-4 py-3">
        <p className="text-xs font-semibold text-fg-muted">Load a Model</p>
      </div>
      <div className="py-2">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between px-4 py-2 hover:bg-bg-raised">
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-xs font-medium text-fg-default">{r.name}</p>
              {r.remote && (
                <p className="text-[10px] text-fg-subtle">Remote device</p>
              )}
            </div>
            <span className="ml-2 shrink-0 rounded bg-bg-raised px-1.5 py-0.5 text-[10px] font-mono text-fg-subtle">
              {r.quant}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
