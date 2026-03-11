import asyncio
import os
from prisma import Prisma
from elasticsearch import Elasticsearch, helpers
from dotenv import load_dotenv
from pathlib import Path

# Load ENV
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Force the hostname to the service name defined in docker-compose
ES_URL = os.getenv("ES_HOST", "http://elasticsearch:9200")

# Initialize ES with explicit headers to fix the "compatible-with=9" error
es = Elasticsearch(
    ES_URL,
    headers={
        "Accept": "application/vnd.elasticsearch+json; compatible-with=8",
        "Content-Type": "application/json"
    },
    retry_on_timeout=True,
    max_retries=5
)

db = Prisma()

async def sync_data():
    try:
        await db.connect()
        print("🔗 Connected to Neon...")

        # Fetch Restaurants and MenuItems
        restaurants = await db.restaurant.find_many()
        menu_items = await db.menuitem.find_many(include={"restaurant": True})

        actions = []

        # Process Restaurants
        for res in restaurants:
            actions.append({
                "_index": "bitego_index",
                "_id": f"res_{res.RestaurantID}",
                "_source": {
                    "id": res.RestaurantID,
                    "type": "RESTAURANT",
                    "name": res.Name,
                    "category": res.CategoryName,
                    "rating": float(res.Rating) if res.Rating else 0.0,
                    "location": {"lat": float(res.Latitude), "lon": float(res.Longitude)} if res.Latitude else None
                }
            })

        # Process Menu Items
        for item in menu_items:
            actions.append({
                "_index": "bitego_index",
                "_id": f"item_{item.ItemID}",
                "_source": {
                    "id": item.ItemID,
                    "type": "MENU_ITEM",
                    "name": item.ItemName,
                    "description": item.Description,
                    "price": float(item.Price) if item.Price else 0.0,
                    "isVeg": item.IsVeg,
                    "restaurant_name": item.restaurant.Name if item.restaurant else "Unknown"
                }
            })

        if actions:
            print(f"📦 Preparing to bulk index {len(actions)} documents...")
            helpers.bulk(es, actions)
            print(f"🚀 Synced {len(actions)} items successfully!")
        else:
            print("p📭 No data found to sync.")

    except Exception as e:
        print(f"❌ Error during sync: {e}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(sync_data())