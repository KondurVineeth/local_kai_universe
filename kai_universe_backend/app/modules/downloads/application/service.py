from app.modules.downloads.domain.entities.download import Download
from app.modules.downloads.domain.repositories.download_repository import (DownloadRepository,)
from app.modules.downloads.infrastructure.gateway_download_client import (
    GatewayDownloadClient,
)
from app.modules.local_server.infrastructure.repositories.memory_local_server_repository import (
    repository as local_server_repository,
)

class DownloadService:
        
    def __init__(self, repository, gateway_client=None,):
        self.repository = repository
        self.gateway_client = (gateway_client or GatewayDownloadClient())

    def list_downloads(self,) -> list[Download]:
        return self.repository.list()

    def get_download(self, download_id: str,) -> Download | None:
        return self.repository.find_by_id(download_id)

    def pause_download(self, download_id: str,) -> None:
        self.repository.pause(download_id)

    def resume_download(self, download_id: str,) -> None:
        self.repository.resume(download_id)

    def cancel_download(self, download_id: str,) -> None:
        self.repository.cancel(download_id)
        
    async def start_download(
    self,
    model_id: str,
    hf_repository: str,
    quantization: str,
    total_bytes: int,
):

        download = self.repository.enqueue(
            model_id=model_id,
            quantization=quantization,
            total_bytes=total_bytes,
        )

        try:
            self.repository.update_status(
                download.id,
                "downloading",
            )
            local_server_repository.add_log(
                "INFO",
                f"Download started: {hf_repository}",
            )
            await self.gateway_client.download_model(
                hf_repository,
            )

            self.repository.mark_completed(
                download.id,
            )
            local_server_repository.add_log(
                "INFO",
                f"Download completed: {hf_repository}",
            )
        except Exception as e:

            self.repository.mark_failed(
                download.id,
                str(e),
            )
            local_server_repository.add_log(
                "ERROR",
                f"Download failed: {hf_repository} ({e})",
            )
            raise

        return download