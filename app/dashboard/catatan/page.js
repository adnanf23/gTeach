"use client"

import { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";

export default function PageCatatan() {
  const [activeTab, setActiveTab] = useState("siswa");
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State untuk mapel
  const [mapelList, setMapelList] = useState([]);
  // Map siswa_id -> array kode mapel yang sudah ada catatannya
  const [siswaMapelBadges, setSiswaMapelBadges] = useState({});

  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [formData, setFormData] = useState({ judul: "", isi: "", mapelId: "" });
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = pb.authStore.model;
  const userKelasId = currentUser?.kelas_id;

  // 1. Fetch data Siswa (dengan expand kelas_id) dan Daftar Mapel
  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        // Mengambil siswa berdasarkan kelas guru, di-expand agar dapet detail kelasnya
        const [siswaDat, mapelDat] = await Promise.all([
          pb.collection('siswa').getFullList({
            filter: `kelas_id = "${userKelasId}"`,
            expand: 'kelas_id', // Ini penting untuk menampilkan nama kelas
            sort: 'nama',
          }),
          pb.collection('mata_pelajaran').getFullList({ sort: 'nama' }),
        ]);
        setSiswa(siswaDat);
        setMapelList(mapelDat);
      } catch (err) {
        console.error("Gagal fetch data utama:", err);
      } finally {
        setLoading(false);
      }
    }
    if (userKelasId) fetchAll();
  }, [userKelasId]);

  // 2. Fetch badge mapel (indikator mapel apa saja yang sudah diisi catatannya)
  useEffect(() => {
    if (activeTab !== "mapel" || siswa.length === 0) return;

    async function fetchBadges() {
      try {
        const siswaIds = siswa.map(s => s.id);
        const filterStr = siswaIds.map(id => `siswa_id = "${id}"`).join(' || ');
        
        const records = await pb.collection('catatan_mapel').getFullList({
          filter: filterStr,
          expand: 'mapel_id',
          fields: 'siswa_id,expand.mapel_id.kode',
        });

        const grouped = {};
        records.forEach(r => {
          const sid = r.siswa_id;
          const kode = r.expand?.mapel_id?.kode;
          if (!kode) return;
          if (!grouped[sid]) grouped[sid] = new Set();
          grouped[sid].add(kode);
        });

        const result = {};
        Object.keys(grouped).forEach(sid => {
          result[sid] = Array.from(grouped[sid]);
        });
        setSiswaMapelBadges(result);
      } catch (err) {
        console.error("Gagal fetch badges mapel:", err);
      }
    }
    fetchBadges();
  }, [activeTab, siswa]);

  // 3. Simpan Catatan
  const handleSaveCatatan = async (e) => {
    e.preventDefault();
    if (activeTab === "siswa" && (!formData.judul || !formData.isi)) 
      return alert("Judul dan isi catatan wajib diisi");
    if (activeTab === "mapel" && (!formData.mapelId || !formData.isi)) 
      return alert("Pilih Mata Pelajaran dan isi catatan");

    setIsSaving(true);
    try {
      if (activeTab === "siswa") {
        await pb.collection('catatan_siswa').create({
          siswa_id: selectedSiswa.id,
          kelas_id: selectedSiswa.kelas_id || userKelasId,
          judul: formData.judul,
          isi: formData.isi,
          dicatat_oleh: currentUser?.id,
        });
      } else {
        await pb.collection('catatan_mapel').create({
          siswa_id: selectedSiswa.id,
          mapel_id: formData.mapelId,
          catatan: formData.isi,
          guru_id: currentUser?.id,
        });

        // Update badge UI secara lokal (tanpa refetch)
        const mapel = mapelList.find(m => m.id === formData.mapelId);
        if (mapel?.kode) {
          setSiswaMapelBadges(prev => {
            const existing = new Set(prev[selectedSiswa.id] || []);
            existing.add(mapel.kode);
            return { ...prev, [selectedSiswa.id]: Array.from(existing) };
          });
        }
      }

      alert(`Sukses! Catatan ${activeTab} untuk ${selectedSiswa.nama} telah disimpan.`);
      setFormData({ judul: "", isi: "", mapelId: "" });
      setSelectedSiswa(null);
    } catch (err) {
      alert("Gagal menyimpan. Periksa izin akses database.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSiswa = siswa.filter(s => 
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.nis && s.nis.includes(searchTerm)) ||
    (s.nisn && s.nisn.includes(searchTerm))
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto mb-20 font-sans">
      
      {/* Tab Navigasi */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8 w-fit shadow-inner">
        <button 
          onClick={() => { setActiveTab("siswa"); setSelectedSiswa(null); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "siswa" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Catatan Siswa
        </button>
        <button 
          onClick={() => { setActiveTab("mapel"); setSelectedSiswa(null); }}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "mapel" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Catatan Mapel
        </button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">
          {activeTab === "siswa" ? "Catatan Perkembangan" : "Capaian Per Mapel"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {activeTab === "siswa" 
            ? "Mencatat perilaku, kedisiplinan, dan perkembangan umum siswa." 
            : "Mencatat kemajuan akademis siswa pada mata pelajaran spesifik."}
        </p>
      </div>

      {/* Pencarian */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Cari nama atau nomor identitas..."
            className="w-full p-3.5 pl-11 rounded-2xl border border-gray-200 text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all bg-white shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabel Utama */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] w-20 text-center">No.</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Informasi Siswa</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] text-center">Identitas</th>
                <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="4" className="p-16 text-center text-gray-400 animate-pulse font-medium">Sinkronisasi data...</td></tr>
              ) : filteredSiswa.length > 0 ? (
                filteredSiswa.map((s, index) => {
                  const badges = activeTab === "mapel" ? (siswaMapelBadges[s.id] || []) : [];
                  // LOGIKA: Ambil nama kelas dari expand. Jika tidak ada, tampilkan ID atau fallback
                  const namaKelas = s.expand?.kelas_id?.nama || "Tanpa Kelas";

                  return (
                    <tr key={s.id} className="hover:bg-indigo-50/20 transition-colors group">
                      <td className="p-5 text-center text-sm font-medium text-gray-400">{index + 1}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                            {s.nama}
                          </span>
                          {badges.map(kode => (
                            <span 
                              key={kode}
                              className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-lg"
                            >
                              {kode}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="inline-flex flex-col gap-1">
                          <span className="text-[11px] font-mono font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">NIS: {s.nis || "-"}</span>
                          <span className="text-[10px] text-gray-400 font-medium">NISN: {s.nisn || "-"}</span>
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          onClick={() => setSelectedSiswa(s)}
                          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[12px] font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 shadow-md shadow-indigo-100"
                        >
                          {activeTab === "siswa" ? "Catatan Umum" : "Catatan Mapel"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="4" className="p-16 text-center text-gray-400 text-sm italic">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {selectedSiswa && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-8 border-b border-gray-50 flex justify-between items-start">
              <div>
                <h3 className="font-black text-xl text-gray-800 leading-tight">
                  Buat Catatan {activeTab === "siswa" ? "Umum" : "Mapel"}
                </h3>
                <p className="text-[13px] text-indigo-600 font-bold mt-1 uppercase tracking-widest">
                  {selectedSiswa.nama}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSiswa(null)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 text-2xl font-light hover:bg-red-50 hover:text-red-500 transition-all"
              >&times;</button>
            </div>

            <form onSubmit={handleSaveCatatan} className="p-8 space-y-6">
              {activeTab === "mapel" && (
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-1">Mata Pelajaran</label>
                  <select 
                    required
                    value={formData.mapelId}
                    onChange={(e) => setFormData({...formData, mapelId: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[14px] font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Pilih Mata Pelajaran...</option>
                    {mapelList.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.kode ? `[${m.kode}] ` : ""}{m.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === "siswa" && (
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-1">Subjek / Judul</label>
                  <input 
                    required
                    type="text"
                    placeholder="Misal: Perkembangan Karakter"
                    value={formData.judul}
                    onChange={(e) => setFormData({...formData, judul: e.target.value})}
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[14px] font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-1">
                  {activeTab === "siswa" ? "Isi Laporan / Catatan" : "Catatan"}
                </label>
                <textarea 
                  required
                  rows={5}
                  placeholder={activeTab === "siswa" ? "Deskripsikan detail pengamatan guru di sini..." : "Tulis catatan capaian mapel..."}
                  value={formData.isi}
                  onChange={(e) => setFormData({...formData, isi: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[14px] font-medium outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all leading-relaxed"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] text-sm font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 active:scale-[0.98] transition-all uppercase tracking-widest"
                >
                  {isSaving ? "Menyimpan Data..." : "Simpan ke Sistem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}