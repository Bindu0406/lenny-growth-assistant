"use client";

import React, { useState } from "react";
import { Copy, Download, Check, X, Code2, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ArtifactViewerProps {
  artifact: {
    type: string;
    title: string;
    content: string;
  };
  onClose: () => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ artifact, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = artifact.type === "html" ? "html" : "md";
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title.toLowerCase().replace(/\s+/g, "_")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded uppercase tracking-wider">
            {artifact.type}
          </span>
          <h2 className="text-sm font-semibold text-slate-200 truncate max-w-xs">
            {artifact.title}
          </h2>
        </div>

        <div className="flex items-center space-x-1.5">
          {artifact.type === "html" && (
            <div className="flex bg-slate-800 rounded-lg p-0.5 mr-2">
              <button
                onClick={() => setViewMode("preview")}
                className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                  viewMode === "preview" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Preview"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                  viewMode === "code" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="View Code"
              >
                <Code2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="Download Artifact"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition ml-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-950 p-3">
        {artifact.type === "html" && viewMode === "preview" ? (
          <iframe
            srcDoc={artifact.content}
            title={artifact.title}
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="w-full h-full rounded-xl border border-slate-800 bg-white"
          />
        ) : (
          <div className="w-full h-full overflow-auto rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-slate-200">
            {artifact.type === "html" ? (
              <pre className="whitespace-pre-wrap">{artifact.content}</pre>
            ) : (
              <ReactMarkdown className="prose prose-invert max-w-none text-sm">
                {artifact.content}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>
    </div>
  );
};