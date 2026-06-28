// HTTP endpoint surfaced by the local-server "Supported Endpoints" rows.
// Domain-pure: type lives here so both fixtures and presentation can
// reference it without crossing architectural boundaries.
export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';

export interface Endpoint {
  readonly method: HttpMethod;
  readonly path: string;
  readonly description: string;
}

// Static catalog of mock endpoints. The clickable mock doesn't probe a real
// server; the lists are the spec we ship. Co-locating the data with the
// type keeps both app-layer use cases and presentation rows pulling from
// the same domain source — no presentation→infrastructure boundary jumps.
export const ZL_UNIVERSE_ENDPOINTS: readonly Endpoint[] = [
  { method: 'GET', path: '/api/v1/models', description: 'List all loaded models' },
  { method: 'POST', path: '/api/v1/chat', description: 'Send a chat message' },
  { method: 'POST', path: '/api/v1/models/load', description: 'Load a model' },
  { method: 'POST', path: '/api/v1/models/download', description: 'Download a model' },
  { method: 'GET', path: '/api/v1/models/download/status/:job_id', description: 'Check download status' },
];

export const OPENAI_ENDPOINTS: readonly Endpoint[] = [
  { method: 'GET', path: '/v1/models', description: 'List models (OpenAI-compatible)' },
  { method: 'POST', path: '/v1/responses', description: 'Responses API' },
  { method: 'POST', path: '/v1/chat/completions', description: 'Chat completions' },
  { method: 'POST', path: '/v1/completions', description: 'Text completions' },
  { method: 'POST', path: '/v1/embeddings', description: 'Embeddings' },
];

export const ANTHROPIC_ENDPOINTS: readonly Endpoint[] = [
  { method: 'POST', path: '/v1/messages', description: 'Messages API (Anthropic-compatible)' },
  { method: 'GET', path: '/v1/models', description: 'List models (Anthropic-compatible)' },
];
