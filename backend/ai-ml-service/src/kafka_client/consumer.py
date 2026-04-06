import json
import logging
import os
import time
from datetime import datetime
from elasticsearch import Elasticsearch
from kafka import KafkaConsumer

# Import our ML Brain
from src.engines.vector_engine import update_user_short_term_vector

# --- Logging Setup ---
logger = logging.getLogger("ai-ml-service.kafka-consumer")

# --- Environment Variables ---
ES_HOST = os.getenv("ES_HOST", "http://bitego_es:9200")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "user-events")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "ai-ml-group")
KAFKA_AUTO_OFFSET_RESET = os.getenv("KAFKA_AUTO_OFFSET_RESET", "earliest")

# Kafka Performance & Timeout Tuning
KAFKA_SESSION_TIMEOUT_MS = int(os.getenv("KAFKA_SESSION_TIMEOUT_MS", "45000"))
KAFKA_HEARTBEAT_INTERVAL_MS = int(os.getenv("KAFKA_HEARTBEAT_INTERVAL_MS", "15000"))
KAFKA_MAX_POLL_INTERVAL_MS = int(os.getenv("KAFKA_MAX_POLL_INTERVAL_MS", "300000"))
RETRY_DELAY_SECONDS = int(os.getenv("AI_ML_CONSUMER_RETRY_DELAY", "5"))

# Elasticsearch Index Config
DEFAULT_INDEX_NAME = "user_events"
INDEX_NAME = os.getenv("AI_ML_EVENTS_INDEX", DEFAULT_INDEX_NAME)

INDEX_MAPPINGS = {
    "dynamic": True,
    "properties": {
        "event": {"type": "keyword"},        # e.g., 'view', 'add_to_cart'
        "restaurantId": {"type": "keyword"},
        "itemId": {"type": "keyword"},
        "userId": {"type": "keyword"},
        "quantity": {"type": "integer"},
        "timestamp": {"type": "date"},       # Essential for Temporal Decay math
    },
}

# --- Infrastructure Helpers ---

def create_es_client():
    return Elasticsearch(
        [ES_HOST],
        headers={"Accept": "application/vnd.elasticsearch+json; compatible-with=8"},
        retry_on_timeout=True,
        max_retries=5,
    )

def ensure_index(es: Elasticsearch, index_name: str) -> str:
    """Ensures the event logging index exists with correct mappings."""
    if not es.indices.exists(index=index_name):
        es.indices.create(index=index_name, mappings=INDEX_MAPPINGS)
        logger.info(f"✅ Created Elasticsearch index={index_name}")
    return index_name

# --- Main Consumer Logic ---

def start_consumer():
    logger.info(f"🚀 Starting Kafka Consumer on topic: {KAFKA_TOPIC}")

    while True:
        consumer = None
        try:
            # 1. Prepare Infrastructure Connections
            es = create_es_client()
            if not es.info():
                raise ConnectionError("Could not verify Elasticsearch info.")
            
            write_index = ensure_index(es, INDEX_NAME)
            
            # 2. Initialize Kafka Consumer
            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                auto_offset_reset=KAFKA_AUTO_OFFSET_RESET,
                group_id=KAFKA_GROUP_ID,
                enable_auto_commit=False, # We commit manually after ES & Redis are updated
                session_timeout_ms=KAFKA_SESSION_TIMEOUT_MS,
                heartbeat_interval_ms=KAFKA_HEARTBEAT_INTERVAL_MS,
                max_poll_interval_ms=KAFKA_MAX_POLL_INTERVAL_MS
            )

            logger.info("📡 Kafka Consumer connected. Awaiting events...")

            # 3. Message Processing Loop
            for message in consumer:
                event_data = message.value
                user_id = event_data.get("userId")
                item_id = event_data.get("itemId")
                restaurant_id = event_data.get("restaurantId")
                action = event_data.get("event")

                print(f"\n📥 [KAFKA] Received: {action} | User: {user_id} | Item: {item_id} | Restaurant: {restaurant_id}")

                try:
                    # STEP A: Log the raw event to Elasticsearch (Historical Persistence)
                    if "timestamp" not in event_data:
                        event_data["timestamp"] = datetime.utcnow().isoformat() + "Z"

                    response = es.index(
                        index=write_index,
                        document=event_data,
                        request_timeout=30,
                    )
                    
                    # STEP B: Trigger the ML Vector Update (Real-Time Intent)
                    # UPDATED LOGIC: Allow update if we have an item OR a restaurant (for VIEW_MENU)
                    if user_id and (item_id or restaurant_id):
                        print(f"🧠 [ML] Triggering Intent Update for User: {user_id}")
                        # The vector_engine now handles the fallback from item to restaurant centroid
                        update_user_short_term_vector(es, user_id, write_index)
                    else:
                        print(f"⏭️ [ML] Skipping Vector Update: Missing userId AND (itemId/restaurantId)")

                    # STEP C: Commit the Kafka Offset
                    consumer.commit()
                    
                    print(f"✅ [SUCCESS] Event indexed (ID: {response.get('_id')}) and Kafka offset committed.")

                except Exception as e:
                    logger.error(f"❌ [ERROR] Failed to process message at offset {message.offset}: {e}")

        except Exception as e:
            logger.error(f"⚠️ [FATAL] Kafka Consumer crashed: {e}. Retrying in {RETRY_DELAY_SECONDS}s...")
            time.sleep(RETRY_DELAY_SECONDS)
        
        finally:
            if consumer is not None:
                consumer.close()
                logger.info("🛑 Kafka Consumer connection closed.")