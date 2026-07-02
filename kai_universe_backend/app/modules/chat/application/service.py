from app.modules.chat.infrastructure.gateway_chat_client import (
    GatewayChatClient,
)

from app.modules.discover.infrastructure.repositories.json_model_repository import (
    JsonModelRepository,
)


class ChatService:

    def __init__(
        self,
        gateway_client=None,
        model_repository=None,
    ):
        self.gateway_client = (
            gateway_client or GatewayChatClient()
        )

        self.model_repository = (
            model_repository or JsonModelRepository()
        )

    async def chat(
        self,
        payload: dict,
    ):
        model = self.model_repository.find_by_id(
            payload["model"]
        )

        if model is None:
            raise ValueError(
                f"Unknown model '{payload['model']}'"
            )

        payload["model"] = model.hf_repository

        return await self.gateway_client.chat(
            payload
        )