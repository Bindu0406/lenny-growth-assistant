# Lenny Growth Assistant 🚀

An enterprise-grade AI growth assistant and PM co-pilot grounded strictly in transcripts from **Lenny's Podcast**. Built with a FastAPI RAG streaming backend and a Next.js (App Router) frontend featuring interactive canvas/HTML widgets, structured checklists, and framework comparison artifacts.

---

## 🌟 Key Features

- **Grounded Vector Search (RAG)**: Uses vector embeddings to retrieve context directly from growth episodes (Elena Verna, Casey Winters, etc.) with explicit citations and similarity confidence scores.
- **Server-Sent Events (SSE) Streaming**: Real-time token delivery powered by FastAPI.
- **Interactive Dual-Panel Artifact Viewer**:
  - **Dynamic HTML/Canvas Widgets**: Sandboxed client-side widgets (e.g., Elena Verna Retention Curve Calculator with real-time decay curves, threshold plateaus, and status badges).
  - **Structured Frameworks & Checklists**: Automatic routing of markdown tables, checklists, and PM playbooks into isolated side drawers.
- **Strict React 19 / Turbopack Compliance**: Fully optimized zero-error build using Next.js compiler standards and Tailwind CSS.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, React-Markdown.
- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLite, ChromaDB / Sentence-Transformers.
- **LLM Engine**: Streaming OpenAI / Ollama compatible client with system-prompted artifact encapsulation.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Git

### 2. Backend Setup
```bash
# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the backend API server
uvicorn backend.app.main:app --reload --port 8000