# src/utils/db.py
from prisma import Prisma
import os

# This uses the DATABASE_URL from your .env automatically
db = Prisma()

async def init_db():
    if not db.is_connected():
        await db.connect()
        print("🚀 [DB] Connected to Neon PostgreSQL")

async def close_db():
    if db.is_connected():
        await db.disconnect()