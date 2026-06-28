from dataclasses import dataclass


@dataclass(frozen=True)
class ModelVariant:
    quantization: str
    format: str
    size_bytes: int
    recommended: bool