from fastapi import APIRouter

from app.modules.chat.application.service import ChatService
from app.modules.chat.presentation.request_schemas import ChatRequest
from app.modules.chat.presentation.response_schemas import ChatResponse
import json

from app.modules.local_server.application.service import LocalServerService

from app.modules.local_server.infrastructure.repositories.memory_local_server_repository import (
    repository,
)

router = APIRouter()

service = ChatService()
local_server = LocalServerService(repository)

@router.post(
    "",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
):

    local_server.add_log(
        "INFO",
        "POST /api/v1/chat",
    )

    local_server.add_log(
        "INFO",
        json.dumps(
            request.model_dump(),
            indent=2,
        ),
    )

    response = await service.chat(
        request.model_dump()
    )

    local_server.add_log(
        "INFO",
        json.dumps(
            response,
            indent=2,
            default=str,
        ),
    )

    return response