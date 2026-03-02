# FastAPI/Flask entry pointfrom fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi import FastAPI
app = FastAPI()

# In a real app, this would be a pre-trained model or a query to Redis/NeonDB
MOCK_SUPPLEMENT_DATA = {
    "burger_id": [{"id": "fries_1", "name": "Peri Peri Fries"}, {"id": "coke_1", "name": "Chilled Cola"}],
    "pizza_id": [{"id": "bread_1", "name": "Garlic Breadstick"}, {"id": "dip_1", "name": "Cheesy Dip"}]
}

@app.get("/")
def root():
    return {"message": "AI ML Service Running"}

@app.get("/recommendations/supplements")
async def get_supplements(item_ids: str):
    ids = item_ids.split(",")
    recommendations = []
    for item_id in ids:
        if item_id in MOCK_SUPPLEMENT_DATA:
            recommendations.extend(MOCK_SUPPLEMENT_DATA[item_id])
    return recommendations