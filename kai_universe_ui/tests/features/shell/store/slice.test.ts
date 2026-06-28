import { describe, expect, it } from 'vitest';

import { ModelId } from '@shared/domain/model/value-objects/ModelId';

import {
  downloadsPanelOpenSet,
  downloadsPanelToggled,
  modelEjectStarted,
  modelEjected,
  modelLoadFailed,
  modelLoadStarted,
  modelLoadSucceeded,
  rightPanelToggled,
  secondarySidebarToggled,
  shellReducer,
  type ShellState,
} from '../../../../src/features/shell/presentation/store/slice';

const initialState: ShellState = {
  secondarySidebarHidden: false,
  rightPanelOpenByRoute: { chat: true },
  activeRouteKey: 'chat',
  loadedModelId: null,
  loadedModelIsReasoning: false,
  modelLoadStatus: 'idle',
  modelLoadError: null,
  lastFailedModelId: null,
  modelLoadProgressPct: 0,
  downloadsPanelOpen: false,
  modelPickerFilter: 'all',
  lastLoadedModelId: null,
  modelPickerOpenSeq: 0,
};

describe('shellReducer', () => {
  it('toggles the secondary sidebar', () => {
    const next = shellReducer(initialState, secondarySidebarToggled());
    expect(next.secondarySidebarHidden).toBe(true);
  });

  it('toggles the right panel for the active route', () => {
    const next = shellReducer(initialState, rightPanelToggled());
    expect(next.rightPanelOpenByRoute.chat).toBe(false);
  });

  it('moves through the load lifecycle', () => {
    const id = ModelId.of('qwen-2.5-7b');
    const after1 = shellReducer(initialState, modelLoadStarted({ modelId: id }));
    expect(after1.modelLoadStatus).toBe('loading');
    expect(after1.loadedModelId).toBe(id);

    const after2 = shellReducer(after1, modelLoadSucceeded({ modelId: id, isReasoning: true }));
    expect(after2.modelLoadStatus).toBe('loaded');
    expect(after2.loadedModelId).toBe(id);
    expect(after2.loadedModelIsReasoning).toBe(true);
    expect(after2.modelLoadError).toBeNull();

    // Eject is a two-step transition: `unloading` keeps the id around so
    // the picker can show the eject animation, then `idle` clears it.
    const ejecting = shellReducer(after2, modelEjectStarted());
    expect(ejecting.modelLoadStatus).toBe('unloading');
    expect(ejecting.loadedModelId).toBe(id);

    const after3 = shellReducer(ejecting, modelEjected());
    expect(after3.modelLoadStatus).toBe('idle');
    expect(after3.loadedModelId).toBeNull();
    expect(after3.loadedModelIsReasoning).toBe(false);
  });

  it('records errors and clears loaded id on load failure', () => {
    const id = ModelId.of('mystery');
    const after1 = shellReducer(initialState, modelLoadStarted({ modelId: id }));
    const after2 = shellReducer(after1, modelLoadFailed({ message: 'nope' }));
    expect(after2.modelLoadStatus).toBe('error');
    expect(after2.loadedModelId).toBeNull();
    expect(after2.modelLoadError).toBe('nope');
  });

  it('toggles downloads panel state', () => {
    const opened = shellReducer(initialState, downloadsPanelToggled());
    expect(opened.downloadsPanelOpen).toBe(true);
    const closed = shellReducer(opened, downloadsPanelOpenSet(false));
    expect(closed.downloadsPanelOpen).toBe(false);
  });
});
