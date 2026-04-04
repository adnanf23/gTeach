"use client";

import { useEffect, useRef } from "react";

const LineChart = ({ data, color = "#3b82f6" }) => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = canvas.offsetWidth || 300;
    const H = 80;
    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const pad = { t: 8, r: 8, b: 8, l: 8 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;
    const max = Math.max(...data);
    const min = Math.min(...data) - 5;
    const px = (i) => pad.l + (i / (data.length - 1)) * cw;
    const py = (v) => pad.t + ch - ((v - min) / (max - min)) * ch;
    ctx.beginPath();
    data.forEach((v, i) => i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.bezierCurveTo(px(i - 0.5), py(data[i - 1]), px(i - 0.5), py(v), px(i), py(v)));
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, color + "30");
    gr.addColorStop(1, color + "00");
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.lineTo(px(data.length - 1), H); ctx.lineTo(px(0), H); ctx.closePath();
    ctx.fillStyle = gr; ctx.fill();
    data.forEach((v, i) => {
      ctx.beginPath(); ctx.arc(px(i), py(v), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }, [data, color]);
  return <canvas ref={ref} className="w-full" />;
};

export default LineChart;