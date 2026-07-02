from pydantic import BaseModel


class CompletionRequest(BaseModel):
    model: str
    prompt: str
    max_tokens: int = 1024
    temperature: float = 0.6
    top_p: float = 0.95
    stream: bool = False