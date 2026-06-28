# Get download status

Get the status of model downloads

```
GET /api/v1/models/download/status/:job_id
```

## Path parameters

**job_id** : string — The unique identifier of the download job. `job_id` is returned by the [download](/docs/developer/rest/download) endpoint when a download is initiated.

## Example Request

```bash
curl -H "Authorization: Bearer $LM_API_TOKEN" \
  http://localhost:1234/api/v1/models/download/status/job_493c7c9ded
```

## Response fields

Returns a single download job status object. The response varies based on the download status.

- **job_id** : string
- **status** : "downloading" | "paused" | "completed" | "failed"
- **bytes_per_second** (optional) : number — Current download speed in bytes per second. Present when `status` is `downloading`.
- **estimated_completion** (optional) : string — Estimated completion time in ISO 8601 format.
- **completed_at** (optional) : string
- **total_size_bytes** (optional) : number
- **downloaded_bytes** (optional) : number
- **started_at** (optional) : string

## Response

```json
{
  "job_id": "job_493c7c9ded",
  "status": "completed",
  "total_size_bytes": 2279145003,
  "downloaded_bytes": 2279145003,
  "started_at": "2025-10-03T15:33:23.496Z",
  "completed_at": "2025-10-03T15:43:12.102Z"
}
```
