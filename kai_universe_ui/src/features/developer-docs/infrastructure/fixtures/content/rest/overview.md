# ZL Universe API

ZL Universe's REST API for local inference and model management

ZL Universe offers a powerful REST API with first-class support for local inference and model management. In addition to our native API, we provide OpenAI-compatible endpoints and Anthropic-compatible endpoints.

## What's new

Previously, there was a v0 REST API. With ZL Universe 0.4.0, we have officially released our native v1 REST API at `/api/v1/*` endpoints and recommend using it.

The v1 REST API includes enhanced features such as:

- MCP via API
- Stateful chats
- Authentication configuration with API tokens
- Model download, load and unload endpoints

## Supported endpoints

The following endpoints are available in ZL Universe's v1 REST API.

| Endpoint | Method | Docs |
|----------|--------|------|
| `/api/v1/chat` | POST | [Chat](/docs/developer/rest/chat) |
| `/api/v1/models` | GET | [List Models](/docs/developer/rest/list) |
| `/api/v1/models/load` | POST | [Load](/docs/developer/rest/load) |
| `/api/v1/models/unload` | POST | [Unload](/docs/developer/rest/unload) |
| `/api/v1/models/download` | POST | [Download](/docs/developer/rest/download) |
| `/api/v1/models/download/status` | GET | [Download Status](/docs/developer/rest/download-status) |

## Inference endpoint comparison

The table below compares the features of ZL Universe's `/api/v1/chat` endpoint with OpenAI-compatible and Anthropic-compatible inference endpoints.

| Feature | `/api/v1/chat` | `/v1/responses` | `/v1/chat/completions` | `/v1/messages` |
|---------|------|------|------|------|
| Streaming | ✅ | ✅ | ✅ | ✅ |
| Stateful chat | ✅ | ✅ | ❌ | ❌ |
| Remote MCPs | ✅ | ✅ | ❌ | ❌ |
| MCPs you have in ZL Universe | ✅ | ✅ | ❌ | ❌ |
| Custom tools | ❌ | ✅ | ✅ | ✅ |
| Include assistant messages in the request | ❌ | ✅ | ✅ | ✅ |
| Model load streaming events | ✅ | ❌ | ❌ | ❌ |
| Prompt processing streaming events | ✅ | ❌ | ❌ | ❌ |
| Specify context length in the request | ✅ | ❌ | ❌ | ❌ |

Please report bugs by opening an issue on [Github](https://github.com/zluniverse-ai/zluniverse-bug-tracker/issues).
