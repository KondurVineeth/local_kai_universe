from pydantic import BaseModel


class InstallModelRequest(BaseModel):
    model_id: str
    display_name: str
    quantization: str
    size_bytes: int
    storage_path: str