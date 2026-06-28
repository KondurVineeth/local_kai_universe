# Load a model

Load an LLM or Embedding model into memory with custom configuration for inference

`POST /api/v1/models/load`

## Request body

**model** : string — Unique identifier for the model to load. Can be an LLM or embedding model.

**context_length** (optional) : number — Maximum number of tokens that the model will consider.

**eval_batch_size** (optional) : number — Number of input tokens to process together in a single batch during evaluation. Only effective for llama.cpp-based engine.

**flash_attention** (optional) : boolean — Whether to optimize attention computation. Can decrease memory usage and improve generation speed. Only effective for llama.cpp-based engine.

**num_experts** (optional) : number — Number of experts to use during inference for MoE (Mixture of Experts) models. Only effective for MoE LLMs on llama.cpp-based engine.

**offload_kv_cache_to_gpu** (optional) : boolean — Whether KV cache is offloaded to GPU memory. If false, KV cache is stored in CPU memory/RAM. Only effective for llama.cpp-based engine.

**echo_load_config** (optional) : boolean — If true, echoes the final load configuration in the response under `"load_config"`. Default `false`.

### Example Request

```bash
curl http://localhost:1234/api/v1/models/load \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "context_length": 16384,
    "flash_attention": true,
    "echo_load_config": true
  }'
```

## Response fields

**type** : "llm" | "embedding" — Type of the loaded model.

**instance_id** : string — Unique identifier for the loaded model instance.

**load_time_seconds** : number — Time taken to load the model in seconds.

**status** : "loaded" — Load status.

**load_config** (optional) : object — The final configuration applied to the loaded model. Included only when `"echo_load_config"` is `true` in the request.

### Response

```json
{
  "type": "llm",
  "instance_id": "openai/gpt-oss-20b",
  "load_time_seconds": 9.099,
  "status": "loaded",
  "load_config": {
    "context_length": 16384,
    "eval_batch_size": 512,
    "flash_attention": true,
    "offload_kv_cache_to_gpu": true,
    "num_experts": 4
  }
}
```
