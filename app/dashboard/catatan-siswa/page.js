"use client"

import { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";

export default function PageCatatanSiswa() {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State untuk Modal & Form
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [formData, setFormData] = useState({ judul: "", isi: "" });
  const [isSaving, setIsSaving] = useState(false);

  // 1. Ambil data siswa
  useEffect(() => {
    async function fetchSiswa() {
      try {
        const records = await pb.collection('siswa').getFullList({
          filter: 'aktif = true',
          expand: 'kelas_id',
          sort: 'nama',
        });
        setSiswa(records);
      } catch (err) {
        console.error("Gagal fetch siswa:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSiswa();
  }, []);

  // 2. Fungsi Simpan Catatan
  const handleSaveCatatan = async (e) => {
    e.preventDefault();
    if (!formData.judul || !formData.isi) return alert("Judul dan isi catatan wajib diisi");

    setIsSaving(true);
    try {
      await pb.collection('catatan_siswa').create({
        siswa_id: selectedSiswa.id,
        kelas_id: selectedSiswa.kelas_id,
        judul: formData.judul,
        isi: formData.isi,
        dicatat_oleh: pb.authStore.model?.id
      });

      alert(`Catatan untuk ${selectedSiswa.nama} berhasil disimpan!`);
      setFormData({ judul: "", isi: "" });
      setSelectedSiswa(null);
    } catch (err) {
      alert("Gagal menyimpan catatan");
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Catatan Siswa</h1>
        <p className="text-sm text-gray-500">Kelola catatan perkembangan siswa berdasarkan identitas resmi.</p>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Cari nama, NIS, atau NISN..."
          className="w-full md:w-80 p-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabel Siswa dengan NIS dan NISN */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Nama Siswa</th>
              <th className="p-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-center">NIS</th>
              <th className="p-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-center">NISN</th>
              <th className="p-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="4" className="p-10 text-center text-gray-400 animate-pulse">Memuat data...</td></tr>
            ) : filteredSiswa.length > 0 ? (
              filteredSiswa.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors text-[13px]">
                  <td className="p-4 font-bold text-gray-700">{s.nama}</td>
                  <td className="p-4 text-center font-mono text-gray-500">{s.nis || "-"}</td>
                  <td className="p-4 text-center font-mono text-gray-500">{s.nisn || "-"}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedSiswa(s)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[12px] font-bold hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                    >
                      Buat Catatan
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="p-10 text-center text-gray-400">Data siswa tidak ditemukan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      {selectedSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">Tambah Catatan</h3>
                <p className="text-[12px] text-indigo-600 font-medium">{selectedSiswa.nama} (NIS: {selectedSiswa.nis || "-"})</p>
              </div>
              <button onClick={() => setSelectedSiswa(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <form onSubmit={handleSaveCatatan} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Judul Catatan</label>
                <input 
                  type="text"
                  placeholder="Contoh: Kedisiplinan Siswa"
                  value={formData.judul}
                  onChange={(e) => setFormData({...formData, judul: e.target.value})}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Isi Detail</label>
                <textarea 
                  rows={4}
                  placeholder="Tulis detail pengamatan..."
                  value={formData.isi}
                  onChange={(e) => setFormData({...formData, isi: e.target.value})}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSelectedSiswa(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl text-[13px] font-bold">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[13px] font-bold shadow-md">
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}