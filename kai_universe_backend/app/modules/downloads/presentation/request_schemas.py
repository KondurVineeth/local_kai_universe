from pydantic import BaseModel


class CreateDownloadRequest(BaseModel):
    model_id: str
    hf_repository: str

    # Temporary
    quantization: str
    total_bytes: int