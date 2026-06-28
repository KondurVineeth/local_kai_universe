
import { wireChatContainer } from '@features/chat';
import { wireDeveloperDocsContainer } from '@features/developer-docs';
import { wireDiscoverContainer } from '@features/discover';
import { wireLocalServerContainer } from '@features/local-server';
import { wireMyModelsContainer } from '@features/my-models';
import { wireOnboardingContainer } from '@features/onboarding';
import { wireRemoteContainer } from '@features/remote';
import { wireSettingsContainer } from '@features/settings';
import { wireShellContainer } from '@features/shell';
import { ElectronSystemRepository } from '@shared/infrastructure/repositories/ElectronSystemRepository';
import { HttpDownloadRepository } from '@shared/infrastructure/repositories/HttpDownloadRepository';
import { HttpModelRepository } from '@shared/infrastructure/repositories/HttpModelRepository';
import { createKvStore } from '@shared/persistence/KvStore';
import { HttpLocalServerService } from '@shared/infrastructure/repositories/HttpLocalServerService';

import type { Container, SharedContainer } from './Container';

// Wire the shared (cross-cutting) slice of the container.
function wireSharedContainer(): SharedContainer {
  const kvStore = createKvStore();

const modelRepository = new HttpModelRepository();

const downloadRepository = new HttpDownloadRepository();

const localServerService = new HttpLocalServerService();

const systemRepository = new ElectronSystemRepository();

return {
    kvStore,
    modelRepository,
    downloadRepository,
    localServerService,
    systemRepository,
};
}

// The composition root. The ONLY module allowed to know about every feature's
// concrete adapters and wire them together. Each feature contributes its slice
// of the container via its `wire<Feature>Container(shared)` function.
export function createContainer(): Container {
  const shared = wireSharedContainer();
  return {
    ...shared,
    shell: wireShellContainer(shared),
    onboarding: wireOnboardingContainer(shared),
    chat: wireChatContainer(shared),
    discover: wireDiscoverContainer(shared),
    myModels: wireMyModelsContainer(shared),
    localServer: wireLocalServerContainer(shared),
    developerDocs: wireDeveloperDocsContainer(shared),
    remote: wireRemoteContainer(shared),
    settings: wireSettingsContainer(shared),
  };
}
