# UI/UX Design Specification
## The Lenny Growth Assistant

---

## 1. Design Philosophy & Principles

* **Information-Dense & Clean:** Optimized for Product Managers who want rapid scanning without unnecessary decorative bloat.
* **Dual-Pane Canvas:** A persistent chat experience paired with a live, collapsible workspace for rendered content and prototypes.
* **Radical Transparency:** Every generated assertion exposes immediate traceability (guest attribution, episode title, confidence badge).
* **Safe Sandbox:** Visual feedback indicating that interactive HTML prototypes are running inside a secure, isolated container.

---

## 2. Layout & Workspace Hierarchy

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🚀 Lenny Growth Assistant      [Status: 🟢 DB | 🟢 Ollama]  [Model: Ollama ▼] │
├───────────────────────────────┬────────────────────────────────────────┤
│                               │                                        │
│          CHAT PANE            │            ARTIFACT PANE               │
│           (50%)               │               (50%)                    │
│                               │                                        │
│ [User]                        │  ┌──────────────────────────────────┐  │
│ How do top PMs set retention  │  │ Artifact: Retention Loop Canvas  │  │
│ targets?                      │  │ [Sandboxed Preview]  [Code] [X]  │  │
│                               │  ├──────────────────────────────────┤  │
│ [Lenny Assistant]             │  │                                  │  │
│ Casey Winters emphasizes that │  │   ┌──────────────────────────┐   │  │
│ retention must be evaluated   │  │   │  Core Product Loop       │   │  │
│ as loops rather than funnels. │  │   │  - Trigger               │   │  │
│                               │  │   │  - Action                │   │  │
│ ┌──────────────────────────┐  │  │   │  - Reward                │   │  │
│ │ 🎙️ Casey Winters        │  │  │   │  - Investment            │   │  │
│ │ Episode #42 (94% match)  │  │  │   └──────────────────────────┘   │  │
│ └──────────────────────────┘  │  │                                  │  │
│                               │  │                                  │  │
│ [✨ Generate Ship 30 Essay]   │  │                                  │  │
│                               │  └──────────────────────────────────┘  │
├───────────────────────────────┴────────────────────────────────────────┤
│ [Ask anything about growth, retention, or PLG...]             [Send ➔] │
└────────────────────────────────────────────────────────────────────────┘