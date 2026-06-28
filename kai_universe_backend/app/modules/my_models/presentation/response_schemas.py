from pydantic import BaseModel, Field


class InstalledModelResponse(BaseModel):

    model_id: str = Field(
        serialization_alias="modelId"
    )

    display_name: str = Field(
        serialization_alias="displayName"
    )

    quantization: str

    size_bytes: int = Field(
        serialization_alias="sizeBytes"
    )

    installed_at: str = Field(
        serialization_alias="installedAt"
    )

    storage_path: str = Field(
        serialization_alias="storagePath"
    )

    model_config = {
        "populate_by_name": True
    }