// Which API surface the "Supported Endpoints" panel is currently showing.
// Lives in domain so app + presentation can both reference without
// crossing the boundary rule.
export type EndpointsTab = 'zl-universe' | 'openai' | 'anthropic';
