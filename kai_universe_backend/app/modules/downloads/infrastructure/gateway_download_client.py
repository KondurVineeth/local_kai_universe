import httpx


class GatewayDownloadClient:

    def __init__(
        self,
        gateway_url: str = "http://127.0.0.1:9000",
    ):
        self.gateway_url = gateway_url

    async def download_model(
        self,
        model_name: str,
    ):
        async with httpx.AsyncClient(
            timeout=None,
        ) as client:

            response = await client.post(
                f"{self.gateway_url}/models/download",
                json={
                    "model": model_name,
                },
            )

            response.raise_for_status()

            return response.json()