import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.database import AsyncSessionLocal
from app.agent import LennyAgent

async def main():
    async with AsyncSessionLocal() as session:
        agent = LennyAgent(session)
        stream, sources = await agent.run("What does Elena Verna say about retention curves?")
        print(f"Sources retrieved: {len(sources)}")
        print("\nAgent Response:")
        async for token in stream:
            print(token, end="", flush=True)
        print("\n")

if __name__ == "__main__":
    asyncio.run(main())