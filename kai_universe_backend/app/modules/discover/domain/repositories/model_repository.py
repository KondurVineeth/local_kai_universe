from abc import ABC, abstractmethod
from app.modules.discover.domain.entities.model import Model


class ModelRepository(ABC):

    @abstractmethod
    def list(self) -> list[Model]:
        """
        Return all models.
        """
        raise NotImplementedError

    @abstractmethod
    def find_by_id(self, model_id: str) -> Model | None:
        """
        Return a model by id.
        """
        raise NotImplementedError

    @abstractmethod
    def search(self, text: str | None = None, format: str | None = None, tags: list[str] | None = None,) -> list[Model]:
        """
        Search models.
        """
        raise NotImplementedError

    @abstractmethod
    def staff_picks(self) -> list[Model]:
        """
        Return staff-picked models.
        """
        raise NotImplementedError