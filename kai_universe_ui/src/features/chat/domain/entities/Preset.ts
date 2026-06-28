import type { InferenceConfig } from './InferenceConfig';

// A named snapshot of inference settings. Built-ins ship with the app and
// cannot be deleted; user presets are mutable.
export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly builtIn: boolean;
  readonly config: InferenceConfig;
}
