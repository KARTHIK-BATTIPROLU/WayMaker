from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

async def connect_to_mongo():
    db_instance.client = AsyncIOMotorClient(settings.mongo_uri)
    db_instance.db = db_instance.client.waymaker
    # Create indexes
    await db_instance.db.users.create_index("email", unique=True)
    await db_instance.db.projects.create_index([("user_id", 1), ("createdAt", -1)])
    await db_instance.db.chat_messages.create_index([("project_id", 1), ("timestamp", 1)])
    logger.info("Connected to MongoDB")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()

def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db
