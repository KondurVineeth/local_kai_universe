from abc import ABC, abstractmethod

from app.modules.my_models.domain.entities.installed_model import (
    InstalledModel,
)


class InstalledModelRepository(ABC):

    @abstractmethod
    def list(self) -> list[InstalledModel]:
        pass

    @abstractmethod
    def find_by_model_id(
        self,
        model_id: str,
    ) -> InstalledModel | None:
        pass

    @abstractmethod
    def install(
        self,
        model: InstalledModel,
    ) -> InstalledModel:
        pass

    @abstractmethod
    def uninstall(
        self,
        model_id: str,
    ) -> None:
        pass