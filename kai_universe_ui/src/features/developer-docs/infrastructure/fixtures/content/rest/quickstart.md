# Get up and running with the ZL Universe API

Download a model and start a simple Chat session using the REST API

## Start the server

[Install](/download) and launch ZL Universe.

Then ensure the server is running through the toggle at the top left of the Developer page, or through [lms](/docs/cli) in the terminal:

```bash
lms server start
```

By default, the server is available at `http://localhost:1234`.

If you don't have a model downloaded yet, you can download the model:

```bash
lms get ibm/granite-4-micro
```

## API Authentication

By default, the ZL Universe API server does **not** require authentication. You can configure the server to require authentication by API token in the server settings for added security.

To authenticate API requests, generate an API token from the Developer page in ZL Universe, and include it in the `Authorization` header of your requests as follows: `Authorization: Bearer $LM_API_TOKEN`. Read more about authentication [here](/docs/developer/core/authentication).

## Chat with a model

Use the chat endpoint to send a message to a model. By default, the model will be automatically loaded if it is not already.

The `/api/v1/chat` endpoint is stateful, which means you do not need to pass the full history in every request. Read more about it [here](/docs/developer/rest/stateful-chats).

```bash
curl http://localhost:1234/api/v1/chat \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ibm/granite-4-micro",
    "input": "Write a short haiku about sunrise."
  }'
```

See the full [chat](/docs/developer/rest/chat) docs for more details.

## Use MCP servers via API

Enable the model interact with ephemeral Model Context Protocol (MCP) servers in `/api/v1/chat` by specifying servers in the `integrations` field.

```bash
curl http://localhost:1234/api/v1/chat \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ibm/granite-4-micro",
    "input": "What is the top trending model on hugging face?",
    "integrations": [
      {
        "type": "ephemeral_mcp",
        "server_label": "huggingface",
        "server_url": "https://huggingface.co/mcp",
        "allowed_tools": ["model_search"]
      }
    ],
    "context_length": 8000
  }'
```

You can also use locally configured MCP plugins (from your `mcp.json`) via the `integrations` field. Using locally run MCP plugins requires authentication via an API token passed through the `Authorization` header. Read more about authentication [here](/docs/developer/core/authentication).

```bash
curl http://localhost:1234/api/v1/chat \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ibm/granite-4-micro",
    "input": "Open zluniverse.ai",
    "integrations": [
      {
        "type": "plugin",
        "id": "mcp/playwright",
        "allowed_tools": ["browser_navigate"]
      }
    ],
    "context_length": 8000
  }'
```

See the full [chat](/docs/developer/rest/chat) docs for more details.

## Download a model

Use the download endpoint to download models by identifier from the [ZL Universe model catalog](https://zluniverse.ai/models), or by Hugging Face model URL.

```bash
curl http://localhost:1234/api/v1/models/download \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ibm/granite-4-micro"
  }'
```

The response will return a `job_id` that you can use to track download progress.

```bash
curl -H "Authorization: Bearer $LM_API_TOKEN" \
  http://localhost:1234/api/v1/models/download/status/{job_id}
```

See the [download](/docs/developer/rest/download) and [download status](/docs/developer/rest/download-status) docs for more details.
