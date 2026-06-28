import type { DocPage, HttpMethod } from '../../domain/entities/DocPage';
import type { DocSection } from '../../domain/value-objects/DocSection';

interface DocMeta {
  readonly slug: string;
  readonly title: string;
  readonly section: DocSection;
  readonly path: string;
  readonly method?: HttpMethod;
}

const RAW_CONTENT = import.meta.glob('./content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Readonly<Record<string, string>>;

const MANIFEST: readonly DocMeta[] = [
  { slug: 'introduction', title: 'Introduction', section: 'top', path: 'introduction' },
  { slug: 'api-changelog', title: 'API Changelog', section: 'top', path: 'api-changelog' },

  { slug: 'server', title: 'Server', section: 'core', path: 'core/server' },
  { slug: 'authentication', title: 'Authentication', section: 'core', path: 'core/authentication' },
  { slug: 'headless-llmster', title: 'Linux Startup Task', section: 'core', path: 'core/headless-llmster' },
  { slug: 'headless', title: 'Headless Mode', section: 'core', path: 'core/headless' },
  { slug: 'lmlink', title: 'Using LM Link', section: 'core', path: 'core/lmlink' },
  { slug: 'mcp', title: 'Using MCP via API', section: 'core', path: 'core/mcp' },
  { slug: 'ttl-and-auto-evict', title: 'Idle TTL and Auto-Evict', section: 'core', path: 'core/ttl-and-auto-evict' },

  { slug: 'rest-overview', title: 'Overview', section: 'rest', path: 'rest/overview' },
  { slug: 'rest-quickstart', title: 'Quickstart', section: 'rest', path: 'rest/quickstart' },
  { slug: 'rest-stateful-chats', title: 'Stateful Chats', section: 'rest', path: 'rest/stateful-chats' },
  { slug: 'rest-streaming-events', title: 'Streaming events', section: 'rest', path: 'rest/streaming-events' },
  { slug: 'rest-chat', title: 'Chat with a model', section: 'rest', path: 'rest/chat', method: 'POST' },
  { slug: 'rest-list', title: 'List your models', section: 'rest', path: 'rest/list', method: 'GET' },
  { slug: 'rest-load', title: 'Load a model', section: 'rest', path: 'rest/load', method: 'POST' },
  { slug: 'rest-download', title: 'Download a model', section: 'rest', path: 'rest/download', method: 'POST' },
  { slug: 'rest-unload', title: 'Unload a model', section: 'rest', path: 'rest/unload', method: 'POST' },
  { slug: 'rest-download-status', title: 'Get download status', section: 'rest', path: 'rest/download-status', method: 'GET' },
  { slug: 'rest-endpoints', title: 'REST API v0', section: 'rest', path: 'rest/endpoints' },

  { slug: 'openai-overview', title: 'Overview', section: 'openai-compat', path: 'openai-compat/overview' },
  { slug: 'openai-chat-completions', title: 'Chat Completions', section: 'openai-compat', path: 'openai-compat/chat-completions', method: 'POST' },
  { slug: 'openai-completions', title: 'Completions (Legacy)', section: 'openai-compat', path: 'openai-compat/completions', method: 'POST' },
  { slug: 'openai-embeddings', title: 'Embeddings', section: 'openai-compat', path: 'openai-compat/embeddings', method: 'POST' },
  { slug: 'openai-models', title: 'List Models', section: 'openai-compat', path: 'openai-compat/models', method: 'GET' },
  { slug: 'openai-responses', title: 'Responses', section: 'openai-compat', path: 'openai-compat/responses', method: 'POST' },
  { slug: 'openai-structured-output', title: 'Structured Output', section: 'openai-compat', path: 'openai-compat/structured-output' },
  { slug: 'openai-tools', title: 'Tool Use', section: 'openai-compat', path: 'openai-compat/tools' },

  { slug: 'anthropic-overview', title: 'Overview', section: 'anthropic-compat', path: 'anthropic-compat/overview' },
  { slug: 'anthropic-messages', title: 'Messages', section: 'anthropic-compat', path: 'anthropic-compat/messages', method: 'POST' },
];

function resolveContent(path: string): string {
  const key = `./content/${path}.md`;
  return RAW_CONTENT[key] ?? `# Not Found\n\nDocument \`${path}\` is missing from fixtures.`;
}

export const ORDERED_DOC_PAGES: readonly DocPage[] = MANIFEST.map((m) => {
  const base: DocPage = {
    slug: m.slug,
    title: m.title,
    section: m.section,
    contentPath: m.path,
    body: resolveContent(m.path),
  };
  return m.method ? { ...base, method: m.method } : base;
});
