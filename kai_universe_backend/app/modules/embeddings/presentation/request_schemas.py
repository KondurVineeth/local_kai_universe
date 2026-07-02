from typing import List, Union

from pydantic import BaseModel


class EmbeddingRequest(BaseModel):
    model: str
    input: Union[str, List[str]]