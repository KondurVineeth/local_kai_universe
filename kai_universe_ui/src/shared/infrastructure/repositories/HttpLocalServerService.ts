import type { LogLevel } from '@features/local-server/domain/entities/LogEntry';
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/local-server';


export interface ServerInfo {
  status: string;
  port: number;
  started_at: string | null;
  request_count: number;
}

export interface LoadedModel {
    model_id: string;

    author: string;

    display_name: string;

    hf_repository: string;

    status: string;

    size_gb: number;

    vision: boolean;

    reasoning: boolean;

    tools: boolean;
}

export interface ServerLog {
  timestamp: string;
  level: LogLevel;
  message: string;
}

export class HttpLocalServerService {
    async getStatus(): Promise<ServerInfo> {
  const response = await fetch(`${API_BASE_URL}/status`);

  if (!response.ok) {
    throw new Error('Failed to fetch server status');
  }

  return await response.json();
}

async clearLogs(): Promise<void> {

  const response = await fetch(
    `${API_BASE_URL}/logs/clear`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to clear logs");
  }
}

async startServer(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/start`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to start server');
  }
}

async stopServer(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/stop`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to stop server');
  }
}

async getLoadedModels(): Promise<LoadedModel[]> {
  const response = await fetch(`${API_BASE_URL}/models`);

  if (!response.ok) {
    throw new Error('Failed to fetch loaded models');
  }

  return await response.json();
}

async getPublicModels(): Promise<LoadedModel[]> {
    const response = await fetch(
        "http://127.0.0.1:8000/api/v1/models",
    );

    if (!response.ok) {
        throw new Error("Failed to fetch models");
    }

    return await response.json();
}

async loadModel(
  modelId: string,
  hfRepository: string,
): Promise<void> {

  const response = await fetch(`${API_BASE_URL}/load`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: modelId,
      hf_repository: hfRepository,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to load model');
  }
}

async unloadModel(
  modelId: string,
): Promise<void> {

  const response = await fetch(`${API_BASE_URL}/unload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: modelId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to unload model');
  }
}

async getLogs(): Promise<ServerLog[]> {
  const response = await fetch(`${API_BASE_URL}/logs`);

  if (!response.ok) {
    throw new Error('Failed to fetch server logs');
  }

  return await response.json();
}
}