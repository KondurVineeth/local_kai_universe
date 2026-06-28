from dataclasses import dataclass


@dataclass
class LoadedModel:
    model_id: str
    author: str
    display_name: str
    hf_repository: str

    status: str

    size_gb: float

    vision: bool
    reasoning: bool
    tools: bool