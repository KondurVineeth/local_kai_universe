from pydantic import BaseModel, Field


class DownloadResponse(BaseModel):
    id: str

    model_id: str = Field(
        serialization_alias="modelId"
    )

    quantization: str

    total_bytes: int = Field(
        serialization_alias="totalBytes"
    )

    received_bytes: int = Field(
        serialization_alias="receivedBytes"
    )

    status: str

    bytes_per_second: int = Field(
        serialization_alias="bytesPerSecond"
    )

    started_at: str = Field(
        serialization_alias="startedAt"
    )

    completed_at: str | None = Field(
        serialization_alias="completedAt"
    )

    error_message: str | None = Field(
        serialization_alias="errorMessage"
    )

    model_config = {
        "populate_by_name": True
    }