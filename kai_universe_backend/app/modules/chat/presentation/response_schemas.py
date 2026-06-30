from typing import List, Optional

from pydantic import BaseModel


class ChatMessageResponse(BaseModel):
    role: str
    content: str


class ChatChoiceResponse(BaseModel):
    index: int
    message: ChatMessageResponse
    finish_reason: str


class ChatUsageResponse(BaseModel):
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


class ChatResponse(BaseModel):
    id: str
    object: str
    created: int
    model: str

    choices: List[ChatChoiceResponse]

    usage: Optional[ChatUsageResponse] = None