from pydantic import BaseModel, Field


class ModelCapabilitiesResponse(BaseModel):
    tools: bool
    vision: bool
    reasoning: bool
    embeddings: bool


class ModelVariantResponse(BaseModel):
    quantization: str
    format: str

    size_bytes: int = Field(
        serialization_alias="sizeBytes"
    )

    recommended: bool

    model_config = {
        "populate_by_name": True
    }


class ModelResponse(BaseModel):
    id: str

    display_name: str = Field(
        serialization_alias="displayName"
    )

    hf_repository: str = Field(
        serialization_alias="hfRepository"
    )

    author: str
    description: str

    context_length_tokens: int = Field(
        serialization_alias="contextLengthTokens"
    )

    parameter_count_b: float = Field(
        serialization_alias="parameterCountB"
    )

    format: str
    arch: str

    capabilities: ModelCapabilitiesResponse

    variants: list[ModelVariantResponse]

    readme_markdown: str = Field(
        serialization_alias="readmeMarkdown"
    )

    download_count: int = Field(
        serialization_alias="downloadCount"
    )

    star_count: int = Field(
        serialization_alias="starCount"
    )

    published_at: str = Field(
        serialization_alias="publishedAt"
    )

    tags: list[str]

    staff_pick: bool = Field(
        serialization_alias="staffPick"
    )

    model_config = {
    "populate_by_name": True,
    "from_attributes": True,
    }


class ModelListResponse(BaseModel):
    items: list[ModelResponse]