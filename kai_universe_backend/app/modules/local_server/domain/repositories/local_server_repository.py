from abc import ABC, abstractmethod

from app.modules.local_server.domain.entities.server_info import ServerInfo
from app.modules.local_server.domain.entities.loaded_model import LoadedModel
from app.modules.local_server.domain.entities.server_log import ServerLog


class LocalServerRepository(ABC):

    @abstractmethod
    def get_server_info(self) -> ServerInfo:
        pass

    @abstractmethod
    def list_loaded_models(self) -> list[LoadedModel]:
        pass

    @abstractmethod
    def list_logs(self) -> list[ServerLog]:
        pass

    @abstractmethod
    def start_server(self) -> None:
        pass

    @abstractmethod
    def stop_server(self) -> None:
        pass

    @abstractmethod
    def load_model(
        self,
        model_id: str,
        hf_repository: str,
    ) -> None:
        pass

    @abstractmethod
    def unload_model(
        self,
        model_id: str,
    ) -> None:
        pass
    
    @abstractmethod
    def increment_request_count(self) -> None:
        pass
    
    @abstractmethod
    def restart_server(self) -> None:
        pass
    
    @abstractmethod
    def add_log(
        self,
        level: str,
        message: str,
    ) -> None:
        pass