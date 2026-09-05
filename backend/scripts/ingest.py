import asyncio
import os
import re
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from sqlalchemy import text
from app.database import AsyncSessionLocal
from app.models.db_models import TranscriptChunkModel
from app.rag.embeddings import get_embedding

TRANSCRIPTS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "transcripts"

def parse_header_metadata(content: str):
    title_match = re.search(r"^Title:\s*(.+)$", content, re.MULTILINE)
    guest_match = re.search(r"^Guest:\s*(.+)$", content, re.MULTILINE)
    
    title = title_match.group(1).strip() if title_match else "Lenny's Podcast"
    guest = guest_match.group(1).strip() if guest_match else "Guest Expert"
    return title, guest

def chunk_text(content: str, max_chars: int = 600, overlap: int = 100):
    lines = [line.strip() for line in content.split("\n") if line.strip() and not line.startswith("Title:") and not line.startswith("Guest:") and not line.startswith("Date:")]
    full_body = "\n".join(lines)
    
    chunks = []
    start = 0
    while start < len(full_body):
        end = min(start + max_chars, len(full_body))
        chunk_slice = full_body[start:end]
        
        # Extract timestamp if present in the chunk
        ts_match = re.search(r"\[(\d{2}:\d{2}:\d{2})\]", chunk_slice)
        timestamp = ts_match.group(1) if ts_match else "00:00:00"
        
        chunks.append({
            "text": chunk_slice.strip(),
            "timestamp": timestamp
        })
        if end == len(full_body):
            break
        start += (max_chars - overlap)
    return chunks

async def run_ingestion():
    print(f"Reading transcripts from: {TRANSCRIPTS_DIR}")
    if not TRANSCRIPTS_DIR.exists():
        print("Transcript directory not found!")
        return

    files = list(TRANSCRIPTS_DIR.glob("*.txt"))
    print(f"Found {len(files)} transcript files.")

    async with AsyncSessionLocal() as session:
        # Clear existing chunks for clean idempotency
        await session.execute(text("TRUNCATE TABLE transcript_chunks RESTART IDENTITY;"))
        await session.commit()

        total_chunks = 0
        for file_path in files:
            print(f"\nProcessing: {file_path.name}")
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            title, guest = parse_header_metadata(content)
            chunks = chunk_text(content)
            print(f"Generated {len(chunks)} chunks for {guest}...")

            for i, ch in enumerate(chunks):
                vector = await get_embedding(ch["text"])
                db_chunk = TranscriptChunkModel(
                    episode_title=title,
                    guest_name=guest,
                    chunk_text=ch["text"],
                    timestamp_ref=ch["timestamp"],
                    embedding=vector
                )
                session.add(db_chunk)
                total_chunks += 1
                print(f"  -> Embedded chunk {i+1}/{len(chunks)}")

            await session.commit()

        # Build HNSW vector index for high-speed similarity search
        print("\nCreating HNSW vector cosine index...")
        await session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_transcript_chunks_hnsw 
            ON transcript_chunks USING hnsw (embedding vector_cosine_ops);
        """))
        await session.commit()

    print(f"\nIngestion complete! Successfully indexed {total_chunks} transcript chunks.")

if __name__ == "__main__":
    asyncio.run(run_ingestion())