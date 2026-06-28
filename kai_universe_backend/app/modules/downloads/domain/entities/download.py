from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Download:
    id: str
    model_id: str
    quantization: str
    total_bytes: int
    received_bytes: int
    status: str
    bytes_per_second: int
    started_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]    