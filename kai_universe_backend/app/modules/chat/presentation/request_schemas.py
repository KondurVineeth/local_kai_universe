from pydantic import BaseModel
from typing import List, Optional


class ChatMessageRequest(BaseModel):
    role: str
    content: str


class StreamOptionsRequest(BaseModel):
    include_usage: bool = False


class ChatRequest(BaseModel):
    model: str
    messages: List[ChatMessageRequest]

    max_completion_tokens: int = 1024
    temperature: float = 0.0
    top_p: float = 1.0

    stream: bool = False
    stream_options: Optional[StreamOptionsRequest] = None

    n: int = 1
    store: bool = False