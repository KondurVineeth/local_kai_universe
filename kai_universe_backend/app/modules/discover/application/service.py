from app.modules.discover.domain.entities.model import Model
from app.modules.discover.domain.repositories.model_repository import (ModelRepository,)


class DiscoverService:

    def __init__(self, model_repository: ModelRepository,) -> None:
        self._model_repository = model_repository

    def list_models(self) -> list[Model]:
        return self._model_repository.list()

    def get_model(self, model_id: str,) -> Model | None:
        return self._model_repository.find_by_id(model_id)

    def search_models(self, text: str | None = None, format: str | None = None, tags: list[str] | None = None,) -> list[Model]:
        return self._model_repository.search(
            text=text,
            format=format,
            tags=tags,
        )

    def get_staff_picks(self) -> list[Model]:
        return self._model_repository.staff_picks()