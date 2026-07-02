import { ArrowSquareOut, CaretDown, Info, Play } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon, Tooltip } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import { useContainer } from '@shared/container-context';
import { selectSelectedModelId } from "../../../../discover/presentation/store/selectors";
import { useModels } from "../../../../discover/presentation/hooks/useModels";
import { listEndpoints } from '../../../application/use-cases/listEndpoints';
import type { InferenceConfig } from "../../store/slice";
import type { Model } from "@shared/domain/model/entities/Model";
import {
  selectEndpointsCollapsed,
  selectEndpointsTab,
  selectServerStatus,
  selectInferenceConfig,
} from '../../store/selectors';
import {
    apiResponseReceived,
    endpointsCollapsedToggled,
    endpointsTabSet,
} from '../../store/slice';
import { simulateRequestThunk } from '../../store/thunks';
import { useLoadedModels } from "../../hooks";
import type { Endpoint, HttpMethod } from '../../../domain/entities/Endpoint';
import type { EndpointsTab } from '../../store/slice';
import type {
    LoadedModel,
} from "@shared/infrastructure/repositories/HttpLocalServerService";

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
    selectedDiscoverModel: Model | undefined,
    selectedLoadedModel: LoadedModel | undefined,
    inferenceConfig: InferenceConfig,
): Promise<boolean> {
  switch (endpoint.path) {

    // -----------------------------
    // ZL Universe API
    // -----------------------------

    case "/api/v1/models": {
    try {
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
    } catch (error) {
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 500,
                body: {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch models",
                },
            }),
        );

        return false;
    }
}
    case "/api/v1/chat": {
    if (!selectedLoadedModel) {
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 400,
                body: {
                    error: "No model selected.",
                },
            }),
        );
        return false;
    }
    try {
        const response =
            await container.localServer.localServerService.chat({
                model: selectedLoadedModel.model_id,
                messages: [
                    {
                        role: "system",
                        content:inferenceConfig.systemPrompt || "Follow the instructions carefully and answer the question.",
                    },
                    {
                        role: "user",
                        content: "Describe India.",
                    },
                ],
                max_completion_tokens: 1024,
                temperature: inferenceConfig.temperature,
                top_p: 0.95,
                top_k: inferenceConfig.topK,
                repetition_penalty: 1.1,
                seed: null,
                stream: false,
                stream_options: null,
                n: 1,
                store: false,
            });
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 200,
                body: response,
            }),
        );
        return true;
    } catch (error) {
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 500,
                body: {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
            }),
        );
        return false;
    }
}

  case "/api/v1/models/load": {
    console.log("Entered /models/load");
    console.log("selectedModel =", selectedDiscoverModel);
    if (!selectedDiscoverModel) {
        return false;
    }
    await container.localServer.localServerService.loadModel(
        selectedDiscoverModel.id,
        selectedDiscoverModel.hfRepository,
    );
    dispatch(
        apiResponseReceived({
            endpoint: endpoint.path,
            method: endpoint.method,
            status: 200,
            body: {
                message: `Loaded ${selectedDiscoverModel.displayName}`,
            },
        }),
  );
    return true;
}

  case "/api/v1/models/download": {
    if (!selectedDiscoverModel) {
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 400,
                body: {
                    error: "No model selected.",
                },
            }),
        );
        return false;
    }
    const variant =
        selectedDiscoverModel.variants.find(
            variant => variant.recommended,
        ) ??
        selectedDiscoverModel.variants[0];
    if (!variant) {
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 400,
                body: {
                    error: "No downloadable variant found.",
                },
            }),
        );
        return false;
    }
    try {
        const download =
            await container.downloadRepository.enqueue({
                modelId:
                    selectedDiscoverModel.id,
                hfRepository:
                    selectedDiscoverModel.hfRepository,
                quantization:
                    variant.quantization,
                sizeBytes:
                    variant.sizeBytes,
            });
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 200,
                body: download,
            }),
        );
        return true;
    } catch (error) {
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 500,
                body: {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to start download.",
                },
            }),
        );
        return false;
    }
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

    if (!selectedLoadedModel) {
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 400,
                body: {
                    error: "No model selected.",
                },
            }),
        );

        return false;
    }

    try {

        const response =
            await container.localServer.localServerService.chat({
                model: selectedLoadedModel.model_id,

                messages: [
                    {
                        role: "system",
                        content: "You are a teacher explaining to a class.",
                    },
                    {
                        role: "user",
                        content: "Where is Bangalore?",
                    },
                ],

                max_completion_tokens: 1024,

                temperature: 0.6,

                top_p: 0.95,

                top_k: 20,

                repetition_penalty: 1.1,

                seed: null,

                stream: false,

                stream_options: null,

                n: 1,

                store: false,
            });

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 200,
                body: response,
            }),
        );

        return true;

    } catch (error) {

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 500,
                body: {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
            }),
        );

        return false;
    }
}
    case "/v1/embeddings": {

    try {

        const response =
            await container.localServer.localServerService.embeddings({
                model: "sentence-transformers/all-MiniLM-L6-v2",
                input: "Capital of India is?",
            });

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 200,
                body: response,
            }),
        );

        return true;

    } catch (error) {

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 500,
                body: {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
            }),
        );

        return false;
    }
}

    case "/v1/completions": {

    if (!selectedLoadedModel) {
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 400,
                body: {
                    error: "No model selected.",
                },
            }),
        );

        return false;
    }

    try {

        const response =
            await container.localServer.localServerService.completions({
                model: selectedLoadedModel.model_id,
                prompt: "The capital of India is",
                max_tokens: 1024,
                temperature: 0.6,
                top_p: 0.95,
                stream: false,
            });

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 200,
                body: response,
            }),
        );

        return true;

    } catch (error) {

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 500,
                body: {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
            }),
        );

        return false;
    }
}
    case "/v1/responses": {
        console.log("OpenAI Responses");
        return true;
    }

    // -----------------------------
    // Anthropic Compatible
    // -----------------------------
    case "/v1/messages": {

    if (!selectedLoadedModel) {
        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 400,
                body: {
                    error: "No model selected.",
                },
            }),
        );

        return false;
    }

    try {

        const response =
            await container.localServer.localServerService.chat({
                model: selectedLoadedModel.model_id,
                messages: [
                    {
                        role: "user",
                        content: "Where is Bangalore?",
                    },
                ],
                max_completion_tokens: 1024,
                temperature: 0.6,
                top_p: 0.95,
                top_k: 20,
                repetition_penalty: 1.1,
                seed: null,
                stream: false,
                stream_options: null,
                n: 1,
                store: false,
            });

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 200,
                body: response,
            }),
        );

        return true;

    } catch (error) {

        dispatch(
            apiResponseReceived({
                endpoint: endpoint.path,
                method: endpoint.method,
                status: 500,
                body: {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
            }),
        );

        return false;
    }
}
    default:
        break;
  }
  return false;
}

function EndpointRow({ endpoint }: { readonly endpoint: Endpoint }) {
  const { models } = useModels();
  const dispatch = useAppDispatch();
  const container = useContainer();
  const selectedModelId =
    useAppSelector(selectSelectedModelId);
  const selectedDiscoverModel =
    models.find(
        model => model.id === selectedModelId,
    );
  const loadedModels = useLoadedModels();
  const inferenceConfig =
    useAppSelector(selectInferenceConfig);
  const selectedModel =
    loadedModels.find(
        model => model.status === "READY",
    );
  const serverStatus =
    useAppSelector(selectServerStatus);

  const canTry =
    serverStatus === "running";

  // -----------------------------
  // DEBUG
  // -----------------------------
  const onTry = async () => {
    if (!canTry) return;

    const handled =
      await executeEndpoint(
        endpoint,
        container,
        dispatch,
        selectedDiscoverModel,
        selectedModel,
        inferenceConfig,
      );

    console.log("Handled:", handled);

    if (handled) return;

    const sim =
      simulatedResponseFor(endpoint);

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
          "w-12 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold",
          METHOD_CLASSES[endpoint.method],
        )}
      >
        {endpoint.method}
      </span>

      <span className="flex-1 font-mono text-xs text-fg-default">
        {endpoint.path}
      </span>

      <Tooltip
        content={
          canTry
            ? "Simulate a request to this endpoint"
            : "Start the server to try endpoints"
        }
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

      <Tooltip
        content={endpoint.description}
        side="left"
      >
        <span className="cursor-help text-fg-subtle">
          <Icon icon={Info} size="xs" />
        </span>
      </Tooltip>
    </div>
  );
}