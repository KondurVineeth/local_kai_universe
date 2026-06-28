import { delayJittered } from '@shared/lib/delay';
import type { HttpLocalServerService } from '@shared/infrastructure/repositories/HttpLocalServerService';

// Eject is a near-instant operation in real ZL Universe (just frees VRAM). We
// simulate a small delay so the UI shows a brief "ejecting" state for feel.
// Currently has no domain dependencies; the slice clears `loadedModelId`
// directly via the `modelEjected` action. Ships as a class for symmetry with
// LoadModel and to leave a seam for future audit logging.
export class EjectModel {

    constructor(
        private readonly localServerService: HttpLocalServerService,
    ) {}

    async execute(modelId: string): Promise<void> {

        await this.localServerService.unloadModel(modelId);

        await delayJittered(600, 900);

    }

}