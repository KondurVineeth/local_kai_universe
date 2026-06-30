import json
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
        print("\n========== OUTGOING REQUEST ==========")
        print(json.dumps(payload, indent=4))
        print("======================================\n")

        async with httpx.AsyncClient(
            timeout=None,
        ) as client:

            response = await client.post(
                f"{self.gateway_url}/chat/completions",
                json=payload,
            )

            response.raise_for_status()

            data = response.json()

            print("\n========== INCOMING RESPONSE ==========")
            print(json.dumps(data, indent=4))
            print("=======================================\n")

            return data