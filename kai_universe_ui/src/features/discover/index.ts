import { discoverRoutes } from './presentation/routes';
import { discoverReducer, discoverSlice } from './presentation/store/slice';

import type { DiscoverState } from './presentation/store/slice';
import type { SharedContainer } from '@shared/container';

export interface DiscoverContainer {
  readonly _discoverMarker?: undefined;
}

export function wireDiscoverContainer(_shared: SharedContainer): DiscoverContainer {
  return {};
}

declare module '@shared/container' {
  interface ContainerExtensions {
    readonly discover: DiscoverContainer;
  }
}

declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly discover: DiscoverState;
  }
}

export { discoverReducer, discoverSlice };
export { discoverRoutes };
export {
  selectDiscoverCategory,
  selectDiscoverSearchQuery,
  selectDiscoverFormatFilter,
  selectDiscoverSort,
  selectDiscoverSelectedModelId,
  selectDiscoverDownloads,
} from './presentation/store/selectors';
export {
  selectModel,
  categorySet,
  searchQuerySet,
  formatFilterSet,
  sortSet,
  variantSelected,
} from './presentation/store/slice';
export { startModelDownloadThunk } from './presentation/store/thunks';
export type {
  DiscoverState,
  DiscoverCategory,
  DiscoverFormatFilter,
  DiscoverSort,
} from './presentation/store/slice';
