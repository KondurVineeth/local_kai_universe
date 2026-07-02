import json

from fastapi import APIRouter

from app.modules.embeddings.application.service import (
    EmbeddingService,
)
from app.modules.embeddings.presentation.request_schemas import (
    EmbeddingRequest,
)
from app.modules.embeddings.presentation.response_schemas import (
    EmbeddingResponse,
)

from app.modules.local_server.application.service import (
    LocalServerService,
)
from app.modules.local_server.infrastructure.repositories.memory_local_server_repository import (
    repository,
)

router = APIRouter()

service = EmbeddingService()

local_server = LocalServerService(repository)


@router.post(
    "",
    response_model=EmbeddingResponse,
)
async def embeddings(
    request: EmbeddingRequest,
):

    local_server.add_log(
        "INFO",
        "POST /api/v1/embeddings",
    )

    local_server.add_log(
        "INFO",
        json.dumps(
            request.model_dump(),
            indent=2,
        ),
    )

    response = await service.embeddings(
        request.model_dump(),
    )

    local_server.add_log(
        "INFO",
        json.dumps(
            response,
            indent=2,
        ),
    )

    return response