"use client";

import { useState, useEffect, useMemo } from "react";
import pb from "@/lib/pocketbase";

export default function PageCetakRapor() {
  const [view, setView] = useState("list"); // 'list' atau 'print'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kelas: [],
    siswa: [],
    nilai: [],
    mapel: [],
    config: null
  });
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [activeSiswa, setActiveSiswa] = useState(null);

  // 1. Fetch Semua Data Awal
  useEffect(() => {
    async function initData() {
      try {
        const [resKelas, resSiswa, resNilai, resMapel, resConfig] = await Promise.all([
          pb.collection('kelas').getFullList({ sort: 'nama' }),
          pb.collection('siswa').getFullList({ filter: 'aktif = true', expand: 'kelas_id' }),
          pb.collection('nilai').getFullList(),
          pb.collection('mata_pelajaran').getFullList({ sort: 'nama' }),
          pb.collection('pengaturan_ajaran').getFirstListItem('', { sort: '-created' }).catch(() => null)
        ]);

        setData({
          kelas: resKelas,
          siswa: resSiswa,
          nilai: resNilai,
          mapel: resMapel,
          config: resConfig
        });
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // 2. Logika Hitung Fase & Kelengkapan
  const getFase = (namaKelas) => {
    const tingkat = parseInt(namaKelas) || 0;
    if (tingkat >= 1 && tingkat <= 2) return "A";
    if (tingkat >= 3 && tingkat <= 4) return "B";
    if (tingkat >= 5 && tingkat <= 6) return "C";
    return "-";
  };

  const statsSiswa = useMemo(() => {
    return data.siswa.map(s => {
      const nSiswa = data.nilai.filter(n => n.siswa_id === s.id);
      // Dianggap lengkap jika jumlah input nilai minimal sama dengan jumlah mapel
      const isLengkap = nSiswa.length >= data.mapel.length;
      return { ...s, isLengkap };
    });
  }, [data.siswa, data.nilai, data.mapel]);

  const handlePrint = (siswa) => {
    setActiveSiswa(siswa);
    setView("print");
    // Trigger print otomatis setelah render
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400">Menyiapkan Sistem Rapor...</div>;

  // --- TAMPILAN 1: DASHBOARD MONITORING ---
  if (view === "list") {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-800">Pusat Cetak Rapor</h1>
          <p className="text-sm text-gray-500">Pilih kelas dan siswa untuk mencetak hasil belajar.</p>
        </header>

        {/* Grid Kelas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.kelas.map(k => (
            <button
              key={k.id}
              onClick={() => setSelectedKelas(k)}
              className={`p-3 rounded-xl border text-sm font-bold transition-all ${selectedKelas?.id === k.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-300'}`}
            >
              Kelas {k.nama}
            </button>
          ))}
        </div>

        {/* Daftar Siswa */}
        {selectedKelas && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-700 text-sm">Daftar Siswa Kelas {selectedKelas.nama}</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Fase {getFase(selectedKelas.nama)}</span>
            </div>
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-gray-50 text-[13px]">
                {statsSiswa.filter(s => s.kelas_id === selectedKelas.id).map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 w-10 text-gray-300 font-bold">{idx + 1}</td>
                    <td className="p-4 font-medium text-gray-700">{s.nama}</td>
                    <td className="p-4 text-center">
                      {s.isLengkap ? 
                        <span className="text-green-500 font-bold">✔ Lengkap</span> : 
                        <span className="text-amber-500 font-medium">⚠ Belum Lengkap</span>
                      }
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handlePrint(s)}
                        className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-[11px] font-bold hover:bg-black transition-all active:scale-95"
                      >
                        Preview & Cetak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // --- TAMPILAN 2: PREVIEW RAPOR (PRINT MODE) ---
  const nSiswa = data.nilai.filter(n => n.siswa_id === activeSiswa.id);
  
  return (
    <div className="bg-white min-h-screen">
      <style jsx global>{`
        @font-face { font-family: 'Book Antiqua'; src: local('Book Antiqua'); }
        @media print {
          @page { size: 210mm 330mm; margin: 15mm 15mm 15mm 20mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
        }
        .rapor-page {
          font-family: 'Book Antiqua', serif;
          font-size: 10pt;
          color: black;
          line-height: 1.3;
          max-width: 210mm;
          margin: 0 auto;
          background: white;
        }
        .h-main { font-size: 11pt; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid black; padding: 6px 8px; vertical-align: top; }
        th { font-weight: bold; font-size: 11pt; background: #f9f9f9; }
      `}</style>

      {/* Control Bar (Hanya muncul di layar) */}
      <div className="no-print sticky top-0 bg-gray-900 text-white p-4 flex justify-between items-center z-50">
        <button onClick={() => setView("list")} className="text-[12px] bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600">← Kembali</button>
        <span className="text-[13px] font-bold">Preview Rapor: {activeSiswa.nama}</span>
        <button onClick={() => window.print()} className="bg-indigo-500 px-6 py-2 rounded-lg text-[12px] font-bold">Cetak (F4)</button>
      </div>

      {/* Konten Rapor */}
      <div className="rapor-page p-10">
        {/* Identitas */}
        <div className="grid grid-cols-2 gap-10 mb-8">
          <div className="space-y-1">
            <div className="flex"><span className="w-32">Nama Siswa</span>: <span className="font-bold ml-1">{activeSiswa.nama}</span></div>
            <div className="flex"><span className="w-32">NIS / NISN</span>: <span className="ml-1">{activeSiswa.nis || '-'} / {activeSiswa.nisn || '-'}</span></div>
            <div className="flex"><span className="w-32">Sekolah</span>: <span className="ml-1 uppercase">SD Negeri Contoh Digital</span></div>
            <div className="flex"><span className="w-32">Alamat</span>: <span className="ml-1 text-[9pt]">Jl. Pendidikan No. 20, Jakarta</span></div>
          </div>
          <div className="space-y-1">
            <div className="flex"><span className="w-32">Kelas</span>: <span className="ml-1">{activeSiswa.expand?.kelas_id?.nama}</span></div>
            <div className="flex"><span className="w-32">Fase</span>: <span className="ml-1">{getFase(activeSiswa.expand?.kelas_id?.nama)}</span></div>
            <div className="flex"><span className="w-32">Semester</span>: <span className="ml-1">{data.config?.semester_aktif || '-'}</span></div>
            <div className="flex"><span className="w-32">Tahun Ajaran</span>: <span className="ml-1">{data.config?.tahun_ajaran || '-'}</span></div>
          </div>
        </div>

        <h2 className="h-main text-center uppercase mb-6 underline">Laporan Hasil Belajar (Rapor)</h2>

        {/* Tabel Utama */}
        <table>
          <thead>
            <tr>
              <th className="w-[5%] text-center">No</th>
              <th className="w-[30%]">Muatan Pelajaran</th>
              <th className="w-[12%] text-center">Nilai Akhir</th>
              <th className="w-[53%]">Capaian Kompetensi</th>
            </tr>
          </thead>
          <tbody>
            {data.mapel.map((m, idx) => {
              const filterNilai = nSiswa.filter(n => n.mapel_id === m.id);
              const nilaiRata = filterNilai.length > 0 
                ? Math.round(filterNilai.reduce((a, b) => a + b.nilai, 0) / filterNilai.length)
                : "-";
              
              return (
                <tr key={m.id}>
                  <td className="text-center">{idx + 1}</td>
                  <td className="font-medium">{m.nama}</td>
                  <td className="text-center font-bold">{nilaiRata}</td>
                  <td className="text-[9pt] text-justify leading-tight">
                    {nilaiRata !== "-" ? (
                      `Menunjukkan penguasaan yang sangat baik dalam materi ${m.nama}. Mampu menganalisis dan menerapkan konsep dengan tepat dalam tugas mandiri maupun kelompok.`
                    ) : (
                      <span className="text-gray-300 italic">Data nilai belum diinput.</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Tanda Tangan */}
        <div className="mt-12 grid grid-cols-3 text-center">
          <div>
            <p>Orang Tua / Wali,</p>
            <div className="h-24"></div>
            <p className="font-bold underline text-[11pt]">..........................</p>
          </div>
          <div></div>
          <div>
            <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Wali Kelas,</p>
            <div className="h-24"></div>
            <p className="font-bold underline text-[11pt]">ADNAN, S.Kom</p>
            <p className="text-[10px]">NIP. 19990712 202512 1 001</p>
          </div>
        </div>
      </div>
    </div>
  );
}