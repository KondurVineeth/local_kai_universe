# ZL Universe Developer Docs

Build with ZL Universe's local APIs and SDKs — TypeScript, Python, REST, and OpenAI and Anthropic-compatible endpoints.

## Get to know the stack

### TypeScript SDK: zluniverse-js

Use the TypeScript SDK to build apps, tools, and local AI workflows.

### Python SDK: zluniverse-python

Work with local models from Python scripts, notebooks, and backend services.

### ZL Universe REST API

Use stateful chats, local server endpoints, and MCPs via HTTP.

### OpenAI-compatible

Use chat, responses, embeddings, and other familiar OpenAI-style endpoints.

### Anthropic-compatible

Use Claude-style Messages API flows against your local ZL Universe server.

### ZL Universe CLI: lms

Download models, run the daemon, start the server, and script local workflows.

## What you can build

### Chat and text generation with streaming

Build local chat apps and text-generation flows with token streaming.

### Tool calling and local agents with MCP

Connect tools, MCP servers, and agent-like workflows entirely on your machine.

### Structured output (JSON schema)

Generate typed JSON outputs that validate against a schema.

### Embeddings and tokenization

Create embeddings, inspect tokens, and build retrieval or indexing pipelines.

### Model management (load, download, list)

Load models into memory, download new ones, and inspect what is available.

## Install `llmster` for headless deployments

`llmster` is ZL Universe's core, packaged as a daemon for headless deployment on servers, cloud instances, or CI. The daemon runs standalone and is not dependent on the ZL Universe GUI.

**Mac / Linux**

```bash
curl -fsSL https://zluniverse.ai/install.sh | bash
```

**Windows**

```bash
irm https://zluniverse.ai/install.ps1 | iex
```

**Basic usage**

```bash
lms daemon up          # Start the daemon
lms get <model>        # Download a model
lms server start       # Start the local server
lms chat               # Open an interactive session
```

Learn more: [Headless deployments](/blog/0.4.0#deploy-on-servers-deploy-in-ci-deploy-anywhere)

## Super quick start

### TypeScript (`zluniverse-js`)

```bash
npm install @zluniverse/sdk
```

```javascript
import { ZLUniverseClient } from "@zluniverse/sdk";

const client = new ZLUniverseClient();
const model = await client.llm.model("openai/gpt-oss-20b");
const result = await model.respond("Who are you, and what can you do?");

console.info(result.content);
```

Full docs: [zluniverse-js](/docs/typescript), Source: [GitHub](https://github.com/zluniverse-ai/zluniverse-js)

### Python (`zluniverse-python`)

```bash
pip install zluniverse
```

```python
import zluniverse as lms

with lms.Client() as client:
    model = client.llm.model("openai/gpt-oss-20b")
    result = model.respond("Who are you, and what can you do?")
    print(result)
```

Full docs: [zluniverse-python](/docs/python), Source: [GitHub](https://github.com/zluniverse-ai/zluniverse-python)

### HTTP (ZL Universe REST API)

```bash
lms server start --port 1234
```

```bash
curl http://localhost:1234/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "input": "Who are you, and what can you do?"
  }'
```

Full docs: [ZL Universe REST API](/docs/developer/rest)

## Helpful links

- [API Changelog](/docs/developer/api-changelog)
- [Local server basics](/docs/developer/core/server)
- [CLI reference](/docs/cli)
- [Discord Community](https://discord.gg/zluniverse)
