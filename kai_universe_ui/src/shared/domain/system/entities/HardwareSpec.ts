import type { Bytes } from '../../primitives/Bytes';

export type GpuVendor = 'apple' | 'nvidia' | 'amd' | 'intel' | 'none';

export interface CpuSpec {
  readonly brand: string;
  readonly cores: number;
  readonly threads: number;
  readonly architecture: 'arm64' | 'x86_64';
  // Apple Silicon performance/efficiency core split. Absent on Intel Macs
  // and non-macOS platforms (single uniform core type).
  readonly performanceCores?: number;
  readonly efficiencyCores?: number;
}

export interface GpuSpec {
  readonly vendor: GpuVendor;
  readonly model: string;
  // GPU core count — Apple Silicon integrated GPU. Absent elsewhere.
  readonly coreCount?: number;
  readonly vramBytes: Bytes;
  readonly metalSupported: boolean;
  readonly cudaSupported: boolean;
  readonly rocmSupported: boolean;
  readonly vulkanSupported: boolean;
}

export interface MemorySpec {
  readonly totalBytes: Bytes;
  readonly availableBytes: Bytes;
}

export type EngineKind = 'llama.cpp' | 'mlx' | 'onnx';

export interface EngineSpec {
  readonly kind: EngineKind;
  readonly version: string;
  readonly recommended: boolean;
}

export interface HardwareSpec {
  readonly platform: 'macos' | 'windows' | 'linux';
  readonly cpu: CpuSpec;
  readonly gpu: GpuSpec;
  readonly memory: MemorySpec;
  readonly storageAvailableBytes: Bytes;
  readonly availableEngines: readonly EngineSpec[];
  readonly osVersion: string;
}
