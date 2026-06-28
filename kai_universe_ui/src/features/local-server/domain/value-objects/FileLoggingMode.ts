// How the simulated server persists logs to disk. Domain-pure so the
// application layer (log-stream transform) and presentation (the Log
// Options menu) reference one definition without crossing boundaries.
export type FileLoggingMode = 'off' | 'succinct' | 'full';
