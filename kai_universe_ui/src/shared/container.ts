// SharedContainer is the slice of the DI container contributed by `src/shared/`.
// It carries the cross-cutting repository ports that 3+ features depend on.
//
// Container is the FULL container the app composes at runtime. Features extend
// it via TypeScript declaration merging from their barrel:
//
//   declare module '@shared/container' {
//     interface ContainerExtensions {
//       chat: ChatContainer;
//     }
//   }
//
// This keeps the dependency direction one-way: `@shared` knows nothing about
// features at compile time, but the type system still sees the full surface.
import type { DownloadRepository } from './domain/download/ports/DownloadRepository';
import type { ModelRepository } from './domain/model/ports/ModelRepository';
import type { SystemRepository } from './domain/system/ports/SystemRepository';
import type { KvStore } from './persistence/KvStore';
import type { HttpLocalServerService } from './infrastructure/repositories/HttpLocalServerService';

export interface SharedContainer {
  readonly modelRepository: ModelRepository;
  readonly downloadRepository: DownloadRepository;
  readonly localServerService: HttpLocalServerService;
  readonly systemRepository: SystemRepository;
  readonly kvStore: KvStore;
}

// Open interface — features augment this via `declare module '@shared/container'`.
// Day 1 it has no extensions; each feature adds its own keyed slice as it lands.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ContainerExtensions {}

export type Container = SharedContainer & {
  readonly [K in keyof ContainerExtensions]: ContainerExtensions[K];
};
