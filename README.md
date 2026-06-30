# Kai Universe

## Overview

Kai Universe is an Electron desktop application for discovering, downloading, loading, and interacting with local Large Language Models (LLMs).

This repository contains:

- Electron + React frontend
- FastAPI backend

The backend communicates with the local Gateway, which forwards requests to Nano Upstream for model inference.

---

# Project Structure

```
company_frontend/
│
├── kai_universe_backend/
│
└── kai_universe_ui/
```

---

# Prerequisites

Ensure the following are installed before starting.

- Python 3.11+
- Node.js 20+
- npm
- Git

---

# Clone Repository

```bash
git clone the GitHub repository

cd company_frontend
```

---

# Backend Setup

Navigate to the backend.

```bash
cd kai_universe_backend
```

Create a virtual environment.

```bash
python -m venv .venv
```

Activate the virtual environment.

### Windows

```bash
.venv\Scripts\activate
```

### Linux / macOS

```bash
source .venv/bin/activate
```

Install Python dependencies.

```bash
pip install -r requirements.txt
```

---

# Frontend Setup

Navigate to the frontend.

```bash
cd ../kai_universe_ui
```

Install Node dependencies.

```bash
npm install
```

---

# Running the Application

The services must be started in the following order.

---

## 1. Start Nano Upstream

Navigate to the Kai Tools repository.

Run Nano Upstream.

```bash
uvicorn nano_upstream:app --host 127.0.0.1 --port 8080
```

---

## 2. Start Gateway

Open another terminal.
Navigate to Kai Tools.

Run Gateway.

```bash
python -m gateway.app.main
```

---

## 3. Start Backend

Open another terminal.

Navigate to the backend.

```bash
cd company_frontend/kai_universe_backend
```

Activate the virtual environment.

Windows

```bash
.venv\Scripts\activate
```

Linux / macOS

```bash
source .venv/bin/activate
```

Run the backend.

```bash
python -m uvicorn app.main:app --reload
```

The backend will run on:

```
http://127.0.0.1:8000
```

---

## 4. Start the Electron UI

Open another terminal.

Navigate to the frontend.

```bash
cd company_frontend/kai_universe_ui
```

Run the application.

```bash
npm run dev
```

The Electron desktop application should launch automatically.

---

# Service Summary

| Service | Port |
|----------|------|
| Nano Upstream | 8080 |
| Gateway | 9000 |
| Backend | 8000 |
| Electron UI | Desktop Application |

---