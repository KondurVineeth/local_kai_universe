# Streaming events

Streaming events let you render chat responses incrementally over Server-Sent Events (SSE). When you call `POST /api/v1/chat` with `stream: true`, the server emits a series of named events that you can consume. These events arrive in order and may include multiple deltas (for reasoning and message content), tool call boundaries and payloads, and any errors encountered. The stream always begins with `chat.start` and concludes with `chat.end`, which contains the aggregated result equivalent to a non-streaming response.

List of event types that can be sent in an `/api/v1/chat` response stream:

- `chat.start`
- `model_load.start`
- `model_load.progress`
- `model_load.end`
- `prompt_processing.start`
- `prompt_processing.progress`
- `prompt_processing.end`
- `reasoning.start`
- `reasoning.delta`
- `reasoning.end`
- `tool_call.start`
- `tool_call.arguments`
- `tool_call.success`
- `tool_call.failure`
- `message.start`
- `message.delta`
- `message.end`
- `error`
- `chat.end`

Events will be streamed out in the following raw format:

```
event: <event type>
data: <JSON event data>
```

## `chat.start`

An event that is emitted at the start of a chat response stream.

**model_instance_id** : string
Unique identifier for the loaded model instance that will generate the response.

**type** : "chat.start"
The type of the event. Always `chat.start`.

Example Event Data:
```json
{
  "type": "chat.start",
  "model_instance_id": "openai/gpt-oss-20b"
}
```

## `model_load.start`

Signals the start of a model being loaded to fulfill the chat request. Will not be emitted if the requested model is already loaded.

**model_instance_id** : string
Unique identifier for the model instance being loaded.

**type** : "model_load.start"
The type of the event. Always `model_load.start`.

Example Event Data:
```json
{
  "type": "model_load.start",
  "model_instance_id": "openai/gpt-oss-20b"
}
```

## `model_load.progress`

Progress of the model load.

**model_instance_id** : string
Unique identifier for the model instance being loaded.

**progress** : number
Progress of the model load as a float between `0` and `1`.

**type** : "model_load.progress"
The type of the event. Always `model_load.progress`.

Example Event Data:
```json
{
  "type": "model_load.progress",
  "model_instance_id": "openai/gpt-oss-20b",
  "progress": 0.65
}
```

## `model_load.end`

Signals a successfully completed model load.

**model_instance_id** : string
Unique identifier for the model instance that was loaded.

**load_time_seconds** : number
Time taken to load the model in seconds.

**type** : "model_load.end"
The type of the event. Always `model_load.end`.

Example Event Data:
```json
{
  "type": "model_load.end",
  "model_instance_id": "openai/gpt-oss-20b",
  "load_time_seconds": 12.34
}
```

## `prompt_processing.start`

Signals the start of the model processing a prompt.

**type** : "prompt_processing.start"
The type of the event. Always `prompt_processing.start`.

Example Event Data:
```json
{
  "type": "prompt_processing.start"
}
```

## `prompt_processing.progress`

Progress of the model processing a prompt.

**progress** : number
Progress of the prompt processing as a float between `0` and `1`.

**type** : "prompt_processing.progress"
The type of the event. Always `prompt_processing.progress`.

Example Event Data:
```json
{
  "type": "prompt_processing.progress",
  "progress": 0.5
}
```

## `prompt_processing.end`

Signals the end of the model processing a prompt.

**type** : "prompt_processing.end"
The type of the event. Always `prompt_processing.end`.

Example Event Data:
```json
{
  "type": "prompt_processing.end"
}
```

## `reasoning.start`

Signals the model is starting to stream reasoning content.

**type** : "reasoning.start"
The type of the event. Always `reasoning.start`.

Example Event Data:
```json
{
  "type": "reasoning.start"
}
```

## `reasoning.delta`

A chunk of reasoning content. Multiple deltas may arrive.

**content** : string
Reasoning text fragment.

**type** : "reasoning.delta"
The type of the event. Always `reasoning.delta`.

Example Event Data:
```json
{
  "type": "reasoning.delta",
  "content": "Need to"
}
```

## `reasoning.end`

Signals the end of the reasoning stream.

**type** : "reasoning.end"
The type of the event. Always `reasoning.end`.

Example Event Data:
```json
{
  "type": "reasoning.end"
}
```

## `tool_call.start`

Emitted when the model starts a tool call.

**tool** : string — Name of the tool being called.

**provider_info** : object — Information about the tool provider. Discriminated union upon possible provider types.

**type** : "tool_call.start"

Example Event Data:
```json
{
  "type": "tool_call.start",
  "tool": "model_search",
  "provider_info": {
    "type": "ephemeral_mcp",
    "server_label": "huggingface"
  }
}
```

## `tool_call.arguments`

Arguments streamed for the current tool call.

**tool** : string — Name of the tool being called.

**arguments** : object — Arguments passed to the tool.

**provider_info** : object — Information about the tool provider.

**type** : "tool_call.arguments"

Example Event Data:
```json
{
  "type": "tool_call.arguments",
  "tool": "model_search",
  "arguments": {
    "sort": "trendingScore",
    "limit": 1
  },
  "provider_info": {
    "type": "ephemeral_mcp",
    "server_label": "huggingface"
  }
}
```

## `tool_call.success`

Result of the tool call, along with the arguments used.

Example Event Data:
```json
{
  "type": "tool_call.success",
  "tool": "model_search",
  "arguments": { "sort": "trendingScore", "limit": 1 },
  "output": "[{\"type\":\"text\",\"text\":\"Showing first 1 models...\"}]",
  "provider_info": {
    "type": "ephemeral_mcp",
    "server_label": "huggingface"
  }
}
```

## `tool_call.failure`

Indicates that the tool call failed.

**reason** : string — Reason for the tool call failure.

**metadata** : object — Metadata about the invalid tool call.

Example Event Data:
```json
{
  "type": "tool_call.failure",
  "reason": "Cannot find tool with name open_browser.",
  "metadata": {
    "type": "invalid_name",
    "tool_name": "open_browser"
  }
}
```

## `message.start` / `message.delta` / `message.end`

Signal the start, chunks, and end of a message body the model streams to the client.

```json
{ "type": "message.start" }
{ "type": "message.delta", "content": "The current" }
{ "type": "message.end" }
```

## `error`

An error occurred during streaming. The final payload will still be sent in `chat.end` with whatever was generated.

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request",
    "message": "\"model\" is required",
    "code": "missing_required_parameter",
    "param": "model"
  }
}
```

## `chat.end`

Final event containing the full aggregated response, equivalent to the non-streaming `POST /api/v1/chat` response body.

```json
{
  "type": "chat.end",
  "result": {
    "model_instance_id": "openai/gpt-oss-20b",
    "output": [
      { "type": "reasoning", "content": "Need to call function." },
      {
        "type": "tool_call",
        "tool": "model_search",
        "arguments": { "sort": "trendingScore", "limit": 1 },
        "output": "[{\"type\":\"text\",\"text\":\"Showing first 1 models...\"}]",
        "provider_info": { "type": "ephemeral_mcp", "server_label": "huggingface" }
      },
      { "type": "message", "content": "The current top-trending model is..." }
    ],
    "stats": {
      "input_tokens": 329,
      "total_output_tokens": 268,
      "reasoning_output_tokens": 5,
      "tokens_per_second": 43.73,
      "time_to_first_token_seconds": 0.781
    },
    "response_id": "resp_02b2017dbc06c12bfc353a2ed6c2b802f8cc682884bb5716"
  }
}
```
