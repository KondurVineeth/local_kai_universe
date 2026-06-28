import { ArrowSquareOut, CaretDown, Info, Play } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import type { Model } from '@shared/domain/model/entities/Model';
import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import { useContainer } from '@shared/container-context';
import { selectSelectedModelId } from "../../../../discover/presentation/store/selectors";
import { startModelDownloadThunk } from "../../../../discover/presentation/store/thunks";
import { useModels } from "../../../../discover/presentation/hooks/useModels";
import { listEndpoints } from '../../../application/use-cases/listEndpoints';
import {
  selectEndpointsCollapsed,
  selectEndpointsTab,
  selectServerStatus,
} from '../../store/selectors';
import {
    apiResponseReceived,
    endpointsCollapsedToggled,
    endpointsTabSet,
} from '../../store/slice';
import { simulateRequestThunk } from '../../store/thunks';

import type { Endpoint, HttpMethod } from '../../../domain/entities/Endpoint';
import type { EndpointsTab } from '../../store/slice';

// Realistic synthetic latency + response notes per endpoint pattern so the
// "Try it" button emits log lines that look like real ZL Universe traffic.
function simulatedResponseFor(endpoint: Endpoint): {
  readonly latencyMs: number;
  readonly status: number;
  readonly responseNote?: string;
} {
  if (endpoint.path.includes('chat/completions') || endpoint.path.includes('/chat')) {
    return { latencyMs: 320, status: 200, responseNote: 'tokens=147' };
  }
  if (endpoint.path.includes('embeddings')) {
    return { latencyMs: 45, status: 200, responseNote: 'vectors=1 dim=384' };
  }
  if (endpoint.path.includes('models/load')) {
    return { latencyMs: 1840, status: 200, responseNote: 'loaded' };
  }
  if (endpoint.path.includes('models/download/status')) {
    return { latencyMs: 8, status: 200, responseNote: 'progress=0.42' };
  }
  if (endpoint.path.includes('models/download')) {
    return { latencyMs: 12, status: 202, responseNote: 'job_id=dl_abc123' };
  }
  if (endpoint.path === '/api/v1/models' || endpoint.path === '/v1/models') {
    return { latencyMs: 12, status: 200, responseNote: 'count=2' };
  }
  if (endpoint.path.includes('messages')) {
    return { latencyMs: 290, status: 200, responseNote: 'tokens=132' };
  }
  return { latencyMs: 18, status: 200 };
}

const TABS: ReadonlyArray<{ key: EndpointsTab; label: string }> = [
  { key: 'zl-universe', label: 'ZL Universe API' },
  { key: 'openai', label: 'OpenAI-compatible' },
  { key: 'anthropic', label: 'Anthropic-compatible' },
];

// Method chips: WCAG-AA contrast against the row's hover background. The
// previous palette used 40%-alpha dark backgrounds with 300-level text;
// POST's blue-300 on blue-900/40 dropped below the 4.5:1 threshold and
// rendered as a near-empty box. Solid backgrounds + 100-level text fix it.
const METHOD_CLASSES: Record<HttpMethod, string> = {
  GET: 'bg-green-600 text-green-50',
  POST: 'bg-blue-600 text-blue-50',
  DELETE: 'bg-red-600 text-red-50',
  PUT: 'bg-amber-600 text-amber-50',
  PATCH: 'bg-orange-600 text-orange-50',
};

export function SupportedEndpointsSection() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const activeTab = useAppSelector(selectEndpointsTab);
  const collapsed = useAppSelector(selectEndpointsCollapsed);

  const endpoints = listEndpoints(activeTab);

  return (
    <section className="border-b border-border-default">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-fg-default">Supported Endpoints</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            trailingIcon={<Icon icon={ArrowSquareOut} size="xs" className="text-fg-subtle" />}
            onClick={() => navigate('/developer-docs/rest-overview')}
          >
            REST API v1
          </Button>
          <Tooltip content={collapsed ? 'Expand endpoints' : 'Collapse endpoints'} side="left">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={collapsed ? 'Expand endpoints' : 'Collapse endpoints'}
              aria-expanded={!collapsed}
              onClick={() => dispatch(endpointsCollapsedToggled())}
            >
              <Icon
                icon={CaretDown}
                size="xs"
                className={cn('transition-transform', collapsed ? '-rotate-90' : '')}
              />
            </Button>
          </Tooltip>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="flex items-center gap-1 border-b border-border-default px-4 pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => dispatch(endpointsTabSet(tab.key))}
                aria-pressed={activeTab === tab.key}
                className={cn(
                  'rounded-md px-3 py-1 text-xs transition-colors',
                  activeTab === tab.key
                    ? 'bg-bg-raised text-fg-default'
                    : 'text-fg-muted hover:bg-bg-raised/60 hover:text-fg-default',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-0 px-4 py-2">
            {endpoints.map((endpoint) => (
              <EndpointRow key={`${endpoint.method}:${endpoint.path}`} endpoint={endpoint} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

async function executeEndpoint(
    endpoint: Endpoint,
    container: ReturnType<typeof useContainer>,
    dispatch: ReturnType<typeof useAppDispatch>,
    selectedModel: Model | undefined,
): Promise<boolean> {
  switch (endpoint.path) {

    // -----------------------------
    // ZL Universe API
    // -----------------------------

    case "/api/v1/models": {
        const models =
          await container.localServer.localServerService.getPublicModels();
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 200,
                body: models,
            }),
        );
      return true;
    }
    case "/api/v1/chat": {
        console.log("ZL Chat");
        return true;
    }
    case "/api/v1/models/load": {
    if (!selectedModel) {
        return false;
    }

    await container.localServer.localServerService.loadModel(
        selectedModel.id,
        selectedModel.hfRepository,
    );

    dispatch(
        apiResponseReceived({
            endpoint: endpoint.path,
            method: endpoint.method,
            status: 200,
            body: {
                message: `Loaded ${selectedModel.displayName}`,
            },
        }),
);
    return true;
}
    case "/api/v1/models/download": {
      if (!selectedModel) {
          return false;
      }
      const variant =
          selectedModel.variants.find(v => v.recommended)
          ?? selectedModel.variants[0];
      if (!variant) {
          return false;
      }
      await dispatch(
          startModelDownloadThunk(
              selectedModel.id,
              selectedModel.hfRepository,
              variant.quantization,
              Number(variant.sizeBytes),
          ),
      );
      return true;
  }
    case "/api/v1/models/download/status/:job_id": {

    const downloads =
        await container.downloadRepository.list();
    console.log("Downloads:", downloads);
    if (downloads.length === 0) {

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 404,
                body: {
                    message: "No downloads found",
                },
            }),
        );

        return true;
    }

    const currentDownload =
        downloads.find(
            download => download.status === "downloading",
        ) ??
        downloads[downloads.length - 1];
      console.log("Current Download:", currentDownload);
    if (!currentDownload) {
        return false;
    }

    const download =
      await container.downloadRepository.findById(
        currentDownload.id,
    );

    await container.localServer.localServerService.addLog(
        "INFO",
        "GET /api/v1/models/download/status/:job_id",
    );

    await container.localServer.localServerService.addLog(
        "INFO",
        JSON.stringify(download, null, 2),
    );
    console.log("Download Details:", download);
    if (!download) {

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 404,
                body: {
                    message: "Download not found",
                },
            }),
        );

        return true;
    }

    console.log("Dispatching API response...");

    dispatch(
        apiResponseReceived({
            endpoint: endpoint.path,
            method: endpoint.method,
            status: 200,
            body: {
                id: download.id,
                modelId: download.modelId,
                status: download.status,
            },
        }),
    );

    console.log("Dispatch complete");

    return true;
}
    // -----------------------------
    // OpenAI Compatible
    // -----------------------------
    case "/v1/models": {

    const models =
        await container.localServer.localServerService.getPublicModels();

    dispatch(
        apiResponseReceived({
            endpoint: endpoint.path,
            method: endpoint.method,
            status: 200,
            body: models,
        }),
    );

    return true;
}
    case "/v1/chat/completions": {
        console.log("OpenAI Chat Completions");
        return true;
    }
    case "/v1/completions": {
        console.log("OpenAI Completions");
        return true;
    }
    case "/v1/responses": {
        console.log("OpenAI Responses");
        return true;
    }
    case "/v1/embeddings": {
        console.log("OpenAI Embeddings");
        return true;
    }
    // -----------------------------
    // Anthropic Compatible
    // -----------------------------
    case "/v1/messages": {
        console.log("Anthropic Messages");
        return true;
    }
    default:
        break;
  }
  return false;
}

function EndpointRow({ endpoint }: { readonly endpoint: Endpoint }) {
  const dispatch = useAppDispatch();
  const container = useContainer();
  const { models } = useModels();

  const selectedModelId = useAppSelector(selectSelectedModelId);

  const selectedModel = models.find(
    (model: Model) => model.id === selectedModelId,
  );
  const serverStatus = useAppSelector(selectServerStatus);
  const canTry = serverStatus === 'running';
  const onTry = async () => {
    if (!canTry) return;

    const handled =
        await executeEndpoint(endpoint, container, dispatch, selectedModel);

    if (handled) return;

    const sim = simulatedResponseFor(endpoint);

    dispatch(
        simulateRequestThunk({
            method: endpoint.method,
            path: endpoint.path,
            ...sim,
        }),
    );
  };

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-bg-raised/40">
      <span
        className={cn(
          'w-12 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold',
          METHOD_CLASSES[endpoint.method],
        )}
      >
        {endpoint.method}
      </span>
      <span className="flex-1 font-mono text-xs text-fg-default">{endpoint.path}</span>
      <Tooltip
        content={canTry ? 'Simulate a request to this endpoint' : 'Start the server to try endpoints'}
        side="left"
      >
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          onClick={onTry}
          disabled={!canTry}
          aria-label="Try endpoint"
        >
          <Icon icon={Play} size="xs" weight="fill" />
        </Button>
      </Tooltip>
      <Tooltip content={endpoint.description} side="left">
        <span className="cursor-help text-fg-subtle">
          <Icon icon={Info} size="xs" />
        </span>
      </Tooltip>
    </div>
  );
}