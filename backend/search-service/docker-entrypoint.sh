#!/bin/sh
set -e

echo "🔄 Search-service startup: preparing vector index via sync_worker..."

MAX_RETRIES="${SYNC_WORKER_MAX_RETRIES:-20}"
RETRY_DELAY="${SYNC_WORKER_RETRY_DELAY_SECONDS:-5}"
attempt=1

while [ "$attempt" -le "$MAX_RETRIES" ]; do
  echo "sync_worker attempt ${attempt}/${MAX_RETRIES}"
  if python backend/search-service/sync_worker.py; then
    echo "✅ sync_worker completed"
    break
  fi

  echo "⚠️ sync_worker failed (attempt ${attempt}). Retrying in ${RETRY_DELAY}s..."
  attempt=$((attempt + 1))
  sleep "$RETRY_DELAY"
done

if [ "$attempt" -gt "$MAX_RETRIES" ]; then
  echo "❌ sync_worker failed after ${MAX_RETRIES} attempts. Starting API anyway."
fi

exec python backend/search-service/main.py
