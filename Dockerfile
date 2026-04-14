# Stage 1: Build the Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build


# Stage 2: Backend runtime
FROM python:3.12-slim AS backend

WORKDIR /app/backend

# Install uv
RUN pip install --no-cache-dir uv

# Install Python dependencies
COPY backend/pyproject.toml ./
RUN uv pip install --system --no-cache \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.30.0" \
    "sqlalchemy>=2.0.0" \
    "passlib[bcrypt]>=1.7.4" \
    "python-jose[cryptography]>=3.3.0" \
    "python-multipart>=0.0.9" \
    "pydantic>=2.0.0" \
    "pydantic-settings>=2.0.0" \
    "email-validator>=2.0.0" \
    "litellm>=1.40.0"

# Copy backend source
COPY backend/ .

# Copy frontend static export
COPY --from=frontend-builder /app/frontend/out ./static/

# SQLite data directory — ephemeral, re-created fresh each container start
RUN mkdir -p /app/data

EXPOSE 8000

ENV DATABASE_URL="sqlite:////app/data/prelegal.db"

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
