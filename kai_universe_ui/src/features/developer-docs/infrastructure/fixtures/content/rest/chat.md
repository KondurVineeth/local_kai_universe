# Chat with a model

Send a message to a model and receive a response. Supports MCP integration.

`POST /api/v1/chat`

## Request body

**model** : string — Unique identifier for the model to use.

**input** : string | array<object> — Message to send to the model.

- **Input text** : string — Text content of the message.
- **Input object** : object — Object representing a message with additional metadata.
  - **Text Input** : `type: "message"`, `content: string`
  - **Image Input** : `type: "image"`, `data_url: string` (base64-encoded data URL)

**system_prompt** (optional) : string — System message that sets model behavior or instructions.

**integrations** (optional) : array<string | object> — List of integrations (plugins, ephemeral MCP servers, etc.) to enable for this request.

- **Plugin id** : string
- **Plugin** : object — `type: "plugin"`, `id: string`, `allowed_tools?: string[]`
- **Ephemeral MCP server specification** : object — `type: "ephemeral_mcp"`, `server_label`, `server_url`, `allowed_tools?`, `headers?`

**stream** (optional) : boolean — Whether to stream partial outputs via SSE. Default `false`.

**temperature** (optional) : number — Randomness in token selection. 0 is deterministic, higher values increase creativity [0,1].

**top_p** (optional) : number — Minimum cumulative probability for the possible next tokens [0,1].

**top_k** (optional) : integer — Limits next token selection to top-k most probable tokens.

**min_p** (optional) : number — Minimum base probability for a token to be selected for output [0,1].

**repeat_penalty** (optional) : number — Penalty for repeating token sequences. 1 is no penalty, higher values discourage repetition.

**max_output_tokens** (optional) : integer — Maximum number of tokens to generate.

**reasoning** (optional) : "off" | "low" | "medium" | "high" | "on" — Reasoning setting. Will error if the model does not support the setting.

**context_length** (optional) : integer — Number of tokens to consider as context. Higher values recommended for MCP usage.

**store** (optional) : boolean — Whether to store the chat. If set, response will return a `"response_id"` field. Default `true`.

**previous_response_id** (optional) : string — Identifier of existing response to append to. Must start with `"resp_"`.

### Example request

```bash
curl http://localhost:1234/api/v1/chat \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ibm/granite-4-micro",
    "input": "Tell me the top trending model on hugging face and navigate to https://zluniverse.ai",
    "integrations": [
      {
        "type": "ephemeral_mcp",
        "server_label": "huggingface",
        "server_url": "https://huggingface.co/mcp",
        "allowed_tools": ["model_search"]
      },
      {
        "type": "plugin",
        "id": "mcp/playwright",
        "allowed_tools": ["browser_navigate"]
      }
    ],
    "context_length": 8000,
    "temperature": 0
  }'
```

## Response fields

**model_instance_id** : string — Unique identifier for the loaded model instance that generated the response.

**output** : array<object> — Array of output items generated. Each item can be one of several types: Message, Tool call, Reasoning, Invalid tool call.

**stats** : object — Token usage and performance metrics.

- `input_tokens` : number
- `total_output_tokens` : number
- `reasoning_output_tokens` : number
- `tokens_per_second` : number
- `time_to_first_token_seconds` : number
- `model_load_time_seconds` (optional) : number

**response_id** (optional) : string — Identifier of the response for subsequent requests. Starts with `"resp_"`. Present when `store` is `true`.

### Example response

```json
{
  "model_instance_id": "ibm/granite-4-micro",
  "output": [
    {
      "type": "tool_call",
      "tool": "model_search",
      "arguments": { "sort": "trendingScore", "query": "", "limit": 1 },
      "output": "...",
      "provider_info": { "server_label": "huggingface", "type": "ephemeral_mcp" }
    },
    { "type": "message", "content": "..." },
    {
      "type": "tool_call",
      "tool": "browser_navigate",
      "arguments": { "url": "https://zluniverse.ai" },
      "output": "...",
      "provider_info": { "plugin_id": "mcp/playwright", "type": "plugin" }
    },
    { "type": "message", "content": "**Top Trending Model on Hugging Face** ..." }
  ],
  "stats": {
    "input_tokens": 646,
    "total_output_tokens": 586,
    "reasoning_output_tokens": 0,
    "tokens_per_second": 29.753900615398926,
    "time_to_first_token_seconds": 1.088,
    "model_load_time_seconds": 2.656
  },
  "response_id": "resp_4ef013eba0def1ed23f19dde72b67974c579113f544086de"
}
```
