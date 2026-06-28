// State of the global "currently loaded model" lifecycle. The shell tracks
// exactly one model loaded at a time; this is the lifecycle that the global
// model picker drives via LoadModel and EjectModel use cases.
//
// `unloading` is a transient state during eject — keeps `loadedModelId` set
// so the picker label can show the model name + "Ejecting…" before the slice
// clears the id on `modelEjected`. Without it, the eject animation would
// have to flash through `idle` and the trigger label would jump to "Select
// a model to load" mid-animation.
export const ModelLoadStatuses = ['idle', 'loading', 'loaded', 'unloading', 'error'] as const;
export type ModelLoadStatus = (typeof ModelLoadStatuses)[number];

export const ModelLoadStatus = {
  values: ModelLoadStatuses,
  isLoadingOrLoaded(status: ModelLoadStatus): boolean {
    return status === 'loading' || status === 'loaded';
  },
  isTransient(status: ModelLoadStatus): boolean {
    return status === 'loading' || status === 'unloading';
  },
} as const;
