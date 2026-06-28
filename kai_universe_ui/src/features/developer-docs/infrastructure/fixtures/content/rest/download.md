# Download a model

Download LLMs and embedding models

`POST /api/v1/models/download`

## Request body

**model** : string — The model to download. Accepts [model catalog](https://zluniverse.ai/models) identifiers (e.g., `openai/gpt-oss-20b`) and exact Hugging Face links (e.g., `https://huggingface.co/zluniverse-community/gpt-oss-20b-GGUF`).

**quantization** (optional) : string — Quantization level of the model to download (e.g., `Q4_K_M`). Only supported for Hugging Face links.

### Example Request

```bash
curl http://localhost:1234/api/v1/models/download \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ibm/granite-4-micro"
  }'
```

## Response fields

Returns a download job status object. The response varies based on the download status.

- **job_id** (optional) : string — Unique identifier for the download job. Absent when `status` is `already_downloaded`.
- **status** : "downloading" | "paused" | "completed" | "failed" | "already_downloaded"
- **completed_at** (optional) : string — Download completion time in ISO 8601 format.
- **total_size_bytes** (optional) : number
- **started_at** (optional) : string

### Response

```json
{
  "job_id": "job_493c7c9ded",
  "status": "downloading",
  "total_size_bytes": 2279145003,
  "started_at": "2025-10-03T15:33:23.496Z"
}
```
