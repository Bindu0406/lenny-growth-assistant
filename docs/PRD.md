# Product Requirements Document (PRD)
## The Lenny Growth Assistant

### 1. Executive Summary & Problem Framing
* **Primary Persona:** Growth Product Managers (PMs), Heads of Growth, and Early-Stage Founders.
* **Context:** Lenny's Podcast contains 200+ hours of operational growth frameworks, but the knowledge is trapped in long audio files and raw transcripts.
* **Pain Point:** Growth leaders need fast, factual answers to urgent product challenges without reading hundreds of transcripts or getting hallucinated answers from generic AI models.

### 2. Core Solution & Value Proposition
* **Source-Grounded QA:** Retrieves answers strictly from Lenny's Podcast transcripts with episode, guest, and timestamp attribution.
* **Refusal on Low Confidence:** Clearly states when transcripts lack sufficient information instead of guessing.
* **Ship 30 for 30 Content Engine:** Formats insights into a ~1,250-word actionable essay with hooks, short paragraphs, and bold anchors.
* **Side-by-Side Artifact Viewer:** Renders markdown frameworks and sandboxed HTML/CSS prototypes next to the chat.
* **Dual Model Switch:** Toggles seamlessly between local Ollama (qwen3:4b) and cloud models (Claude/OpenAI).

### 3. Key Metrics & Acceptance Criteria
* **Citation Accuracy:** >= 90% of claims backed by verifiable transcript chunks.
* **Safety & Isolation:** 0 XSS vulnerabilities via sandboxed iframe execution (`sandbox="allow-scripts"` without `allow-same-origin`).
* **Deployability:** Single-command boot using `docker compose up`.
* **Graceful Failure:** Clear UI warnings if Ollama or PostgreSQL is offline.
