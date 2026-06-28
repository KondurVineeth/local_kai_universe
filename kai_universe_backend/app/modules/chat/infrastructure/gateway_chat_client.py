import httpx


class GatewayChatClient:

    def __init__(
        self,
        gateway_url: str = "http://127.0.0.1:9000",
    ):
        self.gateway_url = gateway_url

    async def chat(
        self,
        payload: dict,
    ):
        async with httpx.AsyncClient(
            timeout=None,
        ) as client:

            response = await client.post(
                f"{self.gateway_url}/chat/completions",
                json=payload,
            )

            response.raise_for_status()

            return response.json()