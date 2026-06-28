# REST API v0

The REST API includes enhanced stats such as Token / Second and Time To First Token (TTFT), as well as rich information about models such as loaded vs unloaded, max context, quantization, and more.

> [!NOTE]
> ZL Universe now has a v1 REST API! We recommend using the v1 API for new projects!

Requires ZL Universe 0.3.6 or newer.

ZL Universe now has its own REST API, in addition to OpenAI-compatible endpoints and Anthropic-compatible endpoints.

## Supported API Endpoints

- `GET /api/v0/models` — List available models
- `GET /api/v0/models/{model}` — Get info about a specific model
- `POST /api/v0/chat/completions` — Chat Completions (messages → assistant response)
- `POST /api/v0/completions` — Text Completions (prompt → completion)
- `POST /api/v0/embeddings` — Text Embeddings (text → embedding)

## Start the REST API server

To start the server, run the following command:

```bash
lms server start
```

> [!TIP]
> You can run ZL Universe as a service and get the server to auto-start on boot without launching the GUI. Learn about Headless Mode.

## Endpoints

### `GET /api/v0/models`

List all loaded and downloaded models.

```bash
curl -H "Authorization: Bearer $LM_API_TOKEN" http://localhost:1234/api/v0/models
```

```json
{
  "object": "list",
  "data": [
    {
      "id": "qwen2-vl-7b-instruct",
      "object": "model",
      "type": "vlm",
      "publisher": "mlx-community",
      "arch": "qwen2_vl",
      "compatibility_type": "mlx",
      "quantization": "4bit",
      "state": "not-loaded",
      "max_context_length": 32768
    },
    {
      "id": "meta-llama-3.1-8b-instruct",
      "object": "model",
      "type": "llm",
      "publisher": "zluniverse-community",
      "arch": "llama",
      "compatibility_type": "gguf",
      "quantization": "Q4_K_M",
      "state": "not-loaded",
      "max_context_length": 131072
    }
  ]
}
```

### `GET /api/v0/models/{model}`

Get info about one specific model.

```bash
curl -H "Authorization: Bearer $LM_API_TOKEN" http://localhost:1234/api/v0/models/qwen2-vl-7b-instruct
```

### `POST /api/v0/chat/completions`

Chat Completions API. You provide a messages array and receive the next assistant response in the chat.

```bash
curl http://localhost:1234/api/v0/chat/completions \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "granite-3.0-2b-instruct",
    "messages": [
      { "role": "system", "content": "Always answer in rhymes." },
      { "role": "user", "content": "Introduce yourself." }
    ],
    "temperature": 0.7,
    "max_tokens": -1,
    "stream": false
  }'
```

```json
{
  "id": "chatcmpl-i3gkjwthhw96whukek9tz",
  "object": "chat.completion",
  "created": 1731990317,
  "model": "granite-3.0-2b-instruct",
  "choices": [
    {
      "index": 0,
      "logprobs": null,
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "Greetings, I'm a helpful AI, here to assist..."
      }
    }
  ],
  "usage": { "prompt_tokens": 24, "completion_tokens": 53, "total_tokens": 77 },
  "stats": {
    "tokens_per_second": 51.43709529007664,
    "time_to_first_token": 0.111,
    "generation_time": 0.954,
    "stop_reason": "eosFound"
  },
  "model_info": {
    "arch": "granite",
    "quant": "Q4_K_M",
    "format": "gguf",
    "context_length": 4096
  },
  "runtime": {
    "name": "llama.cpp-mac-arm64-apple-metal-advsimd",
    "version": "1.3.0",
    "supported_formats": ["gguf"]
  }
}
```

### `POST /api/v0/completions`

Text Completions API. You provide a prompt and receive a completion.

```bash
curl http://localhost:1234/api/v0/completions \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "granite-3.0-2b-instruct",
    "prompt": "the meaning of life is",
    "temperature": 0.7,
    "max_tokens": 10,
    "stream": false,
    "stop": "\n"
  }'
```

### `POST /api/v0/embeddings`

Text Embeddings API. You provide a text and a representation of the text as an embedding vector is returned.

```bash
curl http://localhost:1234/api/v0/embeddings \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-nomic-embed-text-v1.5",
    "input": "Some text to embed"
  }'
```

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [-0.0167, 0.0285, -0.1408, 0.0251, -0.0038, -0.0434],
      "index": 0
    }
  ],
  "model": "text-embedding-nomic-embed-text-v1.5@q4_k_m",
  "usage": { "prompt_tokens": 0, "total_tokens": 0 }
}
```

Please report bugs by opening an issue on [Github](https://github.com/zluniverse-ai/zluniverse-bug-tracker/issues).
