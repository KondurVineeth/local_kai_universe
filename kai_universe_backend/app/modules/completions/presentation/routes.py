import json

from fastapi import APIRouter

from app.modules.chat.application.service import ChatService

from app.modules.completions.presentation.request_schemas import (
    CompletionRequest,
)

from app.modules.completions.presentation.response_schemas import (
    CompletionResponse,
)

from app.modules.local_server.application.service import (
    LocalServerService,
)

from app.modules.local_server.infrastructure.repositories.memory_local_server_repository import (
    repository,
)

router = APIRouter()

chat_service = ChatService()

local_server = LocalServerService(repository)


@router.post(
    "",
    response_model=CompletionResponse,
)
async def completions(
    request: CompletionRequest,
):

    local_server.add_log(
        "INFO",
        "POST /api/v1/completions",
    )

    local_server.add_log(
        "INFO",
        json.dumps(
            request.model_dump(),
            indent=2,
        ),
    )

    payload = {
        "model": request.model,
        "messages": [
            {
                "role": "user",
                "content": request.prompt,
            }
        ],
        "max_completion_tokens": request.max_tokens,
        "temperature": request.temperature,
        "top_p": request.top_p,
        "top_k": 20,
        "repetition_penalty": 1.1,
        "seed": None,
        "stream": request.stream,
        "stream_options": None,
        "n": 1,
        "store": False,
    }

    response = await chat_service.chat(
        payload,
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