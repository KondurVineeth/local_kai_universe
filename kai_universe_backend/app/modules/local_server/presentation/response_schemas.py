from pydantic import BaseModel


class ServerInfoResponse(BaseModel):
    status: str
    port: int
    started_at: str | None
    request_count: int


class LoadedModelResponse(BaseModel):
    model_id: str
    author: str
    display_name: str

    hf_repository: str

    status: str

    size_gb: float

    vision: bool
    reasoning: bool
    tools: bool


class ServerLogResponse(BaseModel):
    timestamp: str
    level: str
    message: str