from pydantic import BaseModel


class SearchModelsRequest(BaseModel):
    text: str | None = None
    format: str | None = None
    tags: list[str] | None = None