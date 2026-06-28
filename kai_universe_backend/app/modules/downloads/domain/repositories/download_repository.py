from abc import ABC, abstractmethod
from app.modules.downloads.domain.entities.download import Download


class DownloadRepository(ABC):

    @abstractmethod
    def list(self) -> list[Download]:
        pass

    @abstractmethod
    def find_by_id(self, download_id: str,) -> Download | None:
        pass

    @abstractmethod
    def enqueue(self, model_id: str, quantization: str, total_bytes: int,) -> Download:
        pass
    
    @abstractmethod
    def update_status(
        self,
        download_id: str,
        status: str,
    ) -> None:
        pass
    
    @abstractmethod
    def mark_completed(
        self,
        download_id: str,
    ) -> None:
        pass
    
    @abstractmethod
    def mark_failed(
        self,
        download_id: str,
        error_message: str,
    ) -> None:
        pass

    @abstractmethod
    def pause(self, download_id: str,) -> None:
        pass

    @abstractmethod
    def resume(self, download_id: str,) -> None:
        pass

    @abstractmethod
    def cancel(self, download_id: str,) -> None:
        pass