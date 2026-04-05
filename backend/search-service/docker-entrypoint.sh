#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for Elasticsearch before running search sync..."
python - <<'PY'
import os
import sys
import time
from urllib.request import urlopen

es_host = os.getenv("ES_HOST", "http://bitego_es:9200").rstrip("/")

for attempt in range(1, 31):
    try:
        with urlopen(es_host, timeout=5) as response:
            if 200 <= response.status < 500:
                print(f"Elasticsearch is reachable at {es_host}")
                sys.exit(0)
    except Exception as exc:
        print(f"Elasticsearch not ready (attempt {attempt}/30): {exc}")
        time.sleep(5)

print("Elasticsearch did not become ready in time", file=sys.stderr)
sys.exit(1)
PY

echo "Running initial search index sync..."
for attempt in 1 2 3 4 5; do
  if python backend/search-service/sync_worker.py; then
    echo "Search sync completed"
    break
  fi

  if [ "$attempt" -eq 5 ]; then
    echo "Search sync failed after ${attempt} attempts" >&2
    exit 1
  fi

  echo "Search sync failed on attempt ${attempt}, retrying in 10 seconds..."
  sleep 10
done

echo "Starting search API..."
exec python backend/search-service/main.py
