from fastapi import APIRouter, HTTPException, Query
from app.modules.discover.application.service import DiscoverService
from app.modules.discover.infrastructure.repositories.json_model_repository import (JsonModelRepository,)
from app.modules.discover.presentation.response_schemas import (ModelResponse,)
from app.modules.discover.presentation.response_schemas import (ModelResponse, ModelCapabilitiesResponse, ModelVariantResponse,)

router = APIRouter()

repository = JsonModelRepository()
service = DiscoverService(repository)

def to_model_response(model) -> ModelResponse:
    return ModelResponse(
        id=model.id,
        display_name=model.display_name,
        hf_repository=model.hf_repository,
        author=model.author,
        description=model.description,
        context_length_tokens=model.context_length_tokens,
        parameter_count_b=model.parameter_count_b,
        format=model.format,
        arch=model.arch,
        capabilities=ModelCapabilitiesResponse(
            tools=model.capabilities.tools,
            vision=model.capabilities.vision,
            reasoning=model.capabilities.reasoning,
            embeddings=model.capabilities.embeddings,
        ),
        variants=[
            ModelVariantResponse(
                quantization=v.quantization,
                format=v.format,
                size_bytes=v.size_bytes,
                recommended=v.recommended,
            )
            for v in model.variants
        ],
        readme_markdown=model.readme_markdown,
        download_count=model.download_count,
        star_count=model.star_count,
        published_at=model.published_at.isoformat(),
        tags=model.tags,
        staff_pick=model.staff_pick,
    )

@router.get("/models", response_model=list[ModelResponse], response_model_by_alias=True,)
def list_models():
    return [
        to_model_response(model)
        for model in service.list_models()
    ]


@router.get("/models/{model_id}", response_model=ModelResponse, response_model_by_alias=True,)
def get_model(model_id: str):
    model = service.get_model(model_id)
    if model is None:
        raise HTTPException(
            status_code=404,
            detail="Model not found",
        )
    return to_model_response(model)


@router.get("/staff-picks", response_model=list[ModelResponse], response_model_by_alias=True,)
def staff_picks():
    return [
        to_model_response(model)
        for model in service.get_staff_picks()
    ]


@router.get("/search", response_model=list[ModelResponse], response_model_by_alias=True,)
def search_models(text: str | None = Query(default=None), format: str | None = Query(default=None),):
    return [
    to_model_response(model)
    for model in service.search_models(
        text=text,
        format=format,
    )
]