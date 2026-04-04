"use client";

import { useEffect, useRef } from "react";

const BarChart = ({ data }) => {
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
    const max = Math.max(...data.map(d => d.v));
    const gap = 6;
    const bw = (W - gap * (data.length + 1)) / data.length;
    data.forEach(({ v, c }, i) => {
      const bh = (v / max) * (H - 16);
      const x = gap + i * (bw + gap);
      const y = H - bh - 8;
      const r = 4;
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + bw - r, y);
      ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
      ctx.lineTo(x + bw, y + bh); ctx.lineTo(x, y + bh);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath(); ctx.fillStyle = c; ctx.fill();
    });
  }, [data]);
  return <canvas ref={ref} className="w-full" />;
};

export default BarChart;