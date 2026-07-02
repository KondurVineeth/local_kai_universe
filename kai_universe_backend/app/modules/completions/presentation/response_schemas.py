from typing import Any

from pydantic import BaseModel


class CompletionResponse(BaseModel):
    id: str
    object: str
    created: int
    model: str
    choices: list[Any]
    usage: dict[str, Any] = {}