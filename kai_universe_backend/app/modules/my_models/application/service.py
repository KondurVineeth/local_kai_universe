from app.modules.my_models.domain.entities.installed_model import (
    InstalledModel,
)
from app.modules.my_models.domain.repositories.installed_model_repository import (
    InstalledModelRepository,
)


class MyModelsService:

    def __init__(
        self,
        repository: InstalledModelRepository,
    ):
        self.repository = repository

    def list_models(
        self,
    ) -> list[InstalledModel]:
        return self.repository.list()

    def get_model(
        self,
        model_id: str,
    ) -> InstalledModel | None:
        return self.repository.find_by_model_id(
            model_id
        )

    def install_model(
        self,
        model: InstalledModel,
    ) -> InstalledModel:
        return self.repository.install(
            model
        )

    def uninstall_model(
        self,
        model_id: str,
    ) -> None:
        self.repository.uninstall(
            model_id
        )