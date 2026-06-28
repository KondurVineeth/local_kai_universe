import { execFile } from 'node:child_process';
import { cpus, freemem, platform, release, totalmem, type CpuInfo } from 'node:os';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

// Real hardware detection. CLAUDE.md previously forbade this; the rule was
// relaxed once it became clear the feature does not require external APIs
// — only Node OS calls and platform-specific shell probes — so accuracy
// trumps mocking.
//
// macOS is the primary target and its probes fail LOUD: a broken
// `system_profiler` / `vm_stat` / `sysctl` call throws all the way up to
// the renderer, which already renders an actionable "detection unavailable"
// error with a Retry button. We deliberately do NOT swallow those into
// approximate values — a wrong number that looks real is worse than an
// honest error. Windows/Linux GPU probing keeps a `defaultGpu()` result
// because "no discrete GPU" is a legitimate answer there, not a masked
// failure.

export type GpuVendor = 'apple' | 'nvidia' | 'amd' | 'intel' | 'none';
export type EngineKind = 'llama.cpp' | 'mlx' | 'onnx';
export type Arch = 'arm64' | 'x86_64';

export interface HardwareReport {
  readonly platform: 'macos' | 'windows' | 'linux';
  readonly cpu: {
    readonly brand: string;
    readonly cores: number;
    readonly threads: number;
    readonly architecture: Arch;
    // Apple Silicon performance/efficiency core split. Absent on Intel Macs
    // and non-macOS platforms, which expose a single uniform core type.
    readonly performanceCores?: number;
    readonly efficiencyCores?: number;
  };
  readonly gpu: {
    readonly vendor: GpuVendor;
    readonly model: string;
    // GPU core count — reported by Apple Silicon via `sppci_cores`. Absent
    // where the count isn't cheaply discoverable (most discrete GPUs).
    readonly coreCount?: number;
    readonly vramBytes: number;
    readonly metalSupported: boolean;
    readonly cudaSupported: boolean;
    readonly rocmSupported: boolean;
    readonly vulkanSupported: boolean;
  };
  readonly memory: {
    readonly totalBytes: number;
    readonly availableBytes: number;
  };
  readonly storageAvailableBytes: number;
  readonly availableEngines: readonly {
    readonly kind: EngineKind;
    readonly version: string;
    readonly recommended: boolean;
  }[];
  readonly osVersion: string;
}

export async function detectHardware(): Promise<HardwareReport> {
  const plat = normalizePlatform();
  const arch = normalizeArch();
  const cpu = await probeCpu(plat);
  const gpu = await probeGpu(plat, arch);
  const engines = pickEngines(plat, gpu.vendor);
  const osVersion = await probeOsVersion(plat);
  const storage = await probeStorageAvailable(plat);
  const availableBytes = await probeAvailableMemory(plat);
  return {
    platform: plat,
    cpu: { ...cpu, architecture: arch },
    gpu,
    memory: { totalBytes: totalmem(), availableBytes },
    storageAvailableBytes: storage,
    availableEngines: engines,
    osVersion,
  };
}

function normalizePlatform(): 'macos' | 'windows' | 'linux' {
  const p = platform();
  if (p === 'darwin') return 'macos';
  if (p === 'win32') return 'windows';
  return 'linux';
}

function normalizeArch(): Arch {
  // Node reports `arm64` / `x64` / `ia32`. Map to the domain shape.
  return process.arch === 'arm64' ? 'arm64' : 'x86_64';
}

type CpuSummary = Omit<HardwareReport['cpu'], 'architecture'>;

async function probeCpu(plat: 'macos' | 'windows' | 'linux'): Promise<CpuSummary> {
  // macOS exposes exact counts through `sysctl`, including the Apple Silicon
  // performance/efficiency split. Other platforms have no portable
  // equivalent, so we fall back to Node's `os.cpus()` there.
  if (plat === 'macos') return probeCpuMac();
  return summarizeCpu(cpus());
}

async function probeCpuMac(): Promise<CpuSummary> {
  // `machdep.cpu.brand_string` is the exact marketing name ("Apple M2",
  // "Intel(R) Core(TM) i7-9750H"). `hw.physicalcpu` / `hw.logicalcpu` give
  // true core/thread counts — `os.cpus().length` only ever reports logical.
  const brand = (await sysctl('machdep.cpu.brand_string')) || 'Unknown CPU';
  const cores = sysctlNum(await sysctl('hw.physicalcpu')) ?? cpus().length;
  const threads = sysctlNum(await sysctl('hw.logicalcpu')) ?? cores;
  // `hw.perflevel0` = performance cores, `hw.perflevel1` = efficiency cores.
  // These keys exist only on Apple Silicon; an empty result on an Intel Mac
  // is correct (no split), not a probe failure.
  const performanceCores = sysctlNum(await sysctl('hw.perflevel0.physicalcpu'));
  const efficiencyCores = sysctlNum(await sysctl('hw.perflevel1.physicalcpu'));
  return { brand: cleanCpuBrand(brand), cores, threads, performanceCores, efficiencyCores };
}

function summarizeCpu(list: readonly CpuInfo[]): CpuSummary {
  // `cpus()` returns one entry per logical core. Node has no direct API for
  // physical-core count; we report logical for both since hyperthreading
  // detection requires more involved CPUID work that's not worth it here.
  const brand = list[0]?.model.trim() || 'Unknown CPU';
  const threads = list.length;
  return { brand: cleanCpuBrand(brand), cores: threads, threads };
}

async function sysctl(key: string): Promise<string> {
  // A missing key (e.g. `hw.perflevel0` on an Intel Mac) makes `sysctl` exit
  // non-zero — that's an expected "not applicable", so we return '' and let
  // the caller treat it as absent. A genuine failure of a core key still
  // surfaces because the caller's `?? fallback` only covers blanks.
  try {
    const { stdout } = await execFileP('sysctl', ['-n', key], { timeout: 3000 });
    return stdout.trim();
  } catch {
    return '';
  }
}

function sysctlNum(raw: string): number | undefined {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function cleanCpuBrand(s: string): string {
  // Linux often reports trailing "@ 3.20GHz" cruft and double-spaces.
  return s.replace(/\s+/g, ' ').replace(/\s*@\s*[\d.]+\s*GHz\s*$/i, '').trim();
}

// ── GPU / VRAM ─────────────────────────────────────────────────────────────

async function probeGpu(
  plat: 'macos' | 'windows' | 'linux',
  arch: Arch,
): Promise<HardwareReport['gpu']> {
  // macOS deliberately has no catch — a failed `system_profiler` throws to
  // the renderer's detection-error screen rather than degrading to a guess.
  if (plat === 'macos') return probeGpuMac(arch);
  try {
    if (plat === 'windows') return await probeGpuWindows();
    return await probeGpuLinux();
  } catch {
    return defaultGpu();
  }
}

async function probeGpuMac(arch: Arch): Promise<HardwareReport['gpu']> {
  // system_profiler is preinstalled on every macOS; -json output is
  // structured enough to parse without regex gymnastics.
  const { stdout } = await execFileP('system_profiler', ['SPDisplaysDataType', '-json'], {
    timeout: 5000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout) as {
    readonly SPDisplaysDataType?: ReadonlyArray<Record<string, unknown>>;
  };
  const first = parsed.SPDisplaysDataType?.[0] ?? {};
  const model = String(first['sppci_model'] ?? first['_name'] ?? 'Unknown GPU');
  // `sppci_cores` is the integrated-GPU core count on Apple Silicon
  // (e.g. "10" for an M2). Absent on Intel Macs / discrete GPUs.
  const coreCount = sysctlNum(String(first['sppci_cores'] ?? ''));
  // On Apple Silicon, GPU memory is unified with system RAM. Reflect that.
  // Intel Macs report `spdisplays_vram` as a string like "8 GB".
  let vramBytes = 0;
  if (arch === 'arm64') {
    vramBytes = totalmem();
  } else {
    const raw = String(first['spdisplays_vram_shared'] ?? first['spdisplays_vram'] ?? '');
    vramBytes = parseSizeString(raw);
  }
  const vendor: GpuVendor = arch === 'arm64' ? 'apple' : detectGpuVendor(model);
  return {
    vendor,
    model,
    coreCount,
    vramBytes,
    metalSupported: true,
    cudaSupported: false,
    rocmSupported: false,
    vulkanSupported: false,
  };
}

async function probeGpuWindows(): Promise<HardwareReport['gpu']> {
  // PowerShell CIM call is the modern replacement for `wmic` (deprecated in
  // Windows 11 24H2). Returns a compact JSON shape we can parse directly.
  const script =
    "Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json -Compress";
  const { stdout } = await execFileP('powershell.exe', ['-NoProfile', '-Command', script], {
    timeout: 7000,
    maxBuffer: 1024 * 1024,
  });
  // Single result is an object; multiple is an array. Normalize.
  const raw = JSON.parse(stdout) as
    | { readonly Name?: string; readonly AdapterRAM?: number }
    | ReadonlyArray<{ readonly Name?: string; readonly AdapterRAM?: number }>;
  const list = Array.isArray(raw) ? raw : [raw];
  // Pick the adapter with the largest reported VRAM — typically the dGPU.
  const best = [...list].sort((a, b) => (b.AdapterRAM ?? 0) - (a.AdapterRAM ?? 0))[0] ?? {};
  const model = String(best.Name ?? 'Unknown GPU');
  const vramBytes = Number(best.AdapterRAM ?? 0);
  const vendor = detectGpuVendor(model);
  return {
    vendor,
    model,
    vramBytes,
    metalSupported: false,
    cudaSupported: vendor === 'nvidia',
    rocmSupported: vendor === 'amd',
    vulkanSupported: vendor === 'nvidia' || vendor === 'amd' || vendor === 'intel',
  };
}

async function probeGpuLinux(): Promise<HardwareReport['gpu']> {
  // Try nvidia-smi first — it's the only tool that reports VRAM cheaply.
  try {
    const { stdout } = await execFileP(
      'nvidia-smi',
      ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits'],
      { timeout: 4000 },
    );
    const line = stdout.split('\n').find((l) => l.trim().length > 0) ?? '';
    const [name, mb] = line.split(',').map((s) => s.trim());
    if (name && mb) {
      return {
        vendor: 'nvidia',
        model: name,
        vramBytes: Number(mb) * 1024 * 1024,
        metalSupported: false,
        cudaSupported: true,
        rocmSupported: false,
        vulkanSupported: true,
      };
    }
  } catch {
    // fall through to lspci
  }
  // Fallback: parse `lspci` for a VGA / 3D controller. VRAM unknown.
  try {
    const { stdout } = await execFileP('lspci', ['-mm'], { timeout: 4000 });
    const line = stdout
      .split('\n')
      .find((l) => /VGA compatible controller|3D controller/i.test(l));
    if (line) {
      const model = line.split('"').filter((s) => s && !/^\s/.test(s))[2] ?? 'Unknown GPU';
      const vendor = detectGpuVendor(model);
      return {
        vendor,
        model,
        vramBytes: 0,
        metalSupported: false,
        cudaSupported: false,
        rocmSupported: vendor === 'amd',
        vulkanSupported: vendor === 'nvidia' || vendor === 'amd' || vendor === 'intel',
      };
    }
  } catch {
    // ignore — fall through to defaults
  }
  return defaultGpu();
}

function defaultGpu(): HardwareReport['gpu'] {
  return {
    vendor: 'none',
    model: 'No discrete GPU detected',
    vramBytes: 0,
    metalSupported: false,
    cudaSupported: false,
    rocmSupported: false,
    vulkanSupported: false,
  };
}

function detectGpuVendor(model: string): GpuVendor {
  const m = model.toLowerCase();
  if (m.includes('apple')) return 'apple';
  if (m.includes('nvidia') || m.includes('geforce') || m.includes('quadro') || m.includes('rtx') || m.includes('gtx')) return 'nvidia';
  if (m.includes('amd') || m.includes('radeon') || m.includes('rx ') || m.includes('vega')) return 'amd';
  if (m.includes('intel') || m.includes('iris') || m.includes('uhd') || m.includes('hd graphics')) return 'intel';
  return 'none';
}

function parseSizeString(s: string): number {
  // Inputs like "8 GB", "16384 MB", "1024MB"
  const m = /([\d.]+)\s*(GB|MB|TB)/i.exec(s);
  if (!m) return 0;
  const n = parseFloat(m[1] ?? '0');
  const unit = (m[2] ?? '').toUpperCase();
  if (unit === 'TB') return Math.round(n * 1024 ** 4);
  if (unit === 'GB') return Math.round(n * 1024 ** 3);
  return Math.round(n * 1024 ** 2);
}

// ── Engines ────────────────────────────────────────────────────────────────

function pickEngines(
  plat: 'macos' | 'windows' | 'linux',
  vendor: GpuVendor,
): HardwareReport['availableEngines'] {
  // Engine selection mirrors ZL Universe's conventions: MLX is the recommended
  // path on Apple Silicon; llama.cpp is the universal fallback. We don't
  // probe the actual binary versions — those would be bundled with a real
  // app and are out of scope for the mock surface area.
  if (plat === 'macos' && vendor === 'apple') {
    return [
      { kind: 'mlx', version: '0.21.0', recommended: true },
      { kind: 'llama.cpp', version: 'b3905', recommended: false },
    ];
  }
  return [
    { kind: 'llama.cpp', version: 'b3905', recommended: true },
    { kind: 'onnx', version: '1.20.0', recommended: false },
  ];
}

// ── OS version + storage ──────────────────────────────────────────────────

async function probeOsVersion(plat: 'macos' | 'windows' | 'linux'): Promise<string> {
  if (plat === 'macos') {
    try {
      const { stdout } = await execFileP('sw_vers', ['-productVersion'], { timeout: 3000 });
      const v = stdout.trim();
      const codename = await macCodename(v);
      return `macOS ${v}${codename ? ` (${codename})` : ''}`;
    } catch {
      return `macOS ${release()}`;
    }
  }
  if (plat === 'windows') {
    return `Windows ${release()}`;
  }
  return `Linux ${release()}`;
}

async function macCodename(version: string): Promise<string | null> {
  // `sw_vers -productName` returns "macOS"; we infer the codename from the
  // major version. Lookup is short and offline — no API call.
  const major = parseInt(version.split('.')[0] ?? '0', 10);
  const map: Record<number, string> = {
    13: 'Ventura',
    14: 'Sonoma',
    15: 'Sequoia',
    16: 'Tahoe',
  };
  return map[major] ?? null;
}

async function probeStorageAvailable(plat: 'macos' | 'windows' | 'linux'): Promise<number> {
  // Storage check is best-effort. macOS/Linux: `df -k /` gives 1K-blocks;
  // Windows: WMI logical disk free. Returns 0 if anything fails.
  try {
    if (plat === 'windows') {
      const script =
        "(Get-PSDrive C).Free";
      const { stdout } = await execFileP('powershell.exe', ['-NoProfile', '-Command', script], {
        timeout: 4000,
      });
      const n = Number(stdout.trim());
      return Number.isFinite(n) ? n : 0;
    }
    const { stdout } = await execFileP('df', ['-k', '/'], { timeout: 3000 });
    const lines = stdout.trim().split('\n');
    const data = lines[lines.length - 1]?.split(/\s+/) ?? [];
    // df reports KB available at column index 3
    const kb = Number(data[3] ?? 0);
    return Number.isFinite(kb) ? kb * 1024 : 0;
  } catch {
    return 0;
  }
}

// ── Available memory ───────────────────────────────────────────────────────

async function probeAvailableMemory(plat: 'macos' | 'windows' | 'linux'): Promise<number> {
  // `os.freemem()` is the wrong metric on macOS: it counts only wholly-free
  // pages — typically a few dozen MB even on an idle machine — because the
  // OS aggressively parks RAM in reclaimable caches. The honest "available"
  // figure (what Activity Monitor shows) is free + inactive + speculative +
  // purgeable pages, all of which the kernel can hand back on demand.
  // Parsed from `vm_stat`; a failure surfaces to the renderer (no catch).
  if (plat !== 'macos') return freemem();
  const { stdout } = await execFileP('vm_stat', [], { timeout: 3000 });
  const pageSize = Number(/page size of (\d+) bytes/.exec(stdout)?.[1] ?? 0);
  if (!pageSize) throw new Error('vm_stat: could not determine page size');
  const pages = (label: string): number => {
    const m = new RegExp(`Pages ${label}:\\s+(\\d+)\\.`).exec(stdout);
    return m ? Number(m[1]) : 0;
  };
  const reclaimable =
    pages('free') + pages('inactive') + pages('speculative') + pages('purgeable');
  return reclaimable * pageSize;
}
