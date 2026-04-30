FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir pipenv

COPY Pipfile Pipfile.lock ./
RUN pipenv install --system --deploy

COPY . .

# Set default port
ENV PORT=8000

# Expose port
EXPOSE $PORT

# Command to run the application using uvicorn
CMD sh -c "uvicorn mcp_server:mcp --host 0.0.0.0 --port $PORT"
