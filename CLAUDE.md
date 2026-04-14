# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

## Current Status

**PL-6 complete. All features merged to `main`.** Foundation built across PL-3 through PL-6:
- FastAPI backend (`backend/`) — uv project, SQLite auth (signup/login with JWT), DB created fresh each container start
- Next.js frontend (`frontend/`) — static export served by FastAPI at http://localhost:8000
- Docker — multi-stage `Dockerfile` + `docker-compose.yml`
- Scripts — `scripts/start-mac.sh` / `scripts/stop-mac.sh` (and Linux/Windows equivalents)

**PL-5 feature (done):** Replaced the Mutual NDA form with a freeform AI chat interface. The AI collects NDA fields through natural conversation and populates a live document preview.

**PL-6 feature (done):** Expanded to all 11 supported document types. After login, users see a document selector (card grid with search). Selecting a type opens the split-screen chat+preview workspace. The AI is guided by a per-document field schema. The backend returns 400 for unsupported document types and instructs the AI to suggest the closest supported alternative.

**AI provider:** LiteLLM → Groq (`groq/llama-3.3-70b-versatile`). API key `GROQ_API_KEY` in `.env` and `docker-compose.yml`. JSON mode (`response_format: {"type": "json_object"}`) used for structured output.

**Key backend files:**
- `backend/app/documents.py` — registry of all 11 document types with typed field schemas
- `backend/app/routers/chat.py` — generic chat endpoint driven by the registry
- `backend/app/routers/catalog.py` — `GET /api/catalog` listing supported document types
- `backend/app/routers/auth.py` — signup/login returning JWT

**Key frontend files:**
- `frontend/src/components/DocSelector.tsx` — document type selector (card grid + search)
- `frontend/src/components/DocChat.tsx` — generic AI chat component
- `frontend/src/components/DocPreview.tsx` — live field-summary preview with progress bar
- `frontend/src/app/page.tsx` — auth guard + selector → workspace flow
- `frontend/src/app/login/page.tsx` — sign in / create account

**Test suite:** 33 tests (unit + integration) covering auth, document registry integrity, catalog endpoint, all 11 document types, edge cases. All passing.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use LiteLLM with Groq as the inference provider (`groq/llama-3.3-70b-versatile`). Use `response_format={"type": "json_object"}` (Groq JSON mode) so the model returns structured output that can be parsed to populate document fields.

There is a `GROQ_API_KEY` in the `.env` file in the project root. This must also be set in `docker-compose.yml` under `environment`.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

