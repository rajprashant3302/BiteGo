import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from kafka_producer import (
    add_to_cart_payload,
    connect_producer,
    disconnect_producer,
    order_placed_payload,
    send_event,
    user_search_payload,
    view_menu_payload,
)

# Load ENV
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔥 Lifespan started")  # ✅ DEBUG 1

    connect_producer()           # Kafka connection attempt

    try:
        yield
    finally:
        print("🛑 Shutting down Kafka producer")  # ✅ DEBUG 2
        disconnect_producer()


app = FastAPI(title="BiteGo Search Service", lifespan=lifespan)

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Elasticsearch setup
ES_HOST = os.getenv("ES_HOST", "http://bitego_es:9200")
es = Elasticsearch(
    [ES_HOST],
    headers={
        "Accept": "application/vnd.elasticsearch+json; compatible-with=8",
    },
    retry_on_timeout=True,
    max_retries=5,
)


def is_es_connected() -> bool:
    try:
        # `ping()` uses HEAD /, which is unreliable in this deployment.
        es.info()
        return True
    except Exception:
        return False


class ViewMenuBody(BaseModel):
    event: str
    restaurantId: int | str
    userId: int | str | None = None


class AddToCartBody(BaseModel):
    event: str
    restaurantId: int | str
    itemId: int | str
    quantity: int = 1
    userId: int | str | None = None


class UserSearchBody(BaseModel):
    event: str
    query: str
    userId: int | str | None = None
    restaurantId: int | str | None = None
    itemId: int | str | None = None


class OrderPlacedBody(BaseModel):
    event: str
    orderId: int | str
    restaurantId: int | str
    userId: int | str | None = None
    totalAmount: float | None = None
    itemCount: int | None = None


@app.post("/api/view-menu")
async def view_menu(body: ViewMenuBody):
    print("📩 API HIT: /api/view-menu")  # ✅ DEBUG 3

    try:
        payload = view_menu_payload(
            body.event,
            body.restaurantId,
            body.userId or "anonymous-user",
        )
        print("📤 Sending event:", payload)  # ✅ DEBUG 4

        await send_event("user-events", payload)

        print("✅ Event sent successfully")  # ✅ DEBUG 5

        return {"message": "Event sent to Kafka"}
    except Exception as e:
        print("❌ Kafka error:", str(e))  # ✅ DEBUG 6
        return JSONResponse(
            status_code=500,
            content={"error": "Kafka error", "detail": str(e)},
        )


@app.post("/api/add-to-cart")
async def add_to_cart(body: AddToCartBody):
    try:
        payload = add_to_cart_payload(
            body.event,
            body.restaurantId,
            body.itemId,
            body.quantity,
            body.userId or "anonymous-user",
        )

        await send_event("user-events", payload)

        return {"message": "Add-to-cart event sent to Kafka"}
    except Exception as e:
        print("❌ Kafka error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"error": "Kafka error", "detail": str(e)},
        )


@app.post("/api/user-search")
async def user_search(body: UserSearchBody):
    try:
        payload = user_search_payload(
            body.event,
            body.query,
            body.userId or "anonymous-user",
            body.restaurantId,
            body.itemId,
        )

        await send_event("user-events", payload)

        return {"message": "User-search event sent to Kafka"}
    except Exception as e:
        print("❌ Kafka error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"error": "Kafka error", "detail": str(e)},
        )


@app.post("/api/order-placed")
async def order_placed(body: OrderPlacedBody):
    try:
        payload = order_placed_payload(
            body.event,
            body.orderId,
            body.restaurantId,
            body.userId or "anonymous-user",
            body.totalAmount,
            body.itemCount,
        )

        await send_event("user-events", payload)

        return {"message": "Order-placed event sent to Kafka"}
    except Exception as e:
        print("❌ Kafka error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"error": "Kafka error", "detail": str(e)},
        )


@app.get("/search")
async def search(q: str = Query(..., min_length=1)):
    search_body = {
        "query": {
            "multi_match": {
                "query": q,
                "fields": ["name^3", "category^2", "description", "restaurant_name"],
                "fuzziness": "AUTO",
            }
        }
    }

    try:
        if not es.indices.exists(index="bitego_index"):
            return {"count": 0, "data": [], "message": "Search index not initialized yet."}

        response = es.search(index="bitego_index", body=search_body)

        results = []
        for hit in response["hits"]["hits"]:
            data = hit["_source"]
            data["score"] = hit["_score"]
            results.append(data)

        return {"count": len(results), "data": results}

    except Exception as e:
        return {"error": str(e), "data": []}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "elasticsearch": "connected" if is_es_connected() else "disconnected",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
