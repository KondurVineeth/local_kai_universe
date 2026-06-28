# Stateful Chats

Learn how to maintain conversation context across multiple requests

The `/api/v1/chat` endpoint is stateful by default. This means you don't need to pass the full conversation history in every request — ZL Universe automatically stores and manages the context for you.

## How it works

When you send a chat request, ZL Universe stores the conversation in a chat thread and returns a `response_id` in the response. Use this `response_id` in subsequent requests to continue the conversation.

### Start a new conversation

```bash
curl http://localhost:1234/api/v1/chat \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ibm/granite-4-micro",
    "input": "My favorite color is blue."
  }'
```

The response includes a `response_id`:

> [!INFO]
> Every response includes a unique `response_id` that you can use to reference that specific point in the conversation for future requests. This allows you to branch conversations.

```json
{
  "model_instance_id": "ibm/granite-4-micro",
  "output": [
    {
      "type": "message",
      "content": "That's great! Blue is a beautiful color..."
    }
  ],
  "response_id": "resp_abc123xyz..."
}
```

## Continue a conversation

Pass the `previous_response_id` in your next request to continue the conversation. The model will remember the previous context.

```bash
curl http://localhost:1234/api/v1/chat \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ibm/granite-4-micro",
    "input": "What color did I just mention?",
    "previous_response_id": "resp_abc123xyz..."
  }'
```

The model can reference the previous message without you needing to resend it and will return a new `response_id` for further continuation.

## Disable stateful storage

If you don't want to store the conversation, set `store` to `false`. The response will not include a `response_id`.

```bash
curl http://localhost:1234/api/v1/chat \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ibm/granite-4-micro",
    "input": "Tell me a joke.",
    "store": false
  }'
```

This is useful for one-off requests where you don't need to maintain context.
