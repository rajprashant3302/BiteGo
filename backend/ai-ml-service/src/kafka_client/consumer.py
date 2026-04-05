import json
import logging
import os
import time

from elasticsearch import Elasticsearch
from kafka import KafkaConsumer

logger = logging.getLogger("ai-ml-service.kafka-consumer")

ES_HOST = os.getenv("ES_HOST", "http://bitego_es:9200")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "user-events")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "ai-ml-group")
KAFKA_AUTO_OFFSET_RESET = os.getenv("KAFKA_AUTO_OFFSET_RESET", "earliest")
RETRY_DELAY_SECONDS = int(os.getenv("AI_ML_CONSUMER_RETRY_DELAY", "5"))
KAFKA_SESSION_TIMEOUT_MS = int(
    os.getenv("KAFKA_SESSION_TIMEOUT_MS", "45000")
)
KAFKA_HEARTBEAT_INTERVAL_MS = int(
    os.getenv("KAFKA_HEARTBEAT_INTERVAL_MS", "15000")
)
KAFKA_MAX_POLL_INTERVAL_MS = int(
    os.getenv("KAFKA_MAX_POLL_INTERVAL_MS", "300000")
)
KAFKA_CONSUMER_REQUEST_TIMEOUT_MS = int(
    os.getenv("KAFKA_CONSUMER_REQUEST_TIMEOUT_MS", "60000")
)

DEFAULT_INDEX_NAME = "user_events"
INDEX_NAME = os.getenv("AI_ML_EVENTS_INDEX", DEFAULT_INDEX_NAME)
FALLBACK_INDEX_NAME = os.getenv(
    "AI_ML_EVENTS_FALLBACK_INDEX", f"{INDEX_NAME}_fallback"
)
INDEX_MAPPINGS = {
    "dynamic": True,
    "properties": {
        "event": {"type": "keyword"},
        "restaurantId": {"type": "keyword"},
        "itemId": {"type": "keyword"},
        "userId": {"type": "keyword"},
        "quantity": {"type": "integer"},
        "timestamp": {"type": "date"},
    },
}
EXPECTED_FIELD_TYPES = {
    "event": {"keyword"},
    "restaurantId": {"keyword"},
    "itemId": {"keyword"},
    "userId": {"keyword"},
    "quantity": {"integer", "long", "short", "byte"},
    "timestamp": {"date"},
}


def create_es_client():
    return Elasticsearch(
        [ES_HOST],
        headers={
            "Accept": "application/vnd.elasticsearch+json; compatible-with=8",
        },
        retry_on_timeout=True,
        max_retries=5,
    )


def check_es_connectivity(es: Elasticsearch) -> bool:
    try:
        # `ping()` issues HEAD /, which can return 400 in this setup even when ES
        # is actually healthy. `info()` uses GET / and matches the container healthcheck.
        es.info()
        return True
    except Exception:
        logger.exception("Elasticsearch connectivity check failed")
        return False


def create_index(es: Elasticsearch, index_name: str) -> None:
    es.indices.create(
        index=index_name,
        mappings=INDEX_MAPPINGS,
    )
    logger.info("Created Elasticsearch index=%s with explicit mappings", index_name)


def get_incompatible_field_types(es: Elasticsearch, index_name: str) -> dict[str, str]:
    mapping = es.indices.get_mapping(index=index_name)
    properties = mapping.get(index_name, {}).get("mappings", {}).get("properties", {})
    incompatible_fields: dict[str, str] = {}

    for field_name, allowed_types in EXPECTED_FIELD_TYPES.items():
        field_mapping = properties.get(field_name)
        if not field_mapping:
            continue

        actual_type = field_mapping.get("type")
        if actual_type and actual_type not in allowed_types:
            incompatible_fields[field_name] = actual_type

    return incompatible_fields


def ensure_index(es: Elasticsearch, index_name: str) -> str:
    if not es.indices.exists(index=index_name):
        create_index(es, index_name)
        return index_name

    incompatible_fields = get_incompatible_field_types(es, index_name)
    if not incompatible_fields:
        es.indices.put_mapping(index=index_name, properties=INDEX_MAPPINGS["properties"])
        return index_name

    logger.warning(
        "Elasticsearch index=%s has incompatible mappings=%s",
        index_name,
        incompatible_fields,
    )

    if not es.indices.exists(index=FALLBACK_INDEX_NAME):
        create_index(es, FALLBACK_INDEX_NAME)

    fallback_incompatible_fields = get_incompatible_field_types(es, FALLBACK_INDEX_NAME)
    if fallback_incompatible_fields:
        raise RuntimeError(
            "Fallback Elasticsearch index has incompatible mappings: "
            f"{fallback_incompatible_fields}"
        )

    logger.warning(
        "Writing Kafka events to fallback Elasticsearch index=%s. "
        "Delete or reindex %s if you want to reuse the original index name.",
        FALLBACK_INDEX_NAME,
        index_name,
    )
    return FALLBACK_INDEX_NAME


def start_consumer():
    logger.info(
        "Starting Kafka consumer topic=%s brokers=%s group_id=%s es_host=%s",
        KAFKA_TOPIC,
        KAFKA_BOOTSTRAP_SERVERS,
        KAFKA_GROUP_ID,
        ES_HOST,
    )

    while True:
        consumer = None

        try:
            es = create_es_client()
            es_available = check_es_connectivity(es)
            logger.info("Elasticsearch connectivity check: %s", es_available)
            write_index = ensure_index(es, INDEX_NAME)
            logger.info("Kafka events will be written to Elasticsearch index=%s", write_index)
            logger.info(
                "Kafka consumer will wait for messages; initial group rebalance logs are normal"
            )

            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_deserializer=lambda message: json.loads(
                    message.decode("utf-8")
                ),
                auto_offset_reset=KAFKA_AUTO_OFFSET_RESET,
                group_id=KAFKA_GROUP_ID,
                enable_auto_commit=False,
                session_timeout_ms=KAFKA_SESSION_TIMEOUT_MS,
                heartbeat_interval_ms=KAFKA_HEARTBEAT_INTERVAL_MS,
                max_poll_interval_ms=KAFKA_MAX_POLL_INTERVAL_MS,
                request_timeout_ms=KAFKA_CONSUMER_REQUEST_TIMEOUT_MS,
            )

            logger.info("Kafka consumer connected and waiting for messages")

            for message in consumer:
                event = message.value
                logger.info(
                    "Received Kafka message topic=%s partition=%s offset=%s payload=%s",
                    message.topic,
                    message.partition,
                    message.offset,
                    event,
                )

                try:
                    response = es.index(
                        index=write_index,
                        document=event,
                        request_timeout=30,
                    )
                    consumer.commit()
                    logger.info(
                        "Stored event in Elasticsearch index=%s result=%s id=%s",
                        write_index,
                        response.get("result"),
                        response.get("_id"),
                    )
                except Exception:
                    logger.exception(
                        "Failed to store Kafka event in Elasticsearch payload=%s",
                        event,
                    )

            logger.warning("Kafka consumer loop exited unexpectedly; reconnecting")
        except Exception:
            logger.exception(
                "Kafka consumer startup/run failure. Retrying in %s seconds",
                RETRY_DELAY_SECONDS,
            )
            time.sleep(RETRY_DELAY_SECONDS)
        finally:
            if consumer is not None:
                try:
                    consumer.close()
                except Exception:
                    logger.exception("Failed to close Kafka consumer cleanly")
