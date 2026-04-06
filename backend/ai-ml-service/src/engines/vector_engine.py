import numpy as np
import redis
import json
import logging
from datetime import datetime
from elasticsearch import Elasticsearch

logger = logging.getLogger("ai-ml-service.vector-engine")

# --- Redis Connection ---
# host must match your docker-compose service name
r = redis.Redis(host='bitego-redis-1', port=6379, decode_responses=True)

ACTION_WEIGHTS = {
    "view": 1.0,
    "view_menu": 1.2,      # Slightly higher weight for intentional menu browsing
    "search_click": 1.5,
    "add_to_cart": 3.0,
    "purchase": 5.0
}

LAMBDA_DECAY = 0.023  # Influence halves roughly every 30 mins

def update_user_short_term_vector(es: Elasticsearch, user_id: str, index_name: str):
    """
    Calculates a weighted intent vector using both Items and Restaurant Centroids.
    """
    try:
        print(f"\n🔍 [DEBUG] Starting Intent Update for User: {user_id}")
        
        # 1. Fetch last 10 activities from user_events
        res = es.search(
            index=index_name,
            query={"term": {"userId": user_id}},
            sort=[{"timestamp": "desc"}],
            size=10
        )
        
        activities = [hit["_source"] for hit in res["hits"]["hits"]]
        if not activities:
            return

        # 2. Build a list of all possible Lookup IDs (Items & Restaurants)
        lookup_ids = []
        for act in activities:
            if act.get("itemId"):
                lookup_ids.append(f"item_{act['itemId']}")
            elif act.get("restaurantId"):
                lookup_ids.append(f"restaurant_{act['restaurantId']}")

        if not lookup_ids:
            print("⏭️ [DEBUG] No Item or Restaurant IDs found in recent history.")
            return

        # 3. Batch Fetch Vectors from bitego_index
        # This gets individual item vectors AND the pre-calculated restaurant averages
        vector_res = es.search(
            index="bitego_index",
            query={"ids": {"values": list(set(lookup_ids))}},
            _source=["item_vector"]
        )
        
        # Map the Elasticsearch ID (item_... or restaurant_...) to the vector
        vector_map = {hit["_id"]: hit["_source"]["item_vector"] for hit in vector_res["hits"]["hits"]}

        # 4. Calculate Weighted Mean with Temporal Decay
        weighted_vectors = []
        total_weight = 0
        now = datetime.utcnow().timestamp()

        for act in activities:
            # Hierarchy: Try to find Item Vector, fallback to Restaurant Centroid
            item_key = f"item_{act.get('itemId')}"
            rest_key = f"restaurant_{act.get('restaurantId')}"
            
            target_vector = vector_map.get(item_key) or vector_map.get(rest_key)
            
            if target_vector is None:
                continue

            # Timestamp Handling
            try:
                t_str = act["timestamp"].replace("Z", "+00:00")
                event_time = datetime.fromisoformat(t_str).timestamp()
            except:
                event_time = float(act["timestamp"]) 

            delta_t = (now - event_time) / 60  # minutes
            
            # Action Weighting
            action_type = act.get("event", "view").lower()
            base_w = ACTION_WEIGHTS.get(action_type, 1.0)
            
            # Temporal Decay Math: W = base * e^(-lambda * t)
            final_w = base_w * np.exp(-LAMBDA_DECAY * delta_t)
            
            weighted_vectors.append(np.array(target_vector) * final_w)
            total_weight += final_w
            
            source_type = "ITEM" if vector_map.get(item_key) else "RESTAURANT_CENTROID"
            print(f"   -> {source_type} | Weight: {final_w:.4f}")

        # 5. Save the final Intent Vector to Redis
        if weighted_vectors and total_weight > 0:
            user_vector = (np.sum(weighted_vectors, axis=0) / total_weight).tolist()
            
            redis_key = f"user:{user_id}:intent"
            r.setex(redis_key, 86400, json.dumps(user_vector))
            print(f"✅ [DEBUG] Updated Intent Vector in Redis for {user_id}")
        else:
            print("❌ [DEBUG] Math failed: No valid vectors found in history.")

    except Exception as e:
        logger.error(f"❌ [ERROR] Vector Engine failed: {e}")