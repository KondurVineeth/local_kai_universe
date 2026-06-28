from email import message

from app.modules.local_server.domain.entities.loaded_model import LoadedModel
from app.modules.local_server.domain.entities.server_info import ServerInfo
from app.modules.local_server.domain.entities.server_log import ServerLog
from app.modules.local_server.domain.repositories.local_server_repository import (
    LocalServerRepository,
)


class LocalServerService:

    def __init__(
        self,
        repository: LocalServerRepository,
    ):
        self.repository = repository

    def get_server_info(self) -> ServerInfo:
        return self.repository.get_server_info()

    def list_loaded_models(self) -> list[LoadedModel]:
        return self.repository.list_loaded_models()

    def list_logs(self) -> list[ServerLog]:
        return self.repository.list_logs()

    def start_server(self) -> None:
        self.repository.start_server()

    def stop_server(self) -> None:
        self.repository.stop_server()

    def restart_server(self) -> None:
        self.repository.restart_server()
    
    def load_model(
        self,
        model_id: str,
        hf_repository: str,
    ) -> None:
        self.repository.load_model(
            model_id=model_id,
            hf_repository=hf_repository,
        )

    def unload_model(
        self,
        model_id: str,
    ) -> None:
        self.repository.unload_model(
            model_id=model_id,
        )
    
    def increment_request_count(self) -> None:
        self.repository.increment_request_count()
    
    def add_log(
    self,
    level: str,
    message: str,
) -> None:
        self.repository.add_log(level=level, message=message)
        
    def clear_logs(self) -> None:
        self.repository.clear_logs()