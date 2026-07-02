from typing import Any

from pydantic import BaseModel


class EmbeddingResponse(BaseModel):
    object: str
    model: str
    data: list[dict[str, Any]]