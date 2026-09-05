import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.database import AsyncSessionLocal
from app.rag.retriever import TranscriptRetriever

async def main():
    async with AsyncSessionLocal() as session:
        retriever = TranscriptRetriever(session)
        query = "How does Elena Verna describe retention curves?"
        results = await retriever.retrieve_relevant_chunks(query)
        
        print(f"Found: {len(results)} chunks")
        if results:
            print(f"Top Guest: {results[0]['guest']}")
            print(f"Match Score: {results[0]['score']}")
            print(f"Sample Text: {results[0]['text'][:120]}...")

if __name__ == "__main__":
    asyncio.run(main())