import json
import uuid

from datetime import datetime
from pathlib import Path
from app.modules.downloads.domain.entities.download import Download
from app.modules.downloads.domain.entities.download_status import DownloadStatus
from app.modules.downloads.domain.repositories.download_repository import (DownloadRepository,)


DOWNLOADS_FILE = (
    Path(__file__)
    .resolve()
    .parents[4]
    / "storage"
    / "downloads"
    / "downloads.json"
)


class JsonDownloadRepository(DownloadRepository):

    def _read(self) -> list[dict]:
        if not DOWNLOADS_FILE.exists():
            return []
        with open(DOWNLOADS_FILE, "r", encoding="utf-8",) as file:
            return json.load(file)

    def _write(self, data: list[dict],) -> None:
        with open(DOWNLOADS_FILE, "w", encoding="utf-8",) as file:
            json.dump(
                data,
                file,
                indent=2,
            )

    def _to_entity(self, item: dict,) -> Download:
        return Download(
            id=item["id"],
            model_id=item["model_id"],
            quantization=item["quantization"],
            total_bytes=item["total_bytes"],
            received_bytes=item["received_bytes"],
            status=item["status"],
            bytes_per_second=item["bytes_per_second"],
            started_at=datetime.fromisoformat(
                item["started_at"]
            ),
            completed_at=(
                datetime.fromisoformat(item["completed_at"])
                if item["completed_at"]
                else None
            ),
            error_message=item["error_message"],
        )

    def list(self) -> list[Download]:
        return [
            self._to_entity(item)
            for item in self._read()
        ]

    def find_by_id(self, download_id: str,) -> Download | None:
        for item in self._read():
            if item["id"] == download_id:
                return self._to_entity(item)
        return None

    def enqueue(self, model_id: str, quantization: str, total_bytes: int,) -> Download:
        data = self._read()
        record = {
            "id": str(uuid.uuid4()),
            "model_id": model_id,
            "quantization": quantization,
            "total_bytes": total_bytes,
            "received_bytes": 0,
            "status": DownloadStatus.QUEUED.value,
            "bytes_per_second": 0,
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
            "error_message": None,
        }
        data.append(record)
        self._write(data)
        return self._to_entity(record)

    def update_status(self,download_id: str,status: str,) -> None:
        data = self._read()

        for item in data:
            if item["id"] == download_id:
                item["status"] = status
                break

        self._write(data)
        
    def mark_completed(
    self,
    download_id: str,
) -> None:
        data = self._read()

        for item in data:
            if item["id"] == download_id:
                item["status"] = DownloadStatus.COMPLETED.value
                item["completed_at"] = datetime.utcnow().isoformat()
                break

        self._write(data)
        
        
    def mark_failed(
    self,
    download_id: str,
    error_message: str,
) -> None:
        data = self._read()

        for item in data:
            if item["id"] == download_id:
                item["status"] = DownloadStatus.FAILED.value
                item["error_message"] = error_message
                break

        self._write(data)

    def pause(self, download_id: str,) -> None:
        data = self._read()
        for item in data:
            if item["id"] == download_id:
                item["status"] = DownloadStatus.PAUSED.value
        self._write(data)

    def resume(self, download_id: str,) -> None:
        data = self._read()
        for item in data:
            if item["id"] == download_id:
                item["status"] = DownloadStatus.DOWNLOADING.value
        self._write(data)

    def cancel(self, download_id: str,) -> None:
        data = self._read()
        for item in data:
            if item["id"] == download_id:
                item["status"] = DownloadStatus.CANCELLED.value
        self._write(data)