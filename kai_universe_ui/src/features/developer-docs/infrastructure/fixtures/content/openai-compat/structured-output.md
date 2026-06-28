# Structured Output

Enforce LLM response formats using JSON schemas.

You can enforce a particular response format from an LLM by providing a JSON schema to the `/v1/chat/completions` endpoint, via ZL Universe's REST API (or via any OpenAI client).

## Start ZL Universe as a server

To use ZL Universe programmatically from your own code, run ZL Universe as a local server.

You can turn on the server from the "Developer" tab in ZL Universe, or via the `lms` CLI:

```bash
lms server start
```

Install `lms` by running `npx zluniverse install-cli`.

This will allow you to interact with ZL Universe via the REST API. For an intro to ZL Universe's REST API, see [REST API Overview](/docs/developer/rest).

## Structured Output

The API supports structured JSON outputs through the `/v1/chat/completions` endpoint when given a JSON schema. This capability follows the same format as OpenAI's Structured Output API and works with OpenAI client SDKs.

### Example using `curl`

```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "{{model}}",
    "messages": [
      { "role": "system", "content": "You are a helpful jokester." },
      { "role": "user", "content": "Tell me a joke." }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "joke_response",
        "strict": "true",
        "schema": {
          "type": "object",
          "properties": {
            "joke": { "type": "string" }
          },
          "required": ["joke"]
        }
      }
    },
    "temperature": 0.7,
    "max_tokens": 50,
    "stream": false
  }'
```

All parameters recognized by `/v1/chat/completions` will be honored, and the JSON schema should be provided in the `json_schema` field of `response_format`.

The JSON object will be provided in `string` form in the typical response field, `choices[0].message.content`, and will need to be parsed into a JSON object.

### Example using `python`

```python
from openai import OpenAI
import json

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="zl-universe"
)

messages = [
    { "role": "system", "content": "You are a helpful AI assistant." },
    { "role": "user", "content": "Create 1-3 fictional characters" }
]

character_schema = {
    "type": "json_schema",
    "json_schema": {
        "name": "characters",
        "schema": {
            "type": "object",
            "properties": {
                "characters": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": { "type": "string" },
                            "occupation": { "type": "string" },
                            "personality": { "type": "string" },
                            "background": { "type": "string" }
                        },
                        "required": ["name", "occupation", "personality", "background"]
                    },
                    "minItems": 1
                }
            },
            "required": ["characters"]
        }
    }
}

response = client.chat.completions.create(
    model="your-model",
    messages=messages,
    response_format=character_schema,
)

results = json.loads(response.choices[0].message.content)
print(json.dumps(results, indent=2))
```

> [!INFO]
> Not all models are capable of structured output, particularly LLMs below 7B parameters. Check the model card README if unsure whether your model supports this feature.

## Structured output engine

- For `GGUF` models: utilize `llama.cpp`'s grammar-based sampling APIs.
- For `MLX` models: using [Outlines](https://github.com/dottxt-ai/outlines).

The MLX implementation is available on GitHub: [zluniverse-ai/mlx-engine](https://github.com/zluniverse-ai/mlx-engine).
