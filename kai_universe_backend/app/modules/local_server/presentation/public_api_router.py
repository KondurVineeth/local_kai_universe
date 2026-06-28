from fastapi import APIRouter
import json

from app.modules.local_server.application.service import LocalServerService
from app.modules.local_server.infrastructure.repositories.memory_local_server_repository import (
    repository,
)
from app.modules.local_server.presentation.response_schemas import (
    LoadedModelResponse,
)

router = APIRouter()

service = LocalServerService(repository)


def to_loaded_model_response(model):
    return LoadedModelResponse(
        model_id=model.model_id,
        author=model.author,
        display_name=model.display_name,
        hf_repository=model.hf_repository,
        status=model.status,
        size_gb=model.size_gb,
        vision=model.vision,
        reasoning=model.reasoning,
        tools=model.tools,
    )

    
@router.get("/models")
def list_models():

    service.add_log(
        "INFO",
        "GET /api/v1/models",
    )

    models = service.list_loaded_models()

    service.add_log(
        level="INFO",
        message=json.dumps(
            [
                to_loaded_model_response(model).model_dump()
                for model in models
            ],
            indent=2,
        ),
    )

    return [
        to_loaded_model_response(model)
        for model in models
    ]