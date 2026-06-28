import json
from fastapi import APIRouter, HTTPException

from app.modules.downloads.application.service import DownloadService
from app.modules.downloads.infrastructure.repositories.json_download_repository import (JsonDownloadRepository,)
from app.modules.downloads.presentation.request_schemas import (CreateDownloadRequest,)
from app.modules.downloads.presentation.response_schemas import (DownloadResponse,)
from app.modules.local_server.infrastructure.repositories.memory_local_server_repository import (
    repository as local_server_repository,
)

router = APIRouter()

repository = JsonDownloadRepository()
service = DownloadService(repository)


def to_download_response(download) -> DownloadResponse:
    return DownloadResponse(
        id=download.id,
        model_id=download.model_id,
        quantization=download.quantization,
        total_bytes=download.total_bytes,
        received_bytes=download.received_bytes,
        status=download.status,
        bytes_per_second=download.bytes_per_second,
        started_at=download.started_at.isoformat(),
        completed_at=(
            download.completed_at.isoformat()
            if download.completed_at
            else None
        ),
        error_message=download.error_message,
    )


@router.get("", response_model=list[DownloadResponse], response_model_by_alias=True,)
def list_downloads():
    return [
        to_download_response(download)
        for download in service.list_downloads()
    ]


@router.get(
    "/{download_id}",
    response_model=DownloadResponse,
    response_model_by_alias=True,
)
def get_download(download_id: str):

    local_server_repository.add_log(
        "INFO",
        f"GET /api/v1/downloads/{download_id}",
    )

    download = service.get_download(download_id)

    if download is None:
        raise HTTPException(
            status_code=404,
            detail="Download not found",
        )

    response = to_download_response(download)

    local_server_repository.add_log(
        "INFO",
        json.dumps(
            response.model_dump(by_alias=True),
            indent=2,
        ),
    )

    return response


@router.post(
    "",
    response_model=DownloadResponse,
    response_model_by_alias=True,
)
async def create_download(
    request: CreateDownloadRequest,
):
    download = await service.start_download(
    model_id=request.model_id,
    hf_repository=request.hf_repository,
    quantization=request.quantization,
    total_bytes=request.total_bytes,
)

    return to_download_response(download)


@router.post("/{download_id}/pause")
def pause_download(download_id: str):
    service.pause_download(download_id)
    return {
        "message": "Download paused"
    }


@router.post("/{download_id}/resume")
def resume_download(download_id: str):
    service.resume_download(download_id)
    return {
        "message": "Download resumed"
    }


@router.post("/{download_id}/cancel")
def cancel_download(download_id: str):
    service.cancel_download(download_id)
    return {
        "message": "Download cancelled"
    }