from app.modules.embeddings.infrastructure.gateway_embedding_client import (
    GatewayEmbeddingClient,
)


class EmbeddingService:

    def __init__(
        self,
        gateway_client=None,
    ):
        self.gateway_client = (
            gateway_client
            or GatewayEmbeddingClient()
        )

    async def embeddings(
        self,
        payload: dict,
    ):
        return await self.gateway_client.embeddings(
            payload
        )