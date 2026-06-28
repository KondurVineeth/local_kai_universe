from fastapi import APIRouter

from app.modules.chat.application.service import ChatService
from app.modules.chat.presentation.request_schemas import ChatRequest
from app.modules.chat.presentation.response_schemas import ChatResponse

router = APIRouter()

service = ChatService()


@router.post(
    "",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
):
    response = await service.chat(
        request.model_dump()
    )

    return response