import os
import logging
import logging.config
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# --- LOGGING CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("search-service")

# Import the producer AFTER logging setup
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
    logger.info(f"Loaded environment variables from {env_path}")
else:
    load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🔥 Starting Search Service lifespan...")
    
    # Connect Kafka on Startup
    try:
        connect_producer()
    except Exception as e:
        logger.error(f"❌ Critical Startup Error: Could not connect to Kafka: {e}")
        # We don't exit(1) here so the HTTP server can still serve health checks
    
    yield
    
    # Disconnect Kafka on Shutdown
    logger.info("🛑 Shutting down Search Service...")
    disconnect_producer()

app = FastAPI(title="BiteGo Search Service", lifespan=lifespan)

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
    headers={"Accept": "application/vnd.elasticsearch+json; compatible-with=8"},
    retry_on_timeout=True,
    max_retries=5,
)

ORDER_IMAGE_BASE = os.getenv("NEXT_PUBLIC_ORDER_SERVICE_URL", "/order-api")
IMAGE_FALLBACK = "/placeholder-food.svg"

def normalize_image_url(raw: str | None) -> str:
    if not raw or not isinstance(raw, str):
        return IMAGE_FALLBACK

    url = raw.strip()
    if not url:
        return IMAGE_FALLBACK

    if url.startswith("data:image/"):
        return url
    if url.startswith("//"):
        return f"https:{url}"
    if url.startswith("http://"):
        return url.replace("http://", "https://", 1)
    if url.startswith("https://"):
        return url
    if url.startswith("/"):
        if url == IMAGE_FALLBACK:
            return url
        if url.startswith("/order-api/") or url.startswith("/svc/order/"):
            return url
        base = ORDER_IMAGE_BASE.rstrip("/")
        return f"{base}{url}"

    base = ORDER_IMAGE_BASE.rstrip("/")
    return f"{base}/{url.lstrip('/')}"

def is_es_connected() -> bool:
    try:
        es.info()
        return True
    except:
        return False

# --- PYDANTIC MODELS ---
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

# --- ENDPOINTS ---

@app.post("/api/view-menu")
async def view_menu(body: ViewMenuBody):
    logger.info(f"API Request: view-menu | User: {body.userId}")
    try:
        payload = view_menu_payload(body.event, body.restaurantId, body.userId or "anonymous-user")
        await send_event("user-events", payload)
        return {"message": "View-menu event processed"}
    except Exception as e:
        logger.error(f"Error in view-menu: {e}")
        return JSONResponse(status_code=500, content={"error": "Kafka failure", "detail": str(e)})

@app.post("/api/add-to-cart")
async def add_to_cart(body: AddToCartBody):
    logger.info(f"API Request: add-to-cart | Item: {body.itemId}")
    try:
        payload = add_to_cart_payload(body.event, body.restaurantId, body.itemId, body.quantity, body.userId or "anonymous-user")
        await send_event("user-events", payload)
        return {"message": "Add-to-cart event processed"}
    except Exception as e:
        logger.error(f"Error in add-to-cart: {e}")
        return JSONResponse(status_code=500, content={"error": "Kafka failure", "detail": str(e)})

@app.post("/api/user-search")
async def user_search(body: UserSearchBody):
    logger.info(f"API Request: user-search | Query: {body.query}")
    try:
        payload = user_search_payload(body.event, body.query, body.userId or "anonymous-user", body.restaurantId, body.itemId)
        await send_event("user-events", payload)
        return {"message": "User-search event processed"}
    except Exception as e:
        logger.error(f"Error in user-search: {e}")
        return JSONResponse(status_code=500, content={"error": "Kafka failure", "detail": str(e)})

@app.post("/api/order-placed")
async def order_placed(body: OrderPlacedBody):
    logger.info(f"API Request: order-placed | Order: {body.orderId}")
    try:
        payload = order_placed_payload(body.event, body.orderId, body.restaurantId, body.userId or "anonymous-user", body.totalAmount, body.itemCount)
        await send_event("user-events", payload)
        return {"message": "Order-placed event processed"}
    except Exception as e:
        logger.error(f"Error in order-placed: {e}")
        return JSONResponse(status_code=500, content={"error": "Kafka failure", "detail": str(e)})

@app.get("/search")
async def search(q: str = Query(..., min_length=1)):
    logger.info(f"Search Query: {q}")
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
            return {"count": 0, "data": [], "message": "Index not found."}
        response = es.search(index="bitego_index", body=search_body)
        results = []
        for hit in response["hits"]["hits"]:
            source = {**hit["_source"], "score": hit["_score"]}
            if source.get("type") == "MENU_ITEM":
                source["imageUrl"] = normalize_image_url(source.get("imageUrl"))
            results.append(source)
        return {"count": len(results), "data": results}
    except Exception as e:
        logger.error(f"ES Search Error: {e}")
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
