// app/admin/kelas/[id]/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import pb  from "@/lib/pocketbase";

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  back:    "M10 4l-4 4 4 4",
  siswa:   "M5 2a3 3 0 100 6 3 3 0 000-6zM1 14c0-2.5 1.8-4 4-4M11 8a2 2 0 100-4 2 2 0 000 4M14 14c0-2-1.3-3-3-3",
  nilai:   "M2 12h2V8H2v4zM7 12h2V5H7v7zM12 12h2V2h-2v10z",
  absensi: "M2 3h12v10H2V3zM2 7h12M6 3V1M10 3V1",
  guru:    "M8 2a3 3 0 100 6 3 3 0 000-6zM2 14c0-3 2.7-5 6-5s6 2 6 5",
  check:   "M2 8l4 4 8-8",
  alert:   "M8 2l6 12H2L8 2zM8 7v3M8 12h0",
  mapel:   "M2 3h8a2 2 0 012 2v8a2 2 0 01-2 2H2V3zM10 3a2 2 0 012 2v8M6 7h2M6 10h2",
};

const MAPEL_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6"];

const Badge = ({ label, type = "default" }) => {
  const styles = {
    hadir:   "bg-emerald-50 text-emerald-700 border-emerald-100",
    sakit:   "bg-amber-50 text-amber-700 border-amber-100",
    izin:    "bg-blue-50 text-blue-700 border-blue-100",
    alpha:   "bg-red-50 text-red-600 border-red-100",
    default: "bg-gray-50 text-gray-600 border-gray-100",
    tinggi:  "bg-emerald-50 text-emerald-700 border-emerald-100",
    sedang:  "bg-amber-50 text-amber-700 border-amber-100",
    rendah:  "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${styles[type] || styles.default}`}>
      {label}
    </span>
  );
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

export default function AdminDetailKelasPage() {
  const { id } = useParams();
  const router = useRouter();

  const [kelas, setKelas] = useState(null);
  const [siswa, setSiswa] = useState([]);
  const [pengajaran, setPengajaran] = useState([]);
  const [absensi, setAbsensi] = useState([]);
  const [nilaiData, setNilaiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("siswa");

  useEffect(() => {
    async function fetchDetail() {
      try {
        const [k, sw, pg, abs, nil] = await Promise.all([
          pb.collection("kelas").getOne(id, { expand: "walikelas_id" }),
          pb.collection("siswa").getFullList({ filter: `kelas_id = "${id}" && aktif = true`, sort: "nama" }),
          pb.collection("pengajaran").getFullList({
            filter: `kelas_id = "${id}" && aktif = true`,
            expand: "guru_id,mapel_id",
          }),
          pb.collection("absensi").getFullList({
            filter: `pengajaran_id.kelas_id = "${id}"`,
            expand: "siswa_id",
          }),
          pb.collection("nilai").getFullList({
            filter: `pengajaran_id.kelas_id = "${id}"`,
            expand: "siswa_id,pengajaran_id.mapel_id,lp_id",
          }),
        ]);

        setKelas(k);
        setSiswa(sw);
        setPengajaran(pg);
        setAbsensi(abs);
        setNilaiData(nil);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-10 bg-white border border-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white border border-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!kelas) return <div className="text-[12px] text-gray-400">Kelas tidak ditemukan</div>;

  // ── Hitung statistik ──
  const jumlahSiswa = siswa.length;
  const totalAbsensi = absensi.length;
  const totalHadir = absensi.filter((a) => a.status === "hadir").length;
  const pctHadir = totalAbsensi > 0 ? Math.round((totalHadir / totalAbsensi) * 100) : 0;
  const nilaiLP = nilaiData.filter((n) => n.jenis === "lp");
  const rataRata = nilaiLP.length ? Math.round(nilaiLP.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilaiLP.length) : 0;

  // Rekap absensi per siswa
  const rekapAbsensi = siswa.map((s) => {
    const absS = absensi.filter((a) => a.siswa_id === s.id);
    return {
      ...s,
      hadir: absS.filter((a) => a.status === "hadir").length,
      sakit: absS.filter((a) => a.status === "sakit").length,
      izin:  absS.filter((a) => a.status === "izin").length,
      alpha: absS.filter((a) => a.status === "alpha").length,
      total: absS.length,
    };
  });

  // Rata-rata nilai per siswa
  const nilaiPerSiswa = siswa.map((s) => {
    const nilS = nilaiData.filter((n) => n.siswa_id === s.id && n.jenis === "lp");
    const rata = nilS.length ? Math.round(nilS.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilS.length) : null;
    const grade = rata == null ? "—" : rata >= 90 ? "A" : rata >= 80 ? "B" : rata >= 70 ? "C" : "D";
    const gradeType = rata == null ? "default" : rata >= 90 ? "tinggi" : rata >= 80 ? "sedang" : "rendah";
    return { ...s, rataRata: rata, grade, gradeType };
  });

  const TABS = [
    { key: "siswa",   label: "Data Siswa" },
    { key: "nilai",   label: "Rekap Nilai" },
    { key: "absensi", label: "Rekap Absensi" },
    { key: "mapel",   label: "Mata Pelajaran" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb & back */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[11.5px] text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Icon d={icons.back} size={12} /> Kembali
        </button>
        <span className="text-gray-300 text-[11px]">/</span>
        <span className="text-[11.5px] text-gray-700 font-medium">{kelas.nama}</span>
      </div>

      {/* Kelas header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center text-[14px] font-bold flex-shrink-0">
            {kelas.nama?.replace(/\s/g, "").slice(0, 3) || "KLS"}
          </div>
          <div className="flex-1">
            <h2 className="text-[18px] font-bold text-gray-900">{kelas.nama}</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Tingkat {kelas.tingkat} · TA {kelas.tahun_ajaran} · Wali Kelas:{" "}
              <span className="font-medium text-gray-600">{kelas.expand?.walikelas_id?.name || "Belum ditetapkan"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Siswa" value={jumlahSiswa}    sub="Siswa aktif"      color="#3b82f6" iconKey="siswa"   />
        <StatCard label="Rata Nilai"  value={rataRata || "—"} sub="Semua mapel LP"  color="#10b981" iconKey="nilai"   />
        <StatCard label="Kehadiran"   value={`${pctHadir}%`} sub="Bulan ini"        color="#8b5cf6" iconKey="absensi" />
        <StatCard label="Guru"        value={pengajaran.length} sub="Mengajar di kelas ini" color="#f59e0b" iconKey="guru" />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1.5 p-1 bg-gray-100/70 rounded-xl w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${activeTab === key ? "bg-white shadow-sm text-gray-800 border border-gray-100" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Data Siswa ── */}
      {activeTab === "siswa" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[12px] font-semibold text-gray-800 mb-3">Daftar Siswa — {kelas.nama}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["No", "NIS", "Nama Siswa", "JK"].map((h) => (
                    <th key={h} className="text-left text-[10.5px] text-gray-400 font-medium pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {siswa.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-3 text-[11px] text-gray-400">{i + 1}</td>
                    <td className="py-2.5 pr-3 text-[11px] text-gray-500">{s.nis}</td>
                    <td className="py-2.5 pr-3 text-[12px] text-gray-800 font-medium">{s.nama}</td>
                    <td className="py-2.5 pr-3 text-[11px] text-gray-500 capitalize">{s.jenis_kelamin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Rekap Nilai ── */}
      {activeTab === "nilai" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[12px] font-semibold text-gray-800 mb-3">Rekap Nilai Rata-rata per Siswa</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Nama Siswa", "Rata-rata LP", "Grade"].map((h) => (
                    <th key={h} className="text-left text-[10.5px] text-gray-400 font-medium pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nilaiPerSiswa.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-3 text-[12px] text-gray-800 font-medium">{s.nama}</td>
                    <td className="py-2.5 pr-3">
                      {s.rataRata !== null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${s.rataRata}%` }} />
                          </div>
                          <span className="text-[12px] font-semibold text-gray-700">{s.rataRata}</span>
                        </div>
                      ) : <span className="text-[11px] text-gray-300">Belum ada</span>}
                    </td>
                    <td className="py-2.5"><Badge label={s.grade} type={s.gradeType} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Rekap Absensi ── */}
      {activeTab === "absensi" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[12px] font-semibold text-gray-800 mb-3">Rekap Absensi per Siswa</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Nama Siswa", "Hadir", "Sakit", "Izin", "Alpha", "% Hadir"].map((h) => (
                    <th key={h} className="text-left text-[10.5px] text-gray-400 font-medium pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rekapAbsensi.map((s) => {
                  const pct = s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0;
                  return (
                    <tr key={s.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 pr-3 text-[12px] text-gray-800 font-medium">{s.nama}</td>
                      <td className="py-2.5 pr-3"><Badge label={s.hadir} type="hadir" /></td>
                      <td className="py-2.5 pr-3"><Badge label={s.sakit} type="sakit" /></td>
                      <td className="py-2.5 pr-3"><Badge label={s.izin} type="izin" /></td>
                      <td className="py-2.5 pr-3"><Badge label={s.alpha} type={s.alpha > 0 ? "alpha" : "default"} /></td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-1.5 rounded-full"
                              style={{ width: `${pct}%`, background: pct >= 90 ? "#10b981" : pct >= 75 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                          <span className="text-[12px] font-medium text-gray-700">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Mata Pelajaran & Guru ── */}
      {activeTab === "mapel" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[12px] font-semibold text-gray-800 mb-3">Mata Pelajaran & Guru Pengampu</p>
          <div className="flex flex-col gap-0">
            {pengajaran.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: MAPEL_COLORS[i % MAPEL_COLORS.length] + "18" }}>
                  <span style={{ color: MAPEL_COLORS[i % MAPEL_COLORS.length] }}>
                    <Icon d={icons.mapel} size={12} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-800">
                    {p.expand?.mapel_id?.nama || "Mapel tidak ditemukan"}
                  </p>
                  <p className="text-[10.5px] text-gray-400">
                    {p.expand?.mapel_id?.kode}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon d={icons.guru} size={10} />
                  </div>
                  <span className="text-[11.5px] text-gray-600">
                    {p.expand?.guru_id?.name || "—"}
                  </span>
                </div>
              </div>
            ))}
            {pengajaran.length === 0 && (
              <p className="text-center py-8 text-[12px] text-gray-300">
                Belum ada pengajaran untuk kelas ini
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}