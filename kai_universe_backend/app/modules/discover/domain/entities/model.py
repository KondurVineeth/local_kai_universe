from dataclasses import dataclass
from datetime import datetime
from app.modules.discover.domain.entities.model_capabilities import (ModelCapabilities,)
from app.modules.discover.domain.entities.model_variant import (ModelVariant,)


@dataclass(frozen=True)
class Model:
    id: str
    display_name: str
    hf_repository: str
    author: str
    description: str
    context_length_tokens: int
    parameter_count_b: float
    format: str
    arch: str
    capabilities: ModelCapabilities
    variants: list[ModelVariant]
    readme_markdown: str
    download_count: int
    star_count: int
    published_at: datetime
    tags: list[str]
    staff_pick: bool