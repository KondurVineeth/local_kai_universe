from dataclasses import dataclass
from datetime import datetime


@dataclass
class ServerInfo:
    status: str
    port: int
    started_at: datetime | None
    request_count: int