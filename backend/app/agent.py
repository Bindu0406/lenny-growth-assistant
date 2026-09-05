import re
from typing import List, Dict, Any, AsyncGenerator, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.rag.retriever import TranscriptRetriever
from app.providers.ollama_provider import OllamaProvider
from app.config import get_settings

settings = get_settings()

SYSTEM_PROMPT = """You are "The Lenny Growth Assistant", an elite product management and growth advisor grounded strictly in Lenny's Podcast transcripts.

Operational Rules:
1. Grounding: Answer ONLY using the transcript excerpts provided in the Context block.
2. Direct Citations: Whenever you cite a fact, tactic, framework, or perspective, cite the exact guest and episode in this format: [Guest: Name, Episode: Title].
3. Refusal: If the provided context does not contain enough information to answer the question, state:
"I couldn't find sufficient information in Lenny's podcast transcripts to answer this reliably." Do not fabricate or speculate.
4. Artifacts:
- When asked for checklists, frameworks, or essays, wrap the response in:
<artifact type="markdown" title="Descriptive Title">
... content ...
</artifact>
- When asked for calculators, widgets, forms, or interactive tools, wrap a self-contained HTML/CSS/JavaScript block inside:
<artifact type="html" title="Widget Title">
<!DOCTYPE html>
<html>
<head><style>body { font-family: sans-serif; padding: 20px; background: #0f172a; color: white; }</style></head>
<body>...interactive elements...<script>...logic...</script></body>
</html>
</artifact>
"""

class LennyAgent:
    def __init__(self, session: AsyncSession, provider=None):
        self.retriever = TranscriptRetriever(session)
        self.provider = provider or OllamaProvider()

    def _extract_semantic_query(self, query: str) -> str:
        # Strip artifact/code/format instructions so vector similarity matches the actual transcript content
        cleaned = re.sub(
            r"(?i)\b(build|create|generate|interactive|html|js|javascript|widget|calculator|artifact|block|code)\b",
            "",
            query
        )
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned if len(cleaned) > 5 else query

    async def run(
        self,
        query: str,
        conversation_history: List[Dict[str, str]] = None
    ) -> Tuple[AsyncGenerator[str, None], List[Dict[str, Any]]]:
        # Clean query for dense semantic matching
        retrieval_query = self._extract_semantic_query(query)

        # Retrieve top chunks with 0.45 tolerance
        chunks = await self.retriever.retrieve_relevant_chunks(
            query=retrieval_query,
            top_k=settings.top_k_chunks,
            similarity_threshold=0.45
        )

        if not chunks:
            async def refusal_stream():
                yield "I couldn't find sufficient information in Lenny's podcast transcripts to answer this reliably."
            return refusal_stream(), []

        context_str = "\n\n---\n\n".join([
            f"Source [{c['guest']} - {c['episode']} (Timestamp: {c['timestamp']})]:\n{c['text']}"
            for c in chunks
        ])

        prompt_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if conversation_history:
            prompt_messages.extend(conversation_history[-4:])

        prompt_messages.append({
            "role": "user",
            "content": f"Context:\n{context_str}\n\nUser Request: {query}"
        })

        stream = self.provider.generate_stream(prompt_messages)
        return stream, chunks