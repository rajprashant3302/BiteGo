import json
import numpy as np
from datetime import datetime
from ..utils.db import db

# Configuration: How much should new behavior change the permanent profile?
# 0.1 means 10% new behavior, 90% old habits.
LEARNING_RATE = 0.1 

async def update_user_long_term_vector(user_id: str, redis_client):
    """
    Nudges the User's Long-Term Taste Profile using their 
    Short-Term behavior cached in Redis.
    """
    try:
        # 1. Fetch Short-Term Vector (ST) from Redis
        st_raw = redis_client.get(f"user:{user_id}:intent")
        if not st_raw:
            print(f"ℹ️ [AI] No recent activity in Redis for {user_id}. Skipping sync.")
            return

        st_vec = np.array(json.loads(st_raw))

        # 2. Fetch existing Long-Term Vector (LT) from Neon (Postgres)
        user = await db.user.find_unique(where={'UserID': user_id})
        
        if not user:
            print(f"❌ [AI] User {user_id} not found in Database.")
            return

        # 3. Calculate the New Long-Term Vector
        if not user.longTermVector:
            # Cold Start: No LT profile exists yet, use the current ST
            new_lt_vec = st_vec
            print(f"✨ [AI] Initializing LT profile for {user_id}")
        else:
            lt_old = np.array(json.loads(user.longTermVector))
            
            # --- THE RECURSIVE NUDGE (Exponential Moving Average) ---
            # Result = (Old * 0.9) + (New * 0.1)
            new_lt_vec = ((1 - LEARNING_RATE) * lt_old) + (LEARNING_RATE * st_vec)
            print(f"📈 [AI] Nudging LT profile for {user_id}")

        # 4. Save the Result back to Neon
        await db.user.update(
            where={'UserID': user_id},
            data={
                'longTermVector': json.dumps(new_lt_vec.tolist()),
                'lastVectorUpdate': datetime.now()
            }
        )
        redis_client.setex(f"user:{user_id}:long_term", 86400, json.dumps(new_lt_vec.tolist())) # Update Cache

        # 5. CRITICAL: Clear the Redis cache or set a shorter TTL 
        # so we don't 'double-count' the same orders in the next 12-hour sync.
        redis_client.delete(f"user:{user_id}:intent")
        
        print(f"✅ [AI] Long-term profile sync complete for {user_id}")

    except Exception as e:
        print(f"❌ [AI] Long-term sync failed: {e}")