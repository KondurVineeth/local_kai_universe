import {
  ANTHROPIC_ENDPOINTS,
  ZL_UNIVERSE_ENDPOINTS,
  OPENAI_ENDPOINTS,
} from '../../domain/entities/Endpoint';

import type { Endpoint } from '../../domain/entities/Endpoint';
import type { EndpointsTab } from '../../domain/value-objects/EndpointsTab';

// Wraps the static endpoint catalog. When real runtime endpoint discovery
// lands, swap the body without touching the presentation call sites.
export function listEndpoints(tab: EndpointsTab): readonly Endpoint[] {
  if (tab === 'zl-universe') return ZL_UNIVERSE_ENDPOINTS;
  if (tab === 'openai') return OPENAI_ENDPOINTS;
  return ANTHROPIC_ENDPOINTS;
}

export type { Endpoint, HttpMethod } from '../../domain/entities/Endpoint';
