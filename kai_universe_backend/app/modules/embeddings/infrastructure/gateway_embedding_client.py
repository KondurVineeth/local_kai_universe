import json
import httpx


class GatewayEmbeddingClient:

    def __init__(
        self,
        gateway_url: str = "http://127.0.0.1:9000",
    ):
        self.gateway_url = gateway_url

    async def embeddings(
        self,
        payload: dict,
    ):
        print("\n========== OUTGOING EMBEDDING REQUEST ==========")
        print(json.dumps(payload, indent=4))
        print("================================================\n")

        async with httpx.AsyncClient(
            timeout=None,
        ) as client:

            response = await client.post(
                f"{self.gateway_url}/embeddings",
                json=payload,
            )

            print("\n========== GATEWAY RESPONSE ==========")
            print(response.status_code)
            print(response.text)
            print("======================================\n")

            response.raise_for_status()

            data = response.json()

            print("\n========== INCOMING EMBEDDING RESPONSE ==========")
            print(json.dumps(data, indent=4))
            print("=================================================\n")

            return data