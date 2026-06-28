import json

from datetime import datetime
from pathlib import Path
from app.modules.discover.domain.entities.model import Model
from app.modules.discover.domain.entities.model_capabilities import (ModelCapabilities,)
from app.modules.discover.domain.entities.model_variant import (ModelVariant,)
from app.modules.discover.domain.repositories.model_repository import (ModelRepository,)


class JsonModelRepository(ModelRepository):

    def __init__(self) -> None:
        self._storage_file = (
            Path(__file__)
            .resolve()
            .parents[5]
            / "app"
            / "storage"
            / "models"
            / "models.json"
        )

    def _load_models(self) -> list[Model]:
        if not self._storage_file.exists():
            return []
        with open(self._storage_file, "r", encoding="utf-8") as file:
            raw_models = json.load(file)
        models: list[Model] = []
        for item in raw_models:
            capabilities = ModelCapabilities(
                tools=item["capabilities"]["tools"],
                vision=item["capabilities"]["vision"],
                reasoning=item["capabilities"]["reasoning"],
                embeddings=item["capabilities"]["embeddings"],
            )
            variants = [
                ModelVariant(
                    quantization=variant["quantization"],
                    format=variant["format"],
                    size_bytes=variant["sizeBytes"],
                    recommended=variant["recommended"],
                )
                for variant in item["variants"]
            ]
            model = Model(
                id=item["id"],
                display_name=item["displayName"],
                hf_repository=item["hfRepository"],
                author=item["author"],
                description=item["description"],
                context_length_tokens=item["contextLengthTokens"],
                parameter_count_b=item["parameterCountB"],
                format=item["format"],
                arch=item["arch"],
                capabilities=capabilities,
                variants=variants,
                readme_markdown=item["readmeMarkdown"],
                download_count=item["downloadCount"],
                star_count=item["starCount"],
                published_at=datetime.fromisoformat(
                    item["publishedAt"].replace("Z", "+00:00")
                ),
                tags=item["tags"],
                staff_pick=item["staffPick"],
            )
            models.append(model)
        return models

    def list(self) -> list[Model]:
        return self._load_models()

    def find_by_id(self, model_id: str) -> Model | None:
        models = self._load_models()
        for model in models:
            if model.id == model_id:
                return model
        return None

    def search(self, text: str | None = None, format: str | None = None, tags: list[str] | None = None,) -> list[Model]:
        models = self._load_models()
        results = models
        if text:
            text = text.lower()
            results = [
                model
                for model in results
                if text in (
                    f"{model.display_name} "
                    f"{model.author} "
                    f"{model.description}"
                ).lower()
            ]
        if format:
            results = [
                model
                for model in results
                if model.format == format
            ]
        if tags:
            results = [
                model
                for model in results
                if any(tag in model.tags for tag in tags)
            ]
        return results

    def staff_picks(self) -> list[Model]:
        return [
            model
            for model in self._load_models()
            if model.staff_pick
        ]