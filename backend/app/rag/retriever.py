from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.rag.embeddings import get_embedding
from app.config import get_settings

settings = get_settings()

class TranscriptRetriever:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def retrieve_relevant_chunks(
        self,
        query: str,
        top_k: int = 5,
        similarity_threshold: float = 0.65
    ) -> List[Dict[str, Any]]:
        # 1. Generate query embedding vector using Ollama
        query_vector = await get_embedding(query)

        # 2. Query pgvector using cosine similarity with CAST syntax
        stmt = text("""
            SELECT 
                episode_title,
                guest_name,
                chunk_text,
                timestamp_ref,
                1 - (embedding <=> CAST(:vector AS vector)) AS similarity_score
            FROM transcript_chunks
            WHERE 1 - (embedding <=> CAST(:vector AS vector)) >= :threshold
            ORDER BY similarity_score DESC
            LIMIT :limit;
        """)

        result = await self.session.execute(
            stmt,
            {
                "vector": str(query_vector),
                "threshold": similarity_threshold,
                "limit": top_k
            }
        )

        rows = result.fetchall()
        return [
            {
                "episode": r.episode_title,
                "guest": r.guest_name,
                "text": r.chunk_text,
                "timestamp": r.timestamp_ref,
                "score": round(float(r.similarity_score), 4)
            }
            for r in rows
        ]