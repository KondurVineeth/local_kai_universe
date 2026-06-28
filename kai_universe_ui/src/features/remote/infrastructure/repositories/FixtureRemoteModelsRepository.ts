import type { RemoteModel } from '../../domain/entities/RemoteModel';
import type { RemoteModelsRepository } from '../../domain/ports/RemoteModelsRepository';
import type { DeviceId } from '../../domain/value-objects/DeviceId';
import type { Model } from '@shared/domain/model/entities/Model';
import type { ModelRepository } from '@shared/domain/model/ports/ModelRepository';
import type { Bytes } from '@shared/domain/primitives/Bytes';

// Picks a stable per-device slice of the shared catalog. Seeded by a hash
// of the deviceId so:
//   * the same peer renders the same model list on every reload,
//   * different peers render different lists (no two peers feel identical),
//   * no real network is touched — the catalog already lives in fixtures.
//
// Picks 3-5 catalog models per device (count itself seeded). Each picked
// model collapses to a single variant (lower-bias to mid-tier quants like
// Q4_K_M so the right-rail's quant chip looks realistic) — we don't render
// per-variant selectors for remote weights.
const MIN_MODELS = 3;
const MAX_MODELS = 5;
const QUANT_PREFERENCE: readonly string[] = ['Q4_K_M', 'Q5_K_M', 'Q4_K_S', 'Q8_0'];

export class FixtureRemoteModelsRepository implements RemoteModelsRepository {
  private cache: Promise<readonly Model[]> | null = null;

  constructor(private readonly catalog: ModelRepository) {}

  async listForDevice(deviceId: DeviceId): Promise<readonly RemoteModel[]> {
    const all = await this.loadCatalog();
    if (all.length === 0) return [];
    const seed = hash32(deviceId);
    const rng = mulberry32(seed);
    const count = MIN_MODELS + Math.floor(rng() * (MAX_MODELS - MIN_MODELS + 1));
    const picked = sampleDistinct(all, Math.min(count, all.length), rng);
    // Drop variantless models — they can't be rendered without a quant/format
    // pair, and the catalog should never contain any in practice. The filter
    // is here as a defensive guard, not an expected branch.
    return picked
      .filter((m) => m.variants.length > 0)
      .map((m) => toRemoteModel(m, rng));
  }

  private loadCatalog(): Promise<readonly Model[]> {
    if (!this.cache) this.cache = this.catalog.list();
    return this.cache;
  }
}

function toRemoteModel(m: Model, rng: () => number): RemoteModel {
  // listForDevice's filter guarantees variants.length > 0, so pickPreferred
  // always returns. The non-null assertion keeps the signature precise
  // without sprinkling defensive `if (!variant) return null` through callers.
  const variant = pickPreferredVariant(m, rng)!;
  return {
    modelId: m.id,
    displayName: m.displayName,
    author: m.author,
    parameterCountB: m.parameterCountB,
    format: variant.format,
    quantization: variant.quantization,
    sizeBytes: variant.sizeBytes as Bytes,
  };
}

function pickPreferredVariant(m: Model, rng: () => number) {
  for (const q of QUANT_PREFERENCE) {
    const hit = m.variants.find((v) => v.quantization === q);
    if (hit) return hit;
  }
  const idx = Math.floor(rng() * m.variants.length);
  return m.variants[idx] ?? m.variants[0];
}

// Fisher-Yates partial shuffle. Deterministic given the RNG.
function sampleDistinct<T>(arr: readonly T[], k: number, rng: () => number): T[] {
  const a = arr.slice();
  for (let i = 0; i < k && i < a.length - 1; i += 1) {
    const j = i + Math.floor(rng() * (a.length - i));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, k);
}

// FNV-1a 32-bit. Cheap, sufficient for seeding our toy RNG — not crypto.
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Bare-bones seedable PRNG. Same family used elsewhere in the codebase
// where we need deterministic-but-non-trivial picks.
function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
