from dataclasses import dataclass
from datetime import datetime


@dataclass
class InstalledModel:
    model_id: str
    display_name: str
    quantization: str
    size_bytes: int
    installed_at: datetime
    storage_path: str