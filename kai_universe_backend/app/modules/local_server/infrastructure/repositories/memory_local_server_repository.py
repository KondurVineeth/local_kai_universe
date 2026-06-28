from datetime import datetime

from app.modules.local_server.domain.entities.loaded_model import LoadedModel
from app.modules.local_server.domain.entities.server_info import ServerInfo
from app.modules.local_server.domain.entities.server_log import ServerLog
from app.modules.local_server.domain.repositories.local_server_repository import (
    LocalServerRepository,
)


class MemoryLocalServerRepository(LocalServerRepository):

    def __init__(self):
        print("Repository created:", id(self))
        self.server_info = ServerInfo(
            status="stopped",
            port=9000,
            started_at=None,
            request_count=0,
        )

        self.loaded_models: list[LoadedModel] = []

        self.logs: list[ServerLog] = []

    def get_server_info(self) -> ServerInfo:
        return self.server_info

    def list_loaded_models(self) -> list[LoadedModel]:
        return self.loaded_models

    def list_logs(self) -> list[ServerLog]:
        return self.logs

    def clear_logs(self) -> None:
        self.logs.clear()

    def start_server(self) -> None:
        self.server_info.status = "running"
        self.server_info.started_at = datetime.now()

        self.logs.append(
            ServerLog(
                timestamp=datetime.now(),
                level="INFO",
                message="Server started.",
            )
        )

    def stop_server(self) -> None:
        self.server_info.status = "stopped"

        self.logs.append(
            ServerLog(
                timestamp=datetime.now(),
                level="INFO",
                message="Server stopped.",
            )
        )

    def load_model(
    self,
    model_id: str,
    hf_repository: str,
) -> None:

    # Don't load the same model twice.
        for model in self.loaded_models:
            if model.model_id == model_id:
                self.logs.append(
                    ServerLog(
                        timestamp=datetime.now(),
                        level="INFO",
                        message=f"Model already loaded: {hf_repository}",
                    )
                )
                return

        author = hf_repository.split("/")[0]

        display_name = (
            model_id.replace("-", " ")
            .replace("it", "IT")
            .title()
        )

        self.loaded_models.append(
            LoadedModel(
                model_id=model_id,
                author=author,
                display_name=display_name,
                hf_repository=hf_repository,
                status="READY",
                size_gb=3.10,
                vision=True,
                reasoning=True,
                tools=True,
            )
        )

        self.logs.append(
            ServerLog(
                timestamp=datetime.now(),
                level="INFO",
                message=f"Loaded {hf_repository}",
            )
        )

    def unload_model(
        self,
        model_id: str,
    ) -> None:

        self.loaded_models = [
            model
            for model in self.loaded_models
            if model.model_id != model_id
        ]

        self.logs.append(
            ServerLog(
                timestamp=datetime.now(),
                level="INFO",
                message=f"Unloaded {model_id}",
            )
        )
    
    def increment_request_count(self) -> None:
        self.server_info.request_count += 1
    
    def restart_server(self) -> None:

        self.stop_server()

        self.start_server()

        self.logs.append(
            ServerLog(
                timestamp=datetime.now(),
                level="INFO",
                message="Server restarted.",
            )
        )
        
    def add_log(
    self,
    level: str,
    message: str,
) -> None:
        self.logs.append(
            ServerLog(
                timestamp=datetime.now(),
                level=level,
                message=message,
            )
        )
repository = MemoryLocalServerRepository()