from dataclasses import dataclass


@dataclass(frozen=True)
class ModelCapabilities:
    tools: bool
    vision: bool
    reasoning: bool
    embeddings: bool