// app/admin/nilai/page.jsx
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
  nilai: "M2 12h2V8H2v4zM7 12h2V5H7v7zM12 12h2V2h-2v10z",
  check: "M2 8l4 4 8-8",
  alert: "M8 2l6 12H2L8 2zM8 7v3M8 12h0",
  star:  "M8 2l1.8 3.6L14 6.3l-3 2.9.7 4.1L8 11.2l-3.7 2.1.7-4.1-3-2.9 4.2-.7L8 2z",
};

const MAPEL_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6"];

const Badge = ({ label, type = "default" }) => {
  const styles = {
    tinggi:  "bg-emerald-50 text-emerald-700 border-emerald-100",
    sedang:  "bg-amber-50 text-amber-700 border-amber-100",
    rendah:  "bg-red-50 text-red-600 border-red-100",
    default: "bg-gray-50 text-gray-600 border-gray-100",
  };
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${styles[type]}`}>{label}</span>;
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

export default function AdminNilaiPage() {
  const { kelas, siswa, nilai, pengajaran, loading } = useAdminData();
  const [filterKelas, setFilterKelas] = useState("semua");
  const [filterSemester, setFilterSemester] = useState("semua");

  if (loading) {
    return <div className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse" />;
  }

  // Filter nilai
  const nilaiFiltered = nilai.filter((n) => {
    const matchSem = filterSemester === "semua" || n.semester === filterSemester;
    // Filter kelas via pengajaran
    if (filterKelas === "semua") return matchSem;
    const pg = pengajaran.find((p) => p.id === n.pengajaran_id);
    return matchSem && pg?.kelas_id === filterKelas;
  });

  const nilaiLP = nilaiFiltered.filter((n) => n.jenis === "lp");
  const rataGlobal = nilaiLP.length
    ? Math.round(nilaiLP.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilaiLP.length)
    : 0;
  const nilaiMax = nilaiLP.length ? Math.max(...nilaiLP.map((n) => n.nilai || 0)) : 0;
  const nilaiMin = nilaiLP.length ? Math.min(...nilaiLP.map((n) => n.nilai || 0)) : 0;
  const siswaTuntas = new Set(
    nilaiLP.filter((n) => (n.nilai || 0) >= 75).map((n) => n.siswa_id)
  ).size;
  const totalSiswa = new Set(nilaiLP.map((n) => n.siswa_id)).size;
  const pctTuntas = totalSiswa > 0 ? Math.round((siswaTuntas / totalSiswa) * 100) : 0;

  // Rata-rata per kelas (untuk tabel)
  const nilaiPerKelas = kelas.map((k) => {
    const pgIds = new Set(pengajaran.filter((p) => p.kelas_id === k.id).map((p) => p.id));
    const nilK = nilaiFiltered.filter((n) => n.jenis === "lp" && pgIds.has(n.pengajaran_id));
    const rata = nilK.length ? Math.round(nilK.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilK.length) : null;
    const grade = rata == null ? "—" : rata >= 90 ? "A" : rata >= 80 ? "B" : rata >= 70 ? "C" : "D";
    const gradeType = rata == null ? "default" : rata >= 90 ? "tinggi" : rata >= 80 ? "sedang" : "rendah";
    return { ...k, rata, grade, gradeType };
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Rata-rata Global" value={rataGlobal || "—"} sub="Semua kelas · LP" color="#3b82f6" iconKey="nilai" />
        <StatCard label="Nilai Tertinggi"  value={nilaiMax || "—"}   sub="Terbaik"           color="#10b981" iconKey="star" />
        <StatCard label="Nilai Terendah"   value={nilaiMin || "—"}   sub="Perlu perhatian"   color="#ef4444" iconKey="alert" />
        <StatCard label="Tuntas KKM 75"    value={`${pctTuntas}%`}  sub={`${siswaTuntas}/${totalSiswa} siswa`} color="#8b5cf6" iconKey="check" />
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
          {["semua", "1", "2"].map((s) => (
            <button key={s} onClick={() => setFilterSemester(s)}
              className={`text-[10.5px] px-2.5 py-1 rounded-md transition-colors ${filterSemester === s ? "bg-white text-blue-600 shadow-sm font-medium border border-gray-100" : "text-gray-400 hover:text-gray-600"}`}>
              {s === "semua" ? "Sem. 1 & 2" : `Semester ${s}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
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
      </div>

      {/* Distribusi nilai per kelas */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-[12px] font-semibold text-gray-800 mb-3">Distribusi Nilai Rata-rata per Kelas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {nilaiPerKelas.map((k, idx) => (
            <div key={k.id} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl">
              <p className="text-[11px] text-gray-600 font-semibold">{k.nama}</p>
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none"
                    stroke={MAPEL_COLORS[idx % MAPEL_COLORS.length]} strokeWidth="3"
                    strokeDasharray={`${((k.rata || 0) / 100) * 94.2} 94.2`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-gray-700">
                  {k.rata || "—"}
                </span>
              </div>
              <Badge label={k.grade} type={k.gradeType} />
            </div>
          ))}
        </div>
      </div>

      {/* Tabel ringkasan */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-[12px] font-semibold text-gray-800 mb-3">Ringkasan Nilai per Kelas</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-gray-100">
                {["Kelas", "Rata-rata", "Tertinggi", "Terendah", "Grade"].map((h) => (
                  <th key={h} className="text-left text-[10.5px] text-gray-400 font-medium pb-2 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nilaiPerKelas.map((k, idx) => {
                const pgIds = new Set(pengajaran.filter((p) => p.kelas_id === k.id).map((p) => p.id));
                const nilK = nilaiFiltered.filter((n) => n.jenis === "lp" && pgIds.has(n.pengajaran_id));
                const maks = nilK.length ? Math.max(...nilK.map((n) => n.nilai || 0)) : null;
                const mins = nilK.length ? Math.min(...nilK.map((n) => n.nilai || 0)) : null;
                return (
                  <tr key={k.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md text-white text-[9px] font-bold flex items-center justify-center"
                          style={{ background: MAPEL_COLORS[idx % MAPEL_COLORS.length] }}>
                          {k.nama?.slice(0, 2) || "K"}
                        </div>
                        <span className="text-[12px] font-medium text-gray-800">{k.nama}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${k.rata || 0}%` }} />
                        </div>
                        <span className="text-[12px] font-semibold text-gray-700">{k.rata ?? "—"}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-[12px] font-medium text-emerald-600">{maks ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-[12px] font-medium text-red-500">{mins ?? "—"}</td>
                    <td className="py-2.5"><Badge label={k.grade} type={k.gradeType} /></td>
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