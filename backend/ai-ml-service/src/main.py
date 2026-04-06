import logging
import os
import threading
import json
import redis
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from elasticsearch import Elasticsearch

# --- Logging Configuration ---
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    force=True,
)
logging.getLogger("kafka").setLevel(logging.WARNING)
logging.getLogger("elastic_transport").setLevel(logging.WARNING) # Reduce ES noise
logger = logging.getLogger("ai-ml-service")

# --- Infrastructure Connections ---
# These match your Docker Compose service names
ES_HOST = os.getenv("ES_HOST", "http://bitego_es:9200")
REDIS_HOST = os.getenv("REDIS_HOST", "bitego-redis-1")

es = Elasticsearch(
    [ES_HOST],
    headers={"Accept": "application/vnd.elasticsearch+json; compatible-with=8"}
)
r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI-ML service starting")

    # Start Kafka Consumer in a background thread
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

# --- Endpoints ---

@app.get("/")
def root():
    return {"message": "AI-ML Service Running"}

@app.get("/health")
def health():
    # Basic connectivity check
    try:
        es_up = es.ping()
        redis_up = r.ping()
        return {"status": "ok", "elasticsearch": es_up, "redis": redis_up}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str, limit: int = 10):
    """
    Fetches personalized food recommendations using k-NN vector search.
    """
    try:
        # 1. Retrieve the User's Intent Vector from Redis
        vector_json = r.get(f"user:{user_id}:intent")
        
        if not vector_json:
            logger.info(f"No intent vector for {user_id}, returning trending items.")
            # Fallback: Return first 10 items if no history exists
            res = es.search(
                index="bitego_index", 
                query={"term": {"type": "MENU_ITEM"}}, 
                size=limit
            )
            return {
                "user_id": user_id, 
                "source": "trending", 
                "results": [hit["_source"] for hit in res["hits"]["hits"]]
            }

        user_vector = json.loads(vector_json)

        # 2. Perform k-NN (Vector Similarity) Search in Elasticsearch
        # We find the top 'limit' items mathematically closest to the user's vector
        knn_query = {
            "field": "item_vector",
            "query_vector": user_vector,
            "k": limit,
            "num_candidates": 50
        }

        # Filter by type 'MENU_ITEM' so we don't recommend 'RESTAURANT' docs
        filter_query = {"term": {"type": "MENU_ITEM"}}

        response = es.search(
            index="bitego_index",
            knn=knn_query,
            query=filter_query,
            _source=["id", "name", "description", "category", "type"]
        )

        # In main.py, update the results list:
        recommendations = [
            {**hit["_source"], "score": hit["_score"]} 
            for hit in response["hits"]["hits"]
            if hit["_source"].get("type") == "MENU_ITEM"  # 🔥 This hides the centroids
        ]

        return {
            "user_id": user_id,
            "source": "personalized",
            "count": len(recommendations),
            "results": recommendations
        }

    except Exception as e:
        logger.error(f"❌ Recommendation Engine Error: {e}")
        raise HTTPException(status_code=500, detail="Internal AI Engine Error")