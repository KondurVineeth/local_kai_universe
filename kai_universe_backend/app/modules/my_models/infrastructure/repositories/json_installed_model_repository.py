import json

from datetime import datetime
from pathlib import Path

from app.modules.my_models.domain.entities.installed_model import (
    InstalledModel,
)
from app.modules.my_models.domain.repositories.installed_model_repository import (
    InstalledModelRepository,
)


INSTALLED_MODELS_FILE = (
    Path(__file__)
    .resolve()
    .parents[4]
    / "storage"
    / "installed_models"
    / "installed_models.json"
)


class JsonInstalledModelRepository(
    InstalledModelRepository
):

    def _read(self) -> list[dict]:
        if not INSTALLED_MODELS_FILE.exists():
            return []

        with open(
            INSTALLED_MODELS_FILE,
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    def _write(
        self,
        data: list[dict],
    ) -> None:
        with open(
            INSTALLED_MODELS_FILE,
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                data,
                file,
                indent=2,
            )

    def _to_entity(
        self,
        item: dict,
    ) -> InstalledModel:
        return InstalledModel(
            model_id=item["model_id"],
            display_name=item["display_name"],
            quantization=item["quantization"],
            size_bytes=item["size_bytes"],
            installed_at=datetime.fromisoformat(
                item["installed_at"]
            ),
            storage_path=item["storage_path"],
        )

    def list(
        self,
    ) -> list[InstalledModel]:
        return [
            self._to_entity(item)
            for item in self._read()
        ]

    def find_by_model_id(
        self,
        model_id: str,
    ) -> InstalledModel | None:
        for item in self._read():
            if item["model_id"] == model_id:
                return self._to_entity(item)

        return None

    def install(
        self,
        model: InstalledModel,
    ) -> InstalledModel:
        data = self._read()

        data.append(
            {
                "model_id": model.model_id,
                "display_name": model.display_name,
                "quantization": model.quantization,
                "size_bytes": model.size_bytes,
                "installed_at": model.installed_at.isoformat(),
                "storage_path": model.storage_path,
            }
        )

        self._write(data)

        return model

    def uninstall(
        self,
        model_id: str,
    ) -> None:
        data = self._read()

        data = [
            item
            for item in data
            if item["model_id"] != model_id
        ]

        self._write(data)