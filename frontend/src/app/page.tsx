"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Bot, User, Sparkles, BookOpen, Layers, Loader2 } from "lucide-react";
import { ArtifactViewer } from "@/components/ArtifactViewer";

interface Source {
  guest: string;
  episode: string;
  timestamp: string;
  text: string;
  score: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<{
    type: string;
    title: string;
    content: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const parseArtifact = (text: string) => {
    const startTag = text.match(/<artifact\s+type="([^"]+)"\s+title="([^"]+)">/i);
    if (startTag) {
      const type = startTag[1];
      const title = startTag[2];
      const startIndex = (startTag.index || 0) + startTag[0].length;
      const endIndex = text.indexOf("</artifact>");
      const rawContent = endIndex !== -1 ? text.substring(startIndex, endIndex) : text.substring(startIndex);
      return { type, title, content: rawContent.trim() };
    }

    const htmlFence = text.match(/```html\s*([\s\S]*?)```/i) || text.match(/```html\s*([\s\S]*)/i);
    if (htmlFence && htmlFence[1].trim().length > 30) {
      return {
        type: "html",
        title: "Interactive Widget Preview",
        content: htmlFence[1].trim().replace(/```$/, ""),
      };
    }

    return null;
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMessageId = "user-" + (messages.length + 1);
    const assistantMessageId = "assistant-" + (messages.length + 2);
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: textToSend },
      { id: assistantMessageId, role: "assistant", content: "", sources: [] },
    ]);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedText = "";
        let accumulatedSources: Source[] = [];

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.replace("data: ", "").trim();
              if (!jsonStr) continue;

              const data = JSON.parse(jsonStr);
              if (data.type === "init") {
                accumulatedSources = data.sources;
              } else if (data.type === "token") {
                accumulatedText += data.content;

                const artifact = parseArtifact(accumulatedText);
                if (artifact) {
                  setActiveArtifact(artifact);
                }

                const currentContent = accumulatedText;
                const currentSources = accumulatedSources;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: currentContent, sources: currentSources }
                      : msg
                  )
                );
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cleanMessageContent = (content: string) => {
    if (content.includes("<artifact")) {
      const before = content.split(/<artifact/i)[0].trim();
      return before || "*(Rendering artifact in side panel...)*";
    }
    if (content.includes("```html")) {
      const before = content.split(/```html/i)[0].trim();
      return before || "*(Rendering HTML widget in preview pane...)*";
    }
    return content;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      <div className={`flex flex-col flex-1 h-full border-r border-slate-800 transition-all duration-300 ${activeArtifact ? "w-1/2" : "w-full"}`}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">Lenny Growth Assistant</h1>
              <p className="text-xs text-slate-400">Enterprise RAG & PM Co-Pilot</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto">
              <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
                <BookOpen className="w-10 h-10 text-indigo-400"/>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Grounding PM Growth Wisdom</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Ask questions grounded in Lenny&apos;s Podcast transcripts or click a quick playbook below.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {[
                  {
                    title: "Retention Curve Widget",
                    prompt: "Build an interactive HTML/JS retention curve calculator widget inside an artifact block based on Elena Verna's benchmarks.",
                  },
                  {
                    title: "B2B Onboarding Checklist",
                    prompt: "Create an onboarding checklist for product-led growth using Casey Winters and Elena Verna's principles. Put it in an artifact block.",
                  },
                  {
                    title: "PLG vs Sales-Led Matrix",
                    prompt: "Compare Product-Led Growth vs Sales-Led Growth using a Markdown table artifact citing Elena Verna.",
                  },
                  {
                    title: "Growth Loop Diagnostic",
                    prompt: "Explain Casey Winters' framework on acquisition vs retention loops with actionable steps.",
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition text-left space-y-1 group"
                  >
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-2">
                      {item.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4"/>
                  </div>
                )}
                <div className="flex flex-col max-w-[80%] space-y-2">
                  <div className={`p-4 rounded-2xl ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-900 border border-slate-800 text-slate-200"}`}>
                    {m.role === "assistant" && !m.content ? (
                      <div className="flex items-center space-x-2 text-slate-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400"/>
                        <span>Generating response...</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert text-sm">
                        <ReactMarkdown>{cleanMessageContent(m.content)}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {m.sources && m.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.sources.map((s, idx) => (
                        <div key={idx} className="flex items-center space-x-1 text-xs bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400">
                          <Layers className="w-3 h-3 text-indigo-400"/>
                          <span>{s.guest}</span>
                          <span className="text-slate-600">•</span>
                          <span>Score: {Math.round(s.score * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                    <User className="w-4 h-4"/>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2 max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-indigo-500 transition">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about retention loops, PLG vs PLS..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            </button>
          </div>
        </div>
      </div>

     {activeArtifact && (
        <div className="w-1/2 h-full">
          <ArtifactViewer
            content={activeArtifact.content}
            title={activeArtifact.title}
            onClose={() => setActiveArtifact(null)}
          />
        </div>
      )}
    </div>
  );
}