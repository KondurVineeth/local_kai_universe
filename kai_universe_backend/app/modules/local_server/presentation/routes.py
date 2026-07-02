from fastapi import APIRouter
import json
from app.modules.local_server.application.service import LocalServerService
from app.modules.local_server.presentation.request_schemas import (
    LoadModelRequest,
    UnloadModelRequest,
)
from app.modules.local_server.presentation.response_schemas import (
    LoadedModelResponse,
    ServerInfoResponse,
    ServerLogResponse,
)

from app.modules.local_server.infrastructure.repositories.memory_local_server_repository import (
    repository,
)

router = APIRouter()


service = LocalServerService(repository)

def to_server_info_response(info):
    return ServerInfoResponse(
        status=info.status,
        port=info.port,
        started_at=(
            info.started_at.isoformat()
            if info.started_at
            else None
        ),
        request_count=info.request_count,
    )


def to_loaded_model_response(model):
    return LoadedModelResponse(
        model_id=model.model_id,
        author=model.author,
        display_name=model.display_name,

        hf_repository=model.hf_repository,

        status=model.status,

        size_gb=model.size_gb,

        vision=model.vision,
        reasoning=model.reasoning,
        tools=model.tools,
    )


def to_log_response(log):
    return ServerLogResponse(
        timestamp=log.timestamp.isoformat(),
        level=log.level,
        message=log.message,
    )
    
@router.get(
    "/status",
    response_model=ServerInfoResponse,
)
def get_server_status():
    service.increment_request_count()
    return to_server_info_response(
        service.get_server_info()
    )
    

@router.get(
    "/models",
    response_model=list[LoadedModelResponse],
)
def get_loaded_models():
    service.increment_request_count()
    return [
        to_loaded_model_response(model)
        for model in service.list_loaded_models()
    ]

@router.get(
    "/logs",
    response_model=list[ServerLogResponse],
)
def get_logs():
    service.increment_request_count()
    return [
        to_log_response(log)
        for log in service.list_logs()
    ]

@router.post("/logs/clear")
def clear_logs():
    service.increment_request_count()

    service.clear_logs()

    return {
        "message": "Logs cleared"
    }

@router.post("/start")
def start_server():
    service.increment_request_count()
    service.start_server()

    return {
        "message": "Server started"
    }

@router.post("/stop")
def stop_server():
    service.increment_request_count()
    service.stop_server()

    return {
        "message": "Server stopped"
    }

@router.post("/restart")
def restart_server():

    service.increment_request_count()

    service.restart_server()

    return {
        "message": "Server restarted"
    }

@router.post("/load")
def load_model(
    request: LoadModelRequest,
):
    service.increment_request_count()

    service.add_log(
        "INFO",
        "POST /api/v1/local-server/load",
    )

    service.add_log(
        "INFO",
        json.dumps(
            request.model_dump(),
            indent=2,
        ),
    )

    service.load_model(
        model_id=request.model_id,
        hf_repository=request.hf_repository,
    )

    response = {
        "message": "Model loaded",
    }

    service.add_log(
        "INFO",
        json.dumps(
            response,
            indent=2,
        ),
    )

    return response

@router.post("/unload")
def unload_model(
    request: UnloadModelRequest,
):
    service.increment_request_count()
    service.unload_model(
        model_id=request.model_id,
    )

    return {
        "message": "Model unloaded"
    }

