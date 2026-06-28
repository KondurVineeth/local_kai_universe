from dataclasses import dataclass
from datetime import datetime


@dataclass
class ServerLog:
    timestamp: datetime
    level: str
    message: str