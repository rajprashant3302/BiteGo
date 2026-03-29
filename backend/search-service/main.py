import os
import asyncio
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from dotenv import load_dotenv
from pathlib import Path

# Load ENV
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

app = FastAPI(title="BiteGo Search Service")

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Elasticsearch with the specific headers for version 8.x
ES_HOST = os.getenv("ES_HOST", "http://bitego_es:9200")
es = Elasticsearch(
    [ES_HOST],
    headers={
        "Accept": "application/vnd.elasticsearch+json; compatible-with=8",
        "Content-Type": "application/json"
    },
    retry_on_timeout=True,
    max_retries=5
)

@app.get("/search")
async def search(q: str = Query(..., min_length=1)):
    """
    Omnisearch with Fuzzy Logic across Restaurants and Menu Items
    """
    search_body = {
        "query": {
            "multi_match": {
                "query": q,
                "fields": ["name^3", "category^2", "description", "restaurant_name"],
                "fuzziness": "AUTO"
            }
        }
    }

    try:
        # Verify index existence
        if not es.indices.exists(index="bitego_index"):
            return {"count": 0, "data": [], "message": "Search index not initialized yet."}

        response = es.search(index="bitego_index", body=search_body)
        
        results = []
        for hit in response['hits']['hits']:
            data = hit['_source']
            data['score'] = hit['_score'] 
            results.append(data)
            
        return {"count": len(results), "data": results}
    
    except Exception as e:
        return {"error": str(e), "data": []}

@app.get("/health")
async def health():
    return {"status": "ok", "elasticsearch": "connected" if es.ping() else "disconnected"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)