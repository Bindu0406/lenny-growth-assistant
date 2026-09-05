import httpx
from typing import List
from app.config import get_settings

settings = get_settings()

async def get_embedding(text: str) -> List[float]:
    """Generate 768-dim vector embedding using Ollama nomic-embed-text."""
    clean_text = text.replace("\n", " ").strip()
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.ollama_base_url}/api/embeddings",
            json={
                "model": "nomic-embed-text",
                "prompt": clean_text
            }
        )
        if response.status_code != 200:
            raise RuntimeError(f"Embedding failure ({response.status_code}): {response.text}")
        data = response.json()
        return data.get("embedding", [])