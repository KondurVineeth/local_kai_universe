# Anthropic Compatibility Endpoints

Send requests to Anthropic-compatible Messages endpoints.

## Supported endpoints

| Endpoint | Method | Docs |
|----------|--------|------|
| `/v1/messages` | POST | [Messages](/docs/developer/anthropic-compat/messages) |

## Using Claude Code with ZL Universe

For a full walkthrough, see: [Use Claude Code with ZL Universe](/docs/integrations/claude-code).

```bash
export ANTHROPIC_BASE_URL=http://localhost:1234
export ANTHROPIC_AUTH_TOKEN=zluniverse
claude --model openai/gpt-oss-20b
```

## Authentication headers

When Require Authentication is enabled, ZL Universe accepts both `x-api-key` and the standard `Authorization: Bearer <token>` header. To learn more about enabling auth in ZL Universe, see [Authentication](/docs/developer/core/authentication).

## Set the base URL to point to ZL Universe

Point your Anthropic client, or any HTTP request, at your local ZL Universe server.

Note: The following examples assume the server port is `1234`.

### cURL example

```bash
curl http://localhost:1234/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $LM_API_TOKEN" \
  -d '{
    "model": "ibm/granite-4-micro",
    "max_tokens": 256,
    "messages": [
      {"role": "user", "content": "Write a haiku about local LLMs."}
    ]
  }'
```

### Python example

```python
from anthropic import Anthropic

client = Anthropic(
    base_url="http://localhost:1234",
    api_key="zluniverse",
)

message = client.messages.create(
    max_tokens=1024,
    messages=[
        { "role": "user", "content": "Hello from ZL Universe" }
    ],
    model="ibm/granite-4-micro",
)

print(message.content)
```

If you have not enabled Require Authentication, the `x-api-key` header is optional. For the Python example, you can also omit `api_key` when authentication is disabled.

If you're running into trouble, hop onto our [Discord](https://discord.gg/zluniverse) and enter the developers channel.
