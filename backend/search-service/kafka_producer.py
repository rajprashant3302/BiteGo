"""
Kafka producer for search-service (kafka-python).
Named kafka_producer.py to avoid shadowing the `kafka` package from site-packages.
"""
from __future__ import annotations
import time
import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional

from kafka import KafkaProducer

logger = logging.getLogger(__name__)

_producer: Optional[KafkaProducer] = None


def _bootstrap_servers() -> list[str]:
    raw = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
    return [h.strip() for h in raw.split(",") if h.strip()]


def connect_producer() -> None:
    global _producer
    if _producer is not None:
        return

    for i in range(20):  # retry 20 times
        try:
            _producer = KafkaProducer(
                bootstrap_servers=_bootstrap_servers(),
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            logger.info("Kafka producer connected")
            return
        except Exception as e:
            logger.warning(f"Kafka not ready, retry {i+1}/10: {e}")
            time.sleep(5)

    raise Exception("Kafka not available after retries")


def disconnect_producer() -> None:
    global _producer
    if _producer is not None:
        _producer.flush()
        _producer.close()
        _producer = None
        logger.info("Kafka producer disconnected")


async def send_event(topic: str, data: dict[str, Any]) -> None:
    if _producer is None:
        connect_producer()
    assert _producer is not None

    loop = asyncio.get_running_loop()

    def _send() -> None:
        future = _producer.send(topic, value=data)
        future.get(timeout=30)

    await loop.run_in_executor(None, _send)


def view_menu_payload(
    event: str,
    restaurant_id: Any,
    user_id: Any = "test-user",
) -> dict[str, Any]:
    return {
        "event": event,
        "restaurantId": restaurant_id,
        "userId": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def add_to_cart_payload(
    event: str,
    restaurant_id: Any,
    item_id: Any,
    quantity: int,
    user_id: Any = "test-user",
) -> dict[str, Any]:
    return {
        "event": event,
        "restaurantId": restaurant_id,
        "itemId": item_id,
        "quantity": quantity,
        "userId": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def user_search_payload(
    event: str,
    query: str,
    user_id: Any = "test-user",
    restaurant_id: Any | None = None,
    item_id: Any | None = None,
) -> dict[str, Any]:
    payload = {
        "event": event,
        "query": query,
        "userId": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if restaurant_id is not None:
        payload["restaurantId"] = restaurant_id
    if item_id is not None:
        payload["itemId"] = item_id

    return payload


def order_placed_payload(
    event: str,
    order_id: Any,
    restaurant_id: Any,
    user_id: Any = "test-user",
    total_amount: float | None = None,
    item_count: int | None = None,
) -> dict[str, Any]:
    payload = {
        "event": event,
        "orderId": order_id,
        "restaurantId": restaurant_id,
        "userId": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if total_amount is not None:
        payload["totalAmount"] = total_amount
    if item_count is not None:
        payload["itemCount"] = item_count

    return payload
