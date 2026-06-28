from fastapi import FastAPI
from app.modules.discover.presentation.routes import (router as discover_router,)
from fastapi.middleware.cors import CORSMiddleware
from app.modules.downloads.presentation.routes import (router as downloads_router,)
from app.modules.my_models.presentation.routes import (router as my_models_router,)
from app.modules.chat.presentation.routes import (
    router as chat_router,
)
from app.modules.local_server.presentation.routes import (
    router as local_server_router,
)
from app.modules.local_server.presentation import public_api_router

app = FastAPI(
    title="KAI Universe Backend",
    version="1.0.0",
)

app.include_router(
    discover_router,
    prefix="/api/v1/discover",
    tags=["Discover"],
)

app.include_router(
    downloads_router,
    prefix="/api/v1/downloads",
    tags=["Downloads"],
)

app.include_router(
    my_models_router,
    prefix="/api/v1/my-models",
    tags=["My Models"],
)

app.include_router(
    chat_router,
    prefix="/api/v1/chat",
    tags=["Chat"],
)

app.include_router(
    local_server_router,
    prefix="/api/v1/local-server",
    tags=["Local Server"],
)

app.include_router(
    public_api_router.router,
    prefix="/api/v1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "running",
        "service": "kai-universe-backend",
    }
