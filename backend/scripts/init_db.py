import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from sqlalchemy import text
from app.database import engine, Base
from app.models.db_models import SessionModel, MessageModel, TranscriptChunkModel, ArtifactModel

async def init_database():
    print("Connecting to PostgreSQL...")
    async with engine.begin() as conn:
        print("Enabling pgvector extension...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        print("Creating all tables (sessions, messages, transcript_chunks, artifacts)...")
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_database())