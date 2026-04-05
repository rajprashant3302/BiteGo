import logging
import os
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    force=True,
)

# Kafka client emits transient rebalance/connectivity messages at INFO during
# normal group joins. Keep library noise down so real consumer failures stand out.
logging.getLogger("kafka").setLevel(logging.WARNING)

logger = logging.getLogger("ai-ml-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI-ML service starting")

    from src.kafka_client.consumer import start_consumer

    thread = threading.Thread(
        target=start_consumer,
        daemon=True,
        name="ai-ml-kafka-consumer",
    )
    thread.start()
    app.state.consumer_thread = thread

    logger.info("Kafka consumer thread started")

    yield

    logger.info("AI-ML service shutting down")


app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "AI-ML Service Running"}


@app.get("/health")
def health():
    return {"status": "ok"}
