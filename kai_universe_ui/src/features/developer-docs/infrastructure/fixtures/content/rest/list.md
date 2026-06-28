# List your models

Get a list of available models on your system, including both LLMs and embedding models.

```
GET /api/v1/models
```

This endpoint has no request parameters.

## Example Request

```bash
curl http://localhost:1234/api/v1/models \
  -H "Authorization: Bearer $LM_API_TOKEN"
```

## Response fields

**models** : array — List of available models (both LLMs and embedding models).

For each model:

- **type** : "llm" | "embedding"
- **publisher** : string — Model publisher name.
- **key** : string — Unique identifier for the model.
- **display_name** : string — Human-readable model name.
- **architecture** (optional) : string | null — Model architecture (e.g., "llama", "mistral"). Absent for embedding models.
- **quantization** : object | null — `name`, `bits_per_weight`.
- **size_bytes** : number
- **params_string** : string | null
- **loaded_instances** : array — Currently loaded instances with `id` and `config` (`context_length`, `eval_batch_size`, `parallel`, `flash_attention`, `num_experts`, `offload_kv_cache_to_gpu`).
- **max_context_length** : number
- **format** : "gguf" | "mlx" | null
- **capabilities** (optional) : object — `vision`, `trained_for_tool_use`, `reasoning?` (`allowed_options`, `default`). Absent for embedding models.
- **description** (optional) : string | null
- **variants** (optional) : array
- **selected_variant** (optional) : string

## Response

```json
{
  "models": [
    {
      "type": "llm",
      "publisher": "google",
      "key": "google/gemma-4-26b-a4b",
      "display_name": "Gemma 4 26B A4B",
      "architecture": "gemma4",
      "quantization": { "name": "Q4_K_M", "bits_per_weight": 4 },
      "size_bytes": 17990911801,
      "params_string": "26B-A4B",
      "loaded_instances": [
        {
          "id": "google/gemma-4-26b-a4b",
          "config": {
            "context_length": 4096,
            "eval_batch_size": 512,
            "parallel": 4,
            "flash_attention": true,
            "num_experts": 8,
            "offload_kv_cache_to_gpu": true
          }
        }
      ],
      "max_context_length": 262144,
      "format": "gguf",
      "capabilities": {
        "vision": true,
        "trained_for_tool_use": true,
        "reasoning": { "allowed_options": ["off", "on"], "default": "on" }
      },
      "description": null,
      "variants": ["google/gemma-4-26b-a4b@q4_k_m"],
      "selected_variant": "google/gemma-4-26b-a4b@q4_k_m"
    },
    {
      "type": "embedding",
      "publisher": "gaianet",
      "key": "text-embedding-nomic-embed-text-v1.5-embedding",
      "display_name": "Nomic Embed Text v1.5",
      "quantization": { "name": "F16", "bits_per_weight": 16 },
      "size_bytes": 274290560,
      "params_string": null,
      "loaded_instances": [],
      "max_context_length": 2048,
      "format": "gguf"
    }
  ]
}
```
