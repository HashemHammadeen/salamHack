# ============================================================
# Stage 1: Build React frontends
# ============================================================
FROM node:20-slim AS frontend-build

WORKDIR /app

# Copy and build piecemint frontend
COPY piecemint/frontend/package*.json ./piecemint/frontend/
RUN cd piecemint/frontend && npm ci

# Copy marketplace frontend package files
COPY marketplace/frontend/package*.json ./marketplace/frontend/
RUN cd marketplace/frontend && npm ci

# Copy full frontend source trees
COPY piecemint/frontend/ ./piecemint/frontend/
COPY marketplace/frontend/ ./marketplace/frontend/

# Build both
RUN cd piecemint/frontend && npm run build
RUN cd marketplace/frontend && npm run build

# ============================================================
# Stage 2: Python runtime + built frontends
# ============================================================
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir pipenv

COPY piecemint/backend/Pipfile piecemint/backend/Pipfile.lock ./
RUN pipenv install --system --deploy

# Copy backend source code (excluding venv and __pycache__)
COPY piecemint/backend/ ./
RUN find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

# Copy built frontends into dist/
COPY --from=frontend-build /app/piecemint/frontend/dist ./dist/piecemint-frontend
COPY --from=frontend-build /app/marketplace/frontend/dist ./dist/marketplace-frontend

ENV PORT=10000
EXPOSE $PORT

CMD sh -c "uvicorn unified_app:app --host 0.0.0.0 --port $PORT"
