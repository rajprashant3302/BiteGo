import logging
import os
import threading
import json
import redis
import numpy as np # Added for vector math
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from elasticsearch import Elasticsearch
from apscheduler.schedulers.asyncio import AsyncIOScheduler # Added for 12hr sync

# Import your generated Prisma client and the sync engine
from src.utils.db import db 
from src.engines.long_term_engine import update_user_long_term_vector

# --- Logging Configuration ---
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    force=True,
)
logger = logging.getLogger("ai-ml-service")

# --- Infrastructure Connections ---
ES_HOST = os.getenv("ES_HOST", "http://bitego_es:9200")
REDIS_HOST = os.getenv("REDIS_HOST", "bitego-redis-1")

es = Elasticsearch(
    [ES_HOST],
    headers={"Accept": "application/vnd.elasticsearch+json; compatible-with=8"}
)
r = redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

# Initialize Scheduler
scheduler = AsyncIOScheduler()

# --- Scheduled Task ---
async def sync_all_active_users():
    """Wakes up every 12 hours to nudge Long-Term vectors using Redis data"""
    logger.info("⏰ Starting scheduled 12-hour Long-Term Vector sync...")
    # Find all users currently active in Redis
    keys = r.keys("user:*:intent")
    for key in keys:
        user_id = key.split(":")[1]
        await update_user_long_term_vector(user_id, r)
    logger.info(f"✅ Sync complete for {len(keys)} active users.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI-ML service starting")
    
    # 1. Connect to Neon Database
    await db.connect()
    
    # 2. Start the 12-hour scheduler
    scheduler.add_job(sync_all_active_users, 'interval', hours=12)
    scheduler.start()

    # Start Kafka Consumer
    from src.kafka_client.consumer import start_consumer
    thread = threading.Thread(target=start_consumer, daemon=True, name="ai-ml-kafka-consumer")
    thread.start()
    
    yield

    # Shutdown logic
    await db.disconnect()
    scheduler.shutdown()
    logger.info("AI-ML service shutting down")

app = FastAPI(lifespan=lifespan)

# --- Endpoints ---
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str, limit: int = 10):
    try:
        # --- HYBRID VECTOR LOGIC ---
        
        # 1. Get Short-Term (ST) from Redis
        st_json = r.get(f"user:{user_id}:intent")
        st_vec = np.array(json.loads(st_json)) if st_json else None
        
        # 2. Get Long-Term (LT) from Redis (Cache)
        lt_json = r.get(f"user:{user_id}:long_term")
        
        if not lt_json:
            # Cache Miss: Go to Neon (Postgres)
            user_record = await db.user.find_unique(where={'UserID': user_id})
            if user_record and user_record.longTermVector:
                lt_json = user_record.longTermVector
                # Save to Redis for 24 hours so we don't hit DB again
                r.setex(f"user:{user_id}:long_term", 86400, lt_json)
        
        # 3. Convert LT string to Numpy Array (The missing piece!)
        lt_vec = np.array(json.loads(lt_json)) if lt_json else None

        # 4. Determine Final Query Vector
        if st_vec is not None and lt_vec is not None:
            # Hybrid mix: 70% current intent, 30% permanent taste
            query_vector = (0.7 * st_vec) + (0.3 * lt_vec)
            source_tag = "hybrid"
        elif st_vec is not None:
            query_vector = st_vec
            source_tag = "short_term"
        elif lt_vec is not None:
            query_vector = lt_vec
            source_tag = "long_term"
        else:
            # Fallback to trending if absolutely no data exists
            logger.info(f"No history for {user_id}, returning trending items.")
            res = es.search(index="bitego_index", query={"term": {"type": "MENU_ITEM"}}, size=limit)
            return {
                "user_id": user_id, 
                "source": "trending", 
                "results": [hit["_source"] for hit in res["hits"]["hits"]]
            }

        # --- k-NN Search using the Final Vector ---
        knn_query = {
            "field": "item_vector",
            "query_vector": query_vector.tolist(), 
            "k": limit,
            "num_candidates": 50
        }

        response = es.search(
            index="bitego_index",
            knn=knn_query,
            query={"term": {"type": "MENU_ITEM"}},
            _source=["id", "name", "description", "category", "type", "imageUrl"]
        )

        recommendations = [{**hit["_source"], "score": hit["_score"]} for hit in response["hits"]["hits"]]

        return {
            "user_id": user_id,
            "source": source_tag,
            "count": len(recommendations),
            "results": recommendations
        }

    except Exception as e:
        logger.error(f"❌ Recommendation Engine Error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal AI Engine Error: {str(e)}")
