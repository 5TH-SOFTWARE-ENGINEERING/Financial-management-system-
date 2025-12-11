# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        postgresql-client \
        libpq-dev \
        curl \
        && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Create app directory structure
RUN mkdir -p app/core app/models app/schemas app/crud app/api/v1 app/api/endpoints app/services app/utils alembic reports backups uploads

# Copy application code
COPY app/ ./app/
COPY alembic.ini .
# Note: If you have an alembic/ directory with migrations, uncomment the line below
# COPY alembic/ ./alembic/

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && chown -R appuser:appuser /app

# Create necessary directories and set permissions
RUN mkdir -p /app/uploads /app/reports /app/backups /app/logs \
    && chown -R appuser:appuser /app/uploads /app/reports /app/backups /app/logs

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
