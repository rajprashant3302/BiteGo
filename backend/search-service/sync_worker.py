import asyncio
import os
import numpy as np
from prisma import Prisma
from elasticsearch import Elasticsearch, helpers
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from pathlib import Path
from collections import defaultdict

# Load ENV
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

ES_URL = os.getenv("ES_HOST", "http://bitego_es:9200")

# Initialize Model (Global)
model = SentenceTransformer('all-MiniLM-L6-v2')
es = Elasticsearch(
    ES_URL,
    headers={"Accept": "application/vnd.elasticsearch+json; compatible-with=8"}
)

def create_index():
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "type": {"type": "keyword"},
                "name": {"type": "text"},
                "description": {"type": "text"},
                "category": {"type": "keyword"},
                "isVeg": {"type": "boolean"},
                # We use 'item_vector' as the universal field name for k-NN
                "item_vector": {
                    "type": "dense_vector",
                    "dims": 384,
                    "index": True,
                    "similarity": "cosine"
                }
            }
        }
    }
    
    if es.indices.exists(index="bitego_index"):
        es.indices.delete(index="bitego_index")
        print("🗑️ Deleted old index for fresh start.")
        
    es.indices.create(index="bitego_index", body=mapping)
    print("✅ Index created with Vector Mapping")

db = Prisma()

async def sync_data():
    try:
        await db.connect()
        print("🔗 Connected to DB...")

        # 1. Fetch Data
        restaurants = await db.restaurant.find_many()
        menu_items = await db.menuitem.find_many(include={"restaurant": True})

        actions = []
        # We'll use this to group vectors by restaurant for the "Linear Manipulation"
        restaurant_vectors_accumulator = defaultdict(list)

        # 2. Process Menu Items first (to collect vectors for centroids)
        print(f"🧠 Processing {len(menu_items)} items...")
        
        fusion_strings = []
        valid_items = []

        for item in menu_items:
            try:
                name = item.ItemName or "Unknown Item"
                desc = item.Description or ""
                res_name = item.restaurant.Name if item.restaurant else "Unknown"
                category = item.restaurant.CategoryName if item.restaurant else "Food"
                veg_status = "Vegetarian" if item.IsVeg else "Non-Vegetarian"

                text = f"{name} {desc} {category} {veg_status} {res_name}".strip()
                fusion_strings.append(text)
                valid_items.append(item)
            except Exception as e:
                print(f"⚠️ Skipping item {item.ItemID}: {e}")

        # Batch encode item vectors
        all_vectors = model.encode(fusion_strings, batch_size=128)

        # 3. Map Items to Actions & Accumulate for Restaurants
        for i, item in enumerate(valid_items):
            vector = all_vectors[i].tolist()
            
            # Store for individual menu item
            actions.append({
                "_index": "bitego_index",
                "_id": f"item_{item.ItemID}",
                "_source": {
                    "id": item.ItemID,
                    "type": "MENU_ITEM",
                    "name": item.ItemName,
                    "description": item.Description,
                    "category": getattr(item.restaurant, 'CategoryName', 'Food') if item.restaurant else 'Food',
                    "imageUrl": item.ItemImageURL,
                    "item_vector": vector
                }
            })

            # Add to accumulator for the Restaurant Centroid
            if item.RestaurantID:
                restaurant_vectors_accumulator[item.RestaurantID].append(all_vectors[i])

        # 4. Calculate Restaurant Centroids (Linear Manipulation)
        print(f"🏛️ Calculating centroids for {len(restaurants)} restaurants...")
        
        for res in restaurants:
            vectors = restaurant_vectors_accumulator.get(res.RestaurantID)
            
            # Default vector if restaurant has no items (rare but possible)
            if vectors:
                # The math: Mean of all menu items = The Restaurant's "Vibe"
                centroid_vector = np.mean(vectors, axis=0).tolist()
            else:
                # Fallback to encoding the restaurant name/category if no items exist
                centroid_vector = model.encode(f"{res.Name} {res.CategoryName}").tolist()

            actions.append({
                "_index": "bitego_index",
                "_id": f"restaurant_{res.RestaurantID}",
                "_source": {
                    "id": res.RestaurantID,
                    "type": "RESTAURANT",
                    "name": res.Name,
                    "category": res.CategoryName,
                    "item_vector": centroid_vector # Same field name for easier search
                }
            })

        # 5. Bulk Index everything
        if actions:
            helpers.bulk(es, actions)
            print(f"🚀 Synced {len(actions)} documents (Items + Centroid Vectors)!")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await db.disconnect()

async def main():
    create_index() 
    await sync_data()

if __name__ == "__main__":
    asyncio.run(main())
