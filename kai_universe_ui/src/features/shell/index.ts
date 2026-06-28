
import { EjectModel } from './application/use-cases/EjectModel';
import { LoadModel } from './application/use-cases/LoadModel';
import { AppShellLayout } from './presentation/layouts/AppShellLayout';
import { shellRoutes } from './presentation/routes';
import { shellReducer, shellSlice } from './presentation/store/slice';

import type { ShellState } from './presentation/store/slice';
import type { SharedContainer } from '@shared/container';

export interface ShellContainer {
  readonly loadModel: LoadModel;
  readonly ejectModel: EjectModel;
}

export function wireShellContainer(shared: SharedContainer): ShellContainer {
  const loadModel = new LoadModel(shared.modelRepository,shared.localServerService,);
  const ejectModel = new EjectModel(shared.localServerService,);
  return { loadModel, ejectModel };
}

// Augment the global Container type with this feature's slice.
declare module '@shared/container' {
  interface ContainerExtensions {
    readonly shell: ShellContainer;
  }
}

// Register this feature's slice on the global RootStateShape.
declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly shell: ShellState;
  }
}

// Public surface — barrel-level exports only
export { AppShellLayout };
export { shellReducer, shellSlice };
export { shellRoutes };
export {
  selectActiveRouteKey,
  selectDownloadsPanelOpen,
  selectLoadedModelId,
  selectLoadedModelIsReasoning,
  selectModelLoadError,
  selectLastFailedModelId,
  selectModelLoadStatus,
  selectModelLoadProgressPct,
  selectRightPanelOpen,
  selectSecondarySidebarHidden,
  selectShell,
  selectModelPickerFilter,
  selectLastLoadedModelId,
  selectModelPickerOpenSeq,
} from './presentation/store/selectors';
export {
  activeRouteSet,
  downloadsPanelOpenSet,
  downloadsPanelToggled,
  modelEjectStarted,
  modelEjected,
  modelLoadFailed,
  modelLoadErrorCleared,
  modelLoadStarted,
  modelLoadSucceeded,
  rightPanelOpenSet,
  rightPanelToggled,
  setRightPanelOpenForRoute,
  secondarySidebarHiddenSet,
  secondarySidebarToggled,
  modelPickerFilterSet,
  modelPickerOpenRequested,
  loadedModelSelected,
} from './presentation/store/slice';
export type { ModelCapabilityFilter } from './presentation/store/slice';
export { ejectModelThunk, loadModelThunk } from './presentation/store/thunks';
export type { ShellState };
export type { ModelLoadStatus } from './domain/value-objects/ModelLoadStatus';
