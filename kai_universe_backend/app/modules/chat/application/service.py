from app.modules.chat.infrastructure.gateway_chat_client import (
    GatewayChatClient,
)


class ChatService:

    def __init__(
        self,
        gateway_client=None,
    ):
        self.gateway_client = (
            gateway_client or GatewayChatClient()
        )

    async def chat(
        self,
        payload: dict,
    ):
        return await self.gateway_client.chat(
            payload
        )