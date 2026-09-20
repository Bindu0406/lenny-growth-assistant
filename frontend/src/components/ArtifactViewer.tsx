'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ArtifactViewerProps {
  content?: string;
  title?: string;
  onClose?: () => void;
}

const WIDGET_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { padding: 24px; margin: 0; background: #ffffff; color: #0f172a; }
    h2 { margin: 0 0 4px 0; font-size: 18px; color: #1e293b; }
    p.subtitle { margin: 0 0 20px 0; font-size: 13px; color: #64748b; }
    .controls { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .control-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 12px; font-weight: 600; color: #475569; display: flex; justify-content: space-between; }
    input[type=range] { width: 100%; accent-color: #6366f1; cursor: pointer; }
    .chart-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #ffffff; }
    canvas { width: 100%; height: 240px; display: block; }
    .stats { display: flex; gap: 12px; margin-top: 16px; }
    .badge { flex: 1; padding: 10px; border-radius: 6px; background: #f1f5f9; text-align: center; }
    .badge-label { font-size: 11px; color: #64748b; }
    .badge-val { font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 2px; }
  </style>
</head>
<body>
  <h2>Elena Verna Retention Calculator</h2>
  <p class="subtitle">Interactive Retention Curve Benchmark for B2B / PLG Products</p>

  <div class="controls">
    <div class="control-group">
      <label>Day 1 Retention: <span id="d1-txt">60%</span></label>
      <input id="d1" type="range" min="20" max="90" value="60" />
    </div>
    <div class="control-group">
      <label>Plateau / Flatline: <span id="plat-txt">28%</span></label>
      <input id="plat" type="range" min="5" max="60" value="28" />
    </div>
  </div>

  <div class="chart-box">
    <canvas id="cv" width="460" height="220"></canvas>
    <div class="stats">
      <div class="badge">
        <div class="badge-label">Day 7 Retention</div>
        <div class="badge-val" id="d7-val">42%</div>
      </div>
      <div class="badge">
        <div class="badge-label">Day 30 Retention</div>
        <div class="badge-val" id="d30-val">30%</div>
      </div>
      <div class="badge">
        <div class="badge-label">Benchmark Status</div>
        <div class="badge-val" id="status-val" style="color: #10b981;">Good PLG</div>
      </div>
    </div>
  </div>

  <script>
    const d1In = document.getElementById('d1');
    const platIn = document.getElementById('plat');
    const d1Txt = document.getElementById('d1-txt');
    const platTxt = document.getElementById('plat-txt');
    const d7Txt = document.getElementById('d7-val');
    const d30Txt = document.getElementById('d30-val');
    const statusTxt = document.getElementById('status-val');
    const cv = document.getElementById('cv');
    const ctx = cv.getContext('2d');

    function render() {
      const d1 = parseInt(d1In.value);
      const plat = Math.min(parseInt(platIn.value), d1 - 5);
      platIn.value = plat;

      d1Txt.innerText = d1 + '%';
      platTxt.innerText = plat + '%';

      const d7 = Math.round(plat + (d1 - plat) * Math.exp(-0.25 * 7));
      const d30 = Math.round(plat + (d1 - plat) * Math.exp(-0.25 * 30));
      d7Txt.innerText = d7 + '%';
      d30Txt.innerText = d30 + '%';

      if (plat >= 35) {
        statusTxt.innerText = 'Exceptional PLG';
        statusTxt.style.color = '#059669';
      } else if (plat >= 25) {
        statusTxt.innerText = 'Good PLG';
        statusTxt.style.color = '#10b981';
      } else {
        statusTxt.innerText = 'Needs Work';
        statusTxt.style.color = '#f59e0b';
      }

      ctx.clearRect(0, 0, cv.width, cv.height);

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let y = 30; y <= 200; y += 42) {
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(440, y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#6366f1';

      const totalDays = 30;
      for (let day = 0; day <= totalDays; day++) {
        const val = plat + (d1 - plat) * Math.exp(-0.25 * day);
        const x = 40 + (day / totalDays) * 390;
        const y = 200 - (val / 100) * 160;
        if (day === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      const platY = 200 - (plat / 100) * 160;
      ctx.moveTo(40, platY);
      ctx.lineTo(430, platY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    d1In.oninput = render;
    platIn.oninput = render;
    render();
  </script>
</body>
</html>`;

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  content,
  title = 'Retention Curve Calculator',
  onClose,
}) => {
  const safeContent =
    content && content.includes('<canvas') && content.includes('getContext')
      ? content
      : WIDGET_HTML;

  return (
    <div className="flex flex-col h-full w-full bg-white border-l border-slate-800 shadow-2xl">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {title}
          </span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
            Interactive
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <iframe
        title={title}
        srcDoc={safeContent}
        sandbox="allow-scripts allow-same-origin"
        className="w-full flex-1 border-none bg-white"
      />
    </div>
  );
};