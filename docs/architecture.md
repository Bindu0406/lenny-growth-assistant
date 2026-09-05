# System Architecture Specification
## The Lenny Growth Assistant

---

## 1. High-Level System Topology
---

## 2. Core Components & Boundaries

### 2.1 Frontend (`frontend/`)
* **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS.
* **Chat Stream Handler:** Consumes Server-Sent Events (SSE) from `/api/chat` to stream assistant tokens in real time.
* **Artifact Sandbox:** Renders LLM-generated HTML/CSS snippets inside an isolated `<iframe>` with `sandbox="allow-scripts"` (strictly excluding `allow-same-origin` to block parent DOM/cookie access).

### 2.2 Backend API (`backend/app/`)
* **Framework:** FastAPI with asynchronous request handling via Uvicorn.
* **Session Manager:** Manages session lifecycle and message history in PostgreSQL.
* **LLM Provider Factory:** Dynamically routes requests to `OllamaProvider` (local) or `CloudProvider` (Claude/OpenAI) using request-time parameters or configuration headers.
* **Grounding Engine:** Computes cosine similarity of queries against transcript chunks, discarding chunks below a threshold score ($0.65$) to eliminate hallucinations.

---

## 3. Database Schema (`PostgreSQL + pgvector`)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Chat Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation History
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lenny Podcast Transcripts Chunks
CREATE TABLE transcript_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_title VARCHAR(255) NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    chunk_text TEXT NOT NULL,
    timestamp_ref VARCHAR(50),
    embedding VECTOR(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fast Approximate Nearest Neighbor Search Index
CREATE INDEX ON transcript_chunks USING hnsw (embedding vector_cosine_ops);

-- Generated Artifacts
CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    artifact_type VARCHAR(20) NOT NULL CHECK (artifact_type IN ('markdown', 'html')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
---

## 4. RAG Retrieval & Ingestion Pipeline

```text
Raw Episode (.txt / .md)
       │
       ▼
Recursive Character Splitter (500–800 tokens, 100 token overlap)
       │
       ▼
Local Embedding Model (nomic-embed-text via Ollama or all-MiniLM-L6-v2)
       │
       ▼
Batch Insert into `transcript_chunks` with metadata 