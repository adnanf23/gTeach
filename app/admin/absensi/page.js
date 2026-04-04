// app/admin/absensi/page.jsx
"use client";

import { useState } from "react";
import { useAdminData } from "@/hooks/useAdminData";

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const icons = {
  check:   "M2 8l4 4 8-8",
  alert:   "M8 2l6 12H2L8 2zM8 7v3M8 12h0",
  absensi: "M2 3h12v10H2V3zM2 7h12M6 3V1M10 3V1",
  book:    "M2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H2V3zM10 3a2 2 0 012 2v8M6 7h2M6 10h2",
};

const Badge = ({ label, type = "default" }) => {
  const styles = {
    hadir:   "bg-emerald-50 text-emerald-700 border-emerald-100",
    sakit:   "bg-amber-50 text-amber-700 border-amber-100",
    izin:    "bg-blue-50 text-blue-700 border-blue-100",
    alpha:   "bg-red-50 text-red-600 border-red-100",
    default: "bg-gray-50 text-gray-600 border-gray-100",
  };
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${styles[type] || styles.default}`}>{label}</span>;
};

const StatCard = ({ label, value, sub, color, iconKey }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2">
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

const KELAS_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#ef4444","#6366f1"];

export default function AdminAbsensiPage() {
  const { kelas, siswa, absensi, pengajaran, loading } = useAdminData();
  const [filterKelas, setFilterKelas] = useState("semua");

  if (loading) return <div className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse" />;

  const totalAbsensi = absensi.length;
  const totalHadir  = absensi.filter((a) => a.status === "hadir").length;
  const totalSakit  = absensi.filter((a) => a.status === "sakit").length;
  const totalIzin   = absensi.filter((a) => a.status === "izin").length;
  const totalAlpha  = absensi.filter((a) => a.status === "alpha").length;
  const pctHadir = totalAbsensi > 0 ? Math.round((totalHadir / totalAbsensi) * 100) : 0;

  // Rekap per kelas
  const rekapKelas = kelas.map((k, idx) => {
    const siswaKelas = new Set(siswa.filter((s) => s.kelas_id === k.id).map((s) => s.id));
    const absK = absensi.filter((a) => siswaKelas.has(a.siswa_id));
    const hadir = absK.filter((a) => a.status === "hadir").length;
    const sakit = absK.filter((a) => a.status === "sakit").length;
    const izin  = absK.filter((a) => a.status === "izin").length;
    const alpha = absK.filter((a) => a.status === "alpha").length;
    const total = absK.length;
    const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { ...k, hadir, sakit, izin, alpha, total, pct, color: KELAS_COLORS[idx % KELAS_COLORS.length] };
  });

  const displayed = filterKelas === "semua"
    ? rekapKelas
    : rekapKelas.filter((k) => k.id === filterKelas);

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Hadir Global"  value={`${pctHadir}%`}    sub={`${totalHadir} catatan`}  color="#10b981" iconKey="check"   />
        <StatCard label="Sakit"         value={totalSakit}         sub="Semua kelas"              color="#f59e0b" iconKey="alert"   />
        <StatCard label="Izin"          value={totalIzin}          sub="Semua kelas"              color="#3b82f6" iconKey="book"    />
        <StatCard label="Alpha"         value={totalAlpha}         sub="Perlu perhatian"          color="#ef4444" iconKey="alert"   />
      </div>

      {/* Filter kelas */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-2 items-center">
        <button onClick={() => setFilterKelas("semua")}
          className={`text-[10.5px] px-2.5 py-1 rounded-lg border transition-colors ${filterKelas === "semua" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200"}`}>
          Semua Kelas
        </button>
        {kelas.map((k) => (
          <button key={k.id} onClick={() => setFilterKelas(k.id)}
            className={`text-[10.5px] px-2.5 py-1 rounded-lg border transition-colors ${filterKelas === k.id ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200"}`}>
            {k.nama}
          </button>
        ))}
      </div>

      {/* Tabel rekap per kelas */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-[12px] font-semibold text-gray-800 mb-3">Rekap Absensi per Kelas</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-100">
                {["Kelas", "Hadir", "Sakit", "Izin", "Alpha", "% Hadir", "Status"].map((h) => (
                  <th key={h} className="text-left text-[10.5px] text-gray-400 font-medium pb-2 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((k) => {
                const statusLabel = k.pct >= 90 ? "Baik" : k.pct >= 75 ? "Cukup" : "Perhatian";
                const statusType  = k.pct >= 90 ? "hadir" : k.pct >= 75 ? "sakit" : "alpha";
                return (
                  <tr key={k.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg text-white text-[9px] font-bold flex items-center justify-center"
                          style={{ background: k.color }}>
                          {k.nama?.slice(0, 2) || "KL"}
                        </div>
                        <span className="text-[12px] font-medium text-gray-800">{k.nama}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3"><Badge label={k.hadir} type="hadir" /></td>
                    <td className="py-2.5 pr-3"><Badge label={k.sakit} type="sakit" /></td>
                    <td className="py-2.5 pr-3"><Badge label={k.izin}  type="izin"  /></td>
                    <td className="py-2.5 pr-3"><Badge label={k.alpha} type={k.alpha > 0 ? "alpha" : "default"} /></td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full"
                            style={{ width: `${k.pct}%`, background: k.pct >= 90 ? "#10b981" : k.pct >= 75 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <span className="text-[12px] font-medium text-gray-700">{k.pct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5"><Badge label={statusLabel} type={statusType} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}