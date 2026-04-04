"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminData, hitungStatistikKelas } from "@/hooks/useAdminData";

// ── Komponen Icon ─────────────────────────────────────────────────────────
const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  kelas:    "M2 3h12v10H2V3zM6 3v10M2 7h4",
  siswa:    "M5 2a3 3 0 100 6 3 3 0 000-6zM1 14c0-2.5 1.8-4 4-4M11 8a2 2 0 100-4 2 2 0 000 4M14 14c0-2-1.3-3-3-3",
  guru:     "M8 2a3 3 0 100 6 3 3 0 000-6zM2 14c0-3 2.7-5 6-5s6 2 6 5",
  nilai:    "M2 12h2V8H2v4zM7 12h2V5H7v7zM12 12h2V2h-2v10z",
  absensi:  "M2 3h12v10H2V3zM2 7h12M6 3V1M10 3V1",
  arrow:    "M6 4l4 4-4 4",
};

const KELAS_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444", "#6366f1"];

// ── Komponen LineChart dengan Hover & Tooltip ──────────────────────────────
function LineChart({ data, labels, color = "#3b82f6" }) {
  const canvasRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.length) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    const W = rect.width;
    const H = 100;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad = { t: 20, r: 20, b: 10, l: 20 };
    const cw = W - pad.l - pad.r;
    const ch = H - pad.t - pad.b;
    const max = Math.max(...data, 100);
    const min = 0;

    const getX = (i) => pad.l + (i / (data.length - 1 || 1)) * cw;
    const getY = (v) => pad.t + ch - ((v - min) / (max - min + 1)) * ch;

    ctx.clearRect(0, 0, W, H);

    // Area Gradient
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0]));
    data.forEach((v, i) => {
      if (i > 0) ctx.bezierCurveTo(getX(i - 0.5), getY(data[i-1]), getX(i - 0.5), getY(v), getX(i), getY(v));
    });
    ctx.lineTo(getX(data.length - 1), H);
    ctx.lineTo(getX(0), H);
    ctx.closePath();
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, color + "25"); gr.addColorStop(1, color + "00");
    ctx.fillStyle = gr; ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0]));
    data.forEach((v, i) => {
      if (i > 0) ctx.bezierCurveTo(getX(i - 0.5), getY(data[i-1]), getX(i - 0.5), getY(v), getX(i), getY(v));
    });
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();

    // Points
    data.forEach((v, i) => {
      const isHovered = hoverIndex === i;
      ctx.beginPath();
      ctx.arc(getX(i), getY(v), isHovered ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? color : "#fff";
      ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    });
  }, [data, color, hoverIndex]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padL = 20;
    const cw = rect.width - 40;
    const index = Math.round(((x - padL) / cw) * (data.length - 1));
    if (index >= 0 && index < data.length) {
      setHoverIndex(index);
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoverIndex(null);
    }
  };

  return (
    <div className="relative w-full" onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)}>
      <canvas ref={canvasRef} className="w-full h-[100px] cursor-crosshair" />
      {hoverIndex !== null && (
        <div 
          className="absolute z-10 pointer-events-none bg-gray-900 text-white px-2 py-1 rounded text-[10px] shadow-xl flex flex-col items-center whitespace-nowrap"
          style={{ left: mousePos.x, top: mousePos.y - 45, transform: "translateX(-50%)" }}
        >
          <span className="font-bold">{labels[hoverIndex]}</span>
          <span className="text-gray-300">Skor: {data[hoverIndex]}</span>
          <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
}

// ── Komponen StatCard (Original Style) ───────────────────────────────────
const StatCard = ({ label, value, sub, color, iconKey }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
        <span style={{ color }}><Icon d={icons[iconKey]} size={13} /></span>
      </span>
    </div>
    <p className="text-[26px] font-semibold text-gray-900 leading-none">{value}</p>
    {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
  </div>
);

// ── Komponen KelasCard (Sesuai Style Awal User) ──────────────────────────
function KelasCard({ kelas, stats, color, onClick }) {
  const { jumlahSiswa, pctHadir, rataRata, guruKelas } = stats;
  const gradeColor = rataRata >= 85 ? "#10b981" : rataRata >= 75 ? "#f59e0b" : "#ef4444";

  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: color }}>
            {kelas.nama?.replace(/\s/g, "").slice(0, 3).toUpperCase() || "KLS"}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-800">{kelas.nama}</p>
            <p className="text-[10px] text-gray-400">Tingkat {kelas.tingkat} · {kelas.tahun_ajaran}</p>
          </div>
        </div>
        <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
          <Icon d={icons.arrow} size={13} />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-[18px] font-bold text-gray-900">{jumlahSiswa}</p>
          <p className="text-[9.5px] text-gray-400 uppercase">Siswa</p>
        </div>
        <div className="text-center border-x border-gray-50">
          <p className="text-[18px] font-bold" style={{ color: gradeColor }}>{rataRata || "—"}</p>
          <p className="text-[9.5px] text-gray-400 uppercase">Rata Nilai</p>
        </div>
        <div className="text-center">
          <p className="text-[18px] font-bold text-gray-900">{pctHadir}%</p>
          <p className="text-[9.5px] text-gray-400 uppercase">Hadir</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-50">
        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon d={icons.guru} size={10} />
        </div>
        <span className="text-[10.5px] text-gray-500 truncate flex-1">
          {kelas.expand?.walikelas_id?.name || "Belum ada wali kelas"}
        </span>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{guruKelas} guru</span>
      </div>
    </div>
  );
}

// ── Page Utama ────────────────────────────────────────────────────────────
export default function AdminOverviewPage() {
  const router = useRouter();
  const { kelas, siswa, pengajaran, absensi, nilai, guru, loading, error } = useAdminData();

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400">Memuat Dashboard...</div>;
  if (error) return <div className="p-5 text-red-500">Error: {error}</div>;

  const kelasWithStats = kelas.map((k) => ({
    ...k,
    stats: hitungStatistikKelas(k.id, { siswa, absensi, nilai, pengajaran })
  }));

  const top10Nilai = [...kelasWithStats].sort((a, b) => b.stats.rataRata - a.stats.rataRata).slice(0, 10);
  const top10Hadir = [...kelasWithStats].sort((a, b) => b.stats.pctHadir - a.stats.pctHadir).slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Kelas" value={kelas.length} sub="Aktif" color="#3b82f6" iconKey="kelas" />
        <StatCard label="Total Siswa" value={siswa.length} sub="Siswa" color="#10b981" iconKey="siswa" />
        <StatCard label="Total Guru" value={guru.length} sub="Pengajar" color="#8b5cf6" iconKey="guru" />
        <StatCard label="Kehadiran" value={`${Math.round(kelasWithStats.reduce((a,b)=>a+b.stats.pctHadir,0)/(kelas.length||1))}%`} color="#f59e0b" iconKey="absensi" />
      </div>

      {/* Top 10 Analysis Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[12px] font-semibold text-gray-800 mb-4">10 Besar Nilai Rata-rata</p>
          <LineChart data={top10Nilai.map(k => k.stats.rataRata)} labels={top10Nilai.map(k => k.nama)} color="#3b82f6" />
          <div className="flex justify-between mt-4 overflow-hidden px-2">
            {top10Nilai.map((k, i) => (
              <span key={i} className="text-[8px] text-gray-400 font-bold rotate-[-45deg] origin-top-left truncate w-4">
                {k.nama?.split(' ').pop()}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[12px] font-semibold text-gray-800 mb-4">10 Besar Kehadiran Tertinggi</p>
          <LineChart data={top10Hadir.map(k => k.stats.pctHadir)} labels={top10Hadir.map(k => k.nama)} color="#10b981" />
          <div className="flex justify-between mt-4 overflow-hidden px-2">
            {top10Hadir.map((k, i) => (
              <span key={i} className="text-[8px] text-gray-400 font-bold rotate-[-45deg] origin-top-left truncate w-4">
                {k.nama?.split(' ').pop()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* List Kelas */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-semibold text-gray-800">Progress Semua Kelas</p>
          <button onClick={() => router.push("/admin/kelas")} className="text-[11px] text-blue-500 font-medium hover:underline">Lihat Semua →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {kelasWithStats.map((k, idx) => (
            <KelasCard key={k.id} kelas={k} stats={k.stats} color={KELAS_COLORS[idx % 8]} onClick={() => router.push(`/admin/kelas/${k.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}