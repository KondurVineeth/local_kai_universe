from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.modules.my_models.application.service import MyModelsService
from app.modules.my_models.domain.entities.installed_model import (
    InstalledModel,
)
from app.modules.my_models.infrastructure.repositories.json_installed_model_repository import (
    JsonInstalledModelRepository,
)
from app.modules.my_models.presentation.request_schemas import (
    InstallModelRequest,
)
from app.modules.my_models.presentation.response_schemas import (
    InstalledModelResponse,
)

router = APIRouter()

repository = JsonInstalledModelRepository()
service = MyModelsService(repository)


def to_response(
    model: InstalledModel,
) -> InstalledModelResponse:
    return InstalledModelResponse(
        model_id=model.model_id,
        display_name=model.display_name,
        quantization=model.quantization,
        size_bytes=model.size_bytes,
        installed_at=model.installed_at.isoformat(),
        storage_path=model.storage_path,
    )


@router.get(
    "",
    response_model=list[InstalledModelResponse],
    response_model_by_alias=True,
)
def list_models():
    return [
        to_response(model)
        for model in service.list_models()
    ]


@router.get(
    "/{model_id}",
    response_model=InstalledModelResponse,
    response_model_by_alias=True,
)
def get_model(model_id: str):
    model = service.get_model(model_id)

    if model is None:
        raise HTTPException(
            status_code=404,
            detail="Installed model not found",
        )

    return to_response(model)


@router.post(
    "",
    response_model=InstalledModelResponse,
    response_model_by_alias=True,
)
def install_model(
    request: InstallModelRequest,
):
    model = InstalledModel(
        model_id=request.model_id,
        display_name=request.display_name,
        quantization=request.quantization,
        size_bytes=request.size_bytes,
        installed_at=datetime.utcnow(),
        storage_path=request.storage_path,
    )

    installed = service.install_model(model)

    return to_response(installed)


@router.delete("/{model_id}")
def uninstall_model(model_id: str):
    service.uninstall_model(model_id)

    return {
        "message": "Model uninstalled"
    }