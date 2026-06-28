# Tool Use

Tool use enables LLMs to request calls to external functions and APIs through the `/v1/chat/completions` and `v1/responses` endpoints, expanding their functionality far beyond text output.

## Quick Start

### Start ZL Universe as a server

To use ZL Universe programmatically, run it as a local server.

You can turn on the server from the "Developer" tab in ZL Universe, or via the `lms` CLI:

```bash
lms server start
```

Install `lms` by running `npx zluniverse install-cli`.

This allows interaction with ZL Universe via the REST API. For an intro to ZL Universe's REST API, see [REST API Overview](/docs/developer/rest).

### Load a Model

You can load a model from the "Chat" or "Developer" tabs in ZL Universe, or via the `lms` CLI:

```bash
lms load
```

## Tool Use

### What really is "Tool Use"?

Tool use describes:

- LLMs output text requesting functions to be called (LLMs cannot directly execute code)
- Your code executes those functions
- Your code feeds the results back to the LLM

### High-level flow

ZL Universe supports tool use through the `/v1/chat/completions` endpoint when given function definitions in the `tools` parameter. Tools are specified as an array of function definitions describing their parameters and usage, following the same format as OpenAI's [Function Calling](https://platform.openai.com/docs/guides/function-calling) API.

1. You provide a list of tools to an LLM:

```json
[
  {
    "type": "function",
    "function": {
      "name": "get_delivery_date",
      "description": "Get the delivery date for a customer's order",
      "parameters": {
        "type": "object",
        "properties": {
          "order_id": { "type": "string" }
        },
        "required": ["order_id"]
      }
    }
  }
]
```

> [!IMPORTANT]
> The model can only _request_ calls to these tools because LLMs _cannot_ directly call functions, APIs, or any other tools. They can only output text, which can then be parsed to programmatically call the functions.

2. When prompted, the LLM can decide to call one or more tools, or respond normally.

3. ZL Universe parses the text output from the model into an OpenAI-compliant `chat.completion` response object.

4. Your code parses the response, calls the appropriate tools, and adds both the model's tool call message and the result to the `messages` array.

5. The LLM is then prompted again with the updated messages array.

## Supported Models

Through ZL Universe, **all** models support at least some degree of tool use. However, there are currently two levels of support:

### Native tool use support

"Native" tool use support means that both:

1. The model has a chat template that supports tool use.
2. ZL Universe supports that model's tool use format.

Models that currently have native tool use support in ZL Universe include Qwen, Llama-3.1/3.2, Mistral, and others.

### Default tool use support

"Default" tool use support means the model does not have a chat template that supports tool use, or ZL Universe does not currently support that model's tool use format. Under the hood, default tool use gives models a custom system prompt with a tool call format:

```
You are a tool-calling AI. You can request calls to available tools with this EXACT format:
[TOOL_REQUEST]{"name": "tool_name", "arguments": {"param1": "value1"}}[END_TOOL_REQUEST]
```

## Example using `curl`

```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "zluniverse-community/qwen2.5-7b-instruct",
    "messages": [{"role": "user", "content": "What dell products do you have under $50 in electronics?"}],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "search_products",
          "description": "Search the product catalog by various criteria.",
          "parameters": {
            "type": "object",
            "properties": {
              "query": { "type": "string", "description": "Search terms or product name" },
              "category": {
                "type": "string",
                "enum": ["electronics", "clothing", "home", "outdoor"]
              },
              "max_price": { "type": "number" }
            },
            "required": ["query"],
            "additionalProperties": false
          }
        }
      }
    ]
  }'
```

If the model decides to call a tool, an array of tool call request objects will be provided in the response field `choices[0].message.tool_calls`, and `finish_reason` will be `"tool_calls"`.

## Single-turn example (Python)

```python
import json
from openai import OpenAI

client = OpenAI(base_url="http://localhost:1234/v1", api_key="zl-universe")

def say_hello(name: str) -> str:
    print(f"Hello, {name}!")

tools = [
    {
        "type": "function",
        "function": {
            "name": "say_hello",
            "description": "Says hello to someone",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": { "type": "string", "description": "The person's name" }
                },
                "required": ["name"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="zluniverse-community/qwen2.5-7b-instruct",
    messages=[{ "role": "user", "content": "Can you say hello to Bob the Builder?" }],
    tools=tools
)

tool_call = response.choices[0].message.tool_calls[0]
name = json.loads(tool_call.function.arguments)["name"]
say_hello(name)
```

For a complete multi-turn example with `get_delivery_date` and an advanced agent example with safe-URL browsing, current-time lookup, and directory analysis, see the full guide on zluniverse.ai/docs.
