import { FixtureDocsRepository } from './infrastructure/repositories/FixtureDocsRepository';
import { DocsSearchPanel } from './presentation/components/DocsSearchPanel';
import { developerDocsRoutes } from './presentation/routes';
import { developerDocsReducer, developerDocsSlice } from './presentation/store/slice';

import type { DocsRepository } from './domain/ports/DocsRepository';
import type { DeveloperDocsState } from './presentation/store/slice';
import type { SharedContainer } from '@shared/container';


export interface DeveloperDocsContainer {
  readonly docsRepository: DocsRepository;
}

export function wireDeveloperDocsContainer(_shared: SharedContainer): DeveloperDocsContainer {
  return {
    docsRepository: new FixtureDocsRepository(),
  };
}

declare module '@shared/container' {
  interface ContainerExtensions {
    readonly developerDocs: DeveloperDocsContainer;
  }
}

declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly developerDocs: DeveloperDocsState;
  }
}

export { developerDocsReducer, developerDocsSlice };
export { developerDocsRoutes };
export { DocsSearchPanel };
export {
  selectLastVisitedSlug,
  selectExpandedSections,
  selectSearchPanelOpen,
} from './presentation/store/selectors';
export { searchPanelOpenSet, searchPanelToggled } from './presentation/store/slice';
export type { DeveloperDocsState };
