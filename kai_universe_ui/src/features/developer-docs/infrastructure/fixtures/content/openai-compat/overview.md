# OpenAI Compatibility Endpoints

Send requests to Responses, Chat Completions (text and images), Completions, and Embeddings endpoints.

## Supported endpoints

| Endpoint | Method | Docs |
|----------|--------|------|
| `/v1/models` | GET | [Models](/docs/developer/openai-compat/models) |
| `/v1/responses` | POST | [Responses](/docs/developer/openai-compat/responses) |
| `/v1/chat/completions` | POST | [Chat Completions](/docs/developer/openai-compat/chat-completions) |
| `/v1/embeddings` | POST | [Embeddings](/docs/developer/openai-compat/embeddings) |
| `/v1/completions` | POST | [Completions](/docs/developer/openai-compat/completions) |

## Set the base url to point to ZL Universe

You can reuse existing OpenAI clients (in Python, JS, C#, etc.) by switching up the "base URL" property to point to your ZL Universe instead of OpenAI's servers.

Note: The following examples assume the server port is `1234`.

### Python Example

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1"
)
```

### Typescript Example

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseUrl: "http://localhost:1234/v1"
});
```

### cURL Example

```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "use the model identifier from ZL Universe here",
    "messages": [{"role": "user", "content": "Say this is a test!"}],
    "temperature": 0.7
  }'
```

## Using Codex with ZL Universe

Codex is supported because ZL Universe implements the OpenAI-compatible `POST /v1/responses` endpoint.

See: [Use Codex with ZL Universe](/docs/integrations/codex) and [Responses](/docs/developer/openai-compat/responses).

---

Other OpenAI client libraries should have similar options to set the base URL.

If you're running into trouble, hop onto our [Discord](https://discord.gg/zluniverse) and enter the `#🔨-developers` channel.
