FROM python:3.10-slim

WORKDIR /app

# Prevent Python from writing .pyc files and buffer stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Ensure both `backend` and `ai` packages are importable from /app
ENV PYTHONPATH=/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend package
COPY . ./backend/

# Copy ai module (lives one level up from backend/ in the repo)
# The build context must be the repo root: docker build -f backend/Dockerfile .
COPY ai/ ./ai/

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
