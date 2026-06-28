# ZL Universe as a Local LLM API Server

Run an LLM API server on localhost with ZL Universe

You can serve local LLMs from ZL Universe's Developer tab, either on `localhost` or on the network.

ZL Universe's APIs can be used through [REST API](/docs/developer/rest), client libraries like [zluniverse-js](/docs/typescript) and [zluniverse-python](/docs/python), and compatibility endpoints like [OpenAI-compatible](/docs/developer/openai-compat) and [Anthropic-compatible](/docs/developer/anthropic-compat).

## Running the server

To run the server, go to the Developer tab in ZL Universe, and toggle the "Start server" switch to start the API server.

Alternatively, you can use `lms` (ZL Universe's CLI) to start the server from your terminal:

```bash
lms server start
```

## API options

- [ZL Universe REST API](/docs/developer/rest)
- [TypeScript SDK](/docs/typescript) — `zluniverse-js`
- [Python SDK](/docs/python) — `zluniverse-python`
- [OpenAI-compatible endpoints](/docs/developer/openai-compat)
- [Anthropic-compatible endpoints](/docs/developer/anthropic-compat)
