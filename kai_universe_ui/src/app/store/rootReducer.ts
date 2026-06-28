import { combineReducers } from '@reduxjs/toolkit';

import { chatReducer, chatConfigReducer } from '@features/chat';
import { developerDocsReducer } from '@features/developer-docs';
import { discoverReducer } from '@features/discover';
import { localServerReducer } from '@features/local-server';
import { myModelsReducer } from '@features/my-models';
import { onboardingReducer } from '@features/onboarding';
import { remoteReducer } from '@features/remote';
import { settingsReducer } from '@features/settings';
import { shellReducer } from '@features/shell';

// Each feature contributes its slice reducer here. RTK Query API reducers will
// be added the same way as features register their APIs (each barrel exports
// `<feature>Api` with `reducer` and `reducerPath`).
export const rootReducer = combineReducers({
  shell: shellReducer,
  onboarding: onboardingReducer,
  chat: chatReducer,
  chatConfig: chatConfigReducer,
  discover: discoverReducer,
  myModels: myModelsReducer,
  localServer: localServerReducer,
  developerDocs: developerDocsReducer,
  remote: remoteReducer,
  settings: settingsReducer,
});
