"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const dots = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.3 + 0.06,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${d.opacity})`;
        ctx.fill();
      });
      dots.forEach((a, i) => {
        dots.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.06 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #eef4ff;
          color: #1e3a5f;
          overflow-x: hidden;
        }

        .gt-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 60px 24px 80px;
          background: linear-gradient(155deg, #eef4ff 0%, #f5f8ff 55%, #e8effd 100%);
        }

        canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .gt-glow {
          position: absolute;
          top: -12%;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 520px;
          background: radial-gradient(ellipse at center,
            rgba(59,130,246,0.12) 0%,
            rgba(99,162,255,0.04) 45%,
            transparent 70%);
          pointer-events: none;
          z-index: 1;
        }

        .gt-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px);
          background-size: 56px 56px;
          z-index: 0;
          pointer-events: none;
        }

        /* badge */
        .gt-badge {
          position: relative;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px 5px 8px;
          background: rgba(37,99,235,0.07);
          border: 1px solid rgba(37,99,235,0.18);
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 500;
          color: #2563eb;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 22px;
          animation: gtUp 0.65s ease both;
        }
        .gt-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #3b82f6;
          animation: gtPulse 2s ease-in-out infinite;
        }
        @keyframes gtPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.3; transform:scale(0.7); }
        }

        /* headline */
        .gt-content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 640px;
        }

        .gt-h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.9rem, 4vw, 3.4rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.04em;
          color: #0c1e3c;
          animation: gtUp 0.65s 0.08s ease both;
        }

        .gt-h1 .hl {
          background: linear-gradient(125deg, #1d4ed8 0%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gt-sub {
          margin: 14px auto 0;
          font-size: 0.875rem;
          font-weight: 300;
          line-height: 1.75;
          color: #4a6b98;
          max-width: 440px;
          animation: gtUp 0.65s 0.16s ease both;
        }

        /* CTA */
        .gt-cta {
          margin-top: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          animation: gtUp 0.65s 0.24s ease both;
        }

        .gt-btn-main {
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 11px 30px;
          background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: transform 0.2s, box-shadow 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 4px 16px rgba(29,78,216,0.28);
        }
        .gt-btn-main::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.15);
          transform: translateX(-100%) skewX(-12deg);
          transition: transform 0.36s ease;
        }
        .gt-btn-main:hover::after { transform: translateX(110%) skewX(-12deg); }
        .gt-btn-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(29,78,216,0.34);
        }

        .gt-btn-ghost {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          padding: 11px 18px;
          background: transparent;
          border: 1px solid rgba(29,78,216,0.2);
          color: #2563eb;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .gt-btn-ghost:hover {
          background: rgba(29,78,216,0.06);
          border-color: rgba(29,78,216,0.38);
        }
        .gt-btn-ghost svg { transition: transform 0.2s; }
        .gt-btn-ghost:hover svg { transform: translateX(3px); }

        /* stats */
        .gt-stats {
          position: relative;
          z-index: 10;
          margin-top: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          flex-wrap: wrap;
          animation: gtUp 0.65s 0.36s ease both;
        }

        .gt-stat { text-align: center; }
        .gt-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 1.65rem;
          font-weight: 700;
          letter-spacing: -0.05em;
          color: #0c1e3c;
          line-height: 1;
        }
        .gt-stat-num em {
          color: #2563eb;
          font-style: normal;
        }
        .gt-stat-label {
          margin-top: 4px;
          font-size: 0.67rem;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8aafd4;
        }
        .gt-stat-sep {
          width: 1px;
          height: 34px;
          background: rgba(29,78,216,0.1);
        }

        /* floating cards */
        .gt-card {
          position: absolute;
          z-index: 5;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(59,130,246,0.13);
          border-radius: 14px;
          padding: 14px 18px;
          pointer-events: none;
          min-width: 155px;
          box-shadow: 0 4px 20px rgba(29,78,216,0.07);
        }
        .gt-card-left {
          left: 4%;
          top: 35%;
          animation: gtUp 1s 0.55s ease both, gtFL 6s 1.55s ease-in-out infinite;
        }
        .gt-card-right {
          right: 4%;
          top: 40%;
          animation: gtUp 1s 0.72s ease both, gtFR 7s 1.72s ease-in-out infinite;
        }
        .gt-card-icon { font-size: 1.15rem; margin-bottom: 7px; }
        .gt-card-title {
          font-size: 0.73rem;
          font-weight: 600;
          color: #0c1e3c;
          margin-bottom: 2px;
        }
        .gt-card-meta { font-size: 0.68rem; color: #8aafd4; line-height: 1.4; }
        .gt-card-accent {
          margin-top: 7px;
          font-size: 0.73rem;
          font-weight: 600;
          color: #2563eb;
        }
        .gt-bar {
          margin-top: 8px;
          height: 3px;
          background: rgba(37,99,235,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .gt-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #1d4ed8, #60a5fa);
          border-radius: 2px;
        }

        @keyframes gtFL {
          0%,100% { transform: translateY(0) rotate(-1.5deg); }
          50% { transform: translateY(-12px) rotate(-1.5deg); }
        }
        @keyframes gtFR {
          0%,100% { transform: translateY(0) rotate(1.5deg); }
          50% { transform: translateY(-15px) rotate(1.5deg); }
        }
        @keyframes gtUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }

        @media (max-width: 900px) {
          .gt-card { display: none; }
          .gt-stat-sep { display: none; }
          .gt-stats { gap: 20px; }
        }
      `}</style>

      <section className="gt-hero">
        <div className="gt-grid" />
        <canvas ref={canvasRef} />
        <div className="gt-glow" />

        {/* Floating card left */}
        <div className="gt-card gt-card-left">
          <div className="gt-card-icon">📅</div>
          <div className="gt-card-title">Jadwal Hari Ini</div>
          <div className="gt-card-meta">8 sesi aktif · 4 ruang</div>
          <div className="gt-card-accent">Lihat jadwal →</div>
        </div>

        {/* Floating card right */}
        <div className="gt-card gt-card-right">
          <div className="gt-card-icon">📊</div>
          <div className="gt-card-title">Progres Siswa</div>
          <div className="gt-card-meta">Rata-rata kelulusan</div>
          <div className="gt-card-accent">94.2%</div>
          <div className="gt-bar">
            <div className="gt-bar-fill" style={{ width: "94%" }} />
          </div>
        </div>

        {/* badge */}
        <div className="gt-badge">
          <div className="gt-dot" />
          Platform Manajemen Pengajaran
        </div>

        {/* main content */}
        <div className="gt-content">
          <h1 className="gt-h1">
            Rapikan Sistem Mengajar<br />
            Sekolah dengan{" "}
            <span className="hl">gTeach</span>
          </h1>
          <p className="gt-sub">
            Satu platform untuk jadwal, kurikulum, penilaian, dan komunikasi guru —
            agar tim pengajar bisa fokus pada hal yang paling penting.
          </p>

          <div className="gt-cta">
            <button className="gt-btn-main" onClick={() => router.push("/login")}>
              Masuk ke Akun
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>


      </section>
    </>
  );
}