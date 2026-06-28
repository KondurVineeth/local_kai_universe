# Unload a model

Unload a loaded model from memory

`POST /api/v1/models/unload`

## Request body

**instance_id** : string — Unique identifier of the model instance to unload.

### Example Request

```bash
curl http://localhost:1234/api/v1/models/unload \
  -H "Authorization: Bearer $LM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "openai/gpt-oss-20b"
  }'
```

## Response fields

**instance_id** : string — Unique identifier for the unloaded model instance.

### Response

```json
{
  "instance_id": "openai/gpt-oss-20b"
}
```
