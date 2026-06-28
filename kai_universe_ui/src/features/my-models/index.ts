import { myModelsRoutes } from './presentation/routes';
import { myModelsReducer, myModelsSlice } from './presentation/store/slice';

import type { MyModelsState } from './presentation/store/slice';
import type { SharedContainer } from '@shared/container';

export interface MyModelsContainer {
  readonly _myModelsMarker?: undefined;
}

export function wireMyModelsContainer(_shared: SharedContainer): MyModelsContainer {
  return {};
}

declare module '@shared/container' {
  interface ContainerExtensions {
    readonly myModels: MyModelsContainer;
  }
}

declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly myModels: MyModelsState;
  }
}

export { myModelsReducer, myModelsSlice };
export { myModelsRoutes };
export { MyModelsRightRailSlot } from './presentation/components/MyModelsRightRailSlot';
export {
  selectMyModelsCategory,
  selectMyModelsDeviceFilter,
  selectMyModelsSearchQuery,
  selectMyModelsSelectedModelId,
  selectMyModelsRightRailOpen,
  selectMyModelsActiveTab,
  selectMyModelsPinned,
  selectInstalledModelIds,
  selectIsModelInstalled,
} from './presentation/store/selectors';
export {
  categorySet,
  deviceFilterSet,
  searchQuerySet,
  selectModel,
  pinToggled,
  modelInstalled,
  modelUninstalled,
} from './presentation/store/slice';
export type {
  MyModelsState,
  MyModelsCategory,
  DeviceFilter,
  RightRailTab,
} from './presentation/store/slice';
