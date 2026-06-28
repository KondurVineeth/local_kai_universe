from pydantic import BaseModel


class LoadModelRequest(BaseModel):
    model_id: str
    hf_repository: str


class UnloadModelRequest(BaseModel):
    model_id: str