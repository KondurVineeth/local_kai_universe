import { FixtureRemoteModelsRepository } from './infrastructure/repositories/FixtureRemoteModelsRepository';
import { remoteRoutes } from './presentation/routes';
import { remoteReducer, remoteSlice } from './presentation/store/slice';

import type { RemoteModelsRepository } from './domain/ports/RemoteModelsRepository';
import type { RemoteState } from './presentation/store/slice';
import type { SharedContainer } from '@shared/container';


export interface RemoteContainer {
  readonly remoteModelsRepository: RemoteModelsRepository;
}

export function wireRemoteContainer(shared: SharedContainer): RemoteContainer {
  return {
    remoteModelsRepository: new FixtureRemoteModelsRepository(shared.modelRepository),
  };
}

declare module '@shared/container' {
  interface ContainerExtensions {
    readonly remote: RemoteContainer;
  }
}

declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly remote: RemoteState;
  }
}

export { remoteReducer, remoteSlice };
export { remoteRoutes };
export { RemoteRightRail } from './presentation/components/RemoteRightRail';
export type { RemoteState };
