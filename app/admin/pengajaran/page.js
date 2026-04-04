"use client";

import { useState, useRef } from "react";
import pb from "@/lib/pocketbase";
import { useAdminData } from "@/hooks/useAdminData";
import * as XLSX from "xlsx";

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  search: "M7 2a5 5 0 100 10A5 5 0 007 2zM14 14l-3-3",
  plus: "M8 3v10M3 8h10",
  excel: "M3 13V3a1 1 0 011-1h6l3 3v8a1 1 0 01-1 1H4a1 1 0 01-1-1z M8 2v3h3",
  download: "M3 13h10M8 3v7m-3-3l3 3 3-3",
  chevronDown: "M4 6l4 4 4-4",
  edit: "M11 2l3 3L5 14H2v-3L11 2z",
  trash: "M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5",
  close: "M3 3l10 10M3 13L13 3",
};

export default function AdminPengajaranPage() {
  const { pengajaran, guru, kelas, loading } = useAdminData();
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [editingData, setEditingData] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const fileInputRef = useRef(null);

  const filtered = pengajaran.filter((p) => {
    const guruNama = p.expand?.guru_id?.name?.toLowerCase() || "";
    const mapelNama = p.expand?.mapel_id?.nama?.toLowerCase() || "";
    const term = search.toLowerCase();
    return (guruNama.includes(term) || mapelNama.includes(term)) && (filterKelas === "" || p.kelas_id === filterKelas);
  });

  // --- 1. DOWNLOAD TEMPLATE ---
  const downloadTemplate = () => {
    const template = [
      { "Nama Guru": "Budi Santoso", "Mata Pelajaran": "Matematika", "Nama Kelas": "X MIPA 1" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Pengajaran.xlsx");
  };

  // --- 2. EXPORT DATA ---
  const exportToExcel = () => {
    const dataExport = filtered.map(p => ({
      Guru: p.expand?.guru_id?.name,
      Mapel: p.expand?.mapel_id?.nama,
      Kelas: p.expand?.kelas_id?.nama,
      Status: "Aktif"
    }));
    const ws = XLSX.utils.json_to_sheet(dataExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Pengajaran");
    XLSX.writeFile(wb, "Data_Pengajaran.xlsx");
    setShowExcelMenu(false);
  };

  // --- 3. IMPORT LOGIC ---
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setShowExcelMenu(false);

    // Kita butuh data mapel untuk mencari ID-nya
    const mapels = await pb.collection("mapel").getFullList();

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        for (const row of data) {
          // Cari ID Guru berdasarkan Nama
          const targetGuru = guru.find(g => g.name?.toLowerCase() === row["Nama Guru"]?.toLowerCase());
          // Cari ID Kelas berdasarkan Nama
          const targetKelas = kelas.find(k => k.nama?.toLowerCase() === row["Nama Kelas"]?.toLowerCase());
          // Cari ID Mapel berdasarkan Nama
          const targetMapel = mapels.find(m => m.nama?.toLowerCase() === row["Mata Pelajaran"]?.toLowerCase());

          if (targetGuru && targetKelas && targetMapel) {
            await pb.collection("pengajaran").create({
              guru_id: targetGuru.id,
              kelas_id: targetKelas.id,
              mapel_id: targetMapel.id,
              aktif: true
            });
            successCount++;
          }
        }
        alert(`Berhasil mengimpor ${successCount} data pengajaran!`);
        window.location.reload();
      } catch (err) {
        alert("Gagal Impor! Pastikan format kolom sesuai template.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- ACTIONS MANUAL ---
  const handleDelete = async (id) => {
    if (confirm("Hapus plotting pengajaran ini?")) {
      try {
        await pb.collection("pengajaran").delete(id);
        window.location.reload();
      } catch (err) { alert("Gagal hapus"); }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        guru_id: editingData.guru_id,
        mapel_id: editingData.mapel_id,
        kelas_id: editingData.kelas_id,
        aktif: true,
      };
      if (editingData.id) await pb.collection("pengajaran").update(editingData.id, payload);
      else await pb.collection("pengajaran").create(payload);
      window.location.reload();
    } catch (err) { alert("Gagal menyimpan data"); }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 text-[12px]">Memuat data pengajaran...</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Actions */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-[11px] font-medium transition-colors whitespace-nowrap">
            <Icon d={icons.download} size={12} /> Template Excel
          </button>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-64">
            <Icon d={icons.search} className="text-gray-400" />
            <input className="bg-transparent outline-none text-[12px] w-full" placeholder="Cari guru atau mapel..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] outline-none" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
            <option value="">Semua Kelas</option>
            {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
          
          {/* Dropdown Excel */}
          <div className="relative flex-1 md:flex-none">
            <button onClick={() => setShowExcelMenu(!showExcelMenu)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-[12px] font-medium hover:bg-emerald-600 transition-all">
              <Icon d={icons.excel} /> {isImporting ? "Proses..." : "Excel"} <Icon d={icons.chevronDown} size={10} />
            </button>
            {showExcelMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={() => fileInputRef.current.click()} className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  Import Excel
                </button>
                <button onClick={exportToExcel} className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 border-t border-gray-50 flex items-center gap-2">
                  Export Excel
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setEditingData({ guru_id: "", mapel_id: "", kelas_id: "" })} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-[12px] font-medium hover:bg-blue-600 transition-all">
            <Icon d={icons.plus} /> Tambah Plotting
          </button>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="p-4">Guru Pengajar</th>
              <th className="p-4">Mata Pelajaran</th>
              <th className="p-4">Kelas</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors text-[13px]">
                <td className="p-4 font-semibold text-gray-700">{p.expand?.guru_id?.name || "N/A"}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-medium">
                    {p.expand?.mapel_id?.nama || "N/A"}
                  </span>
                </td>
                <td className="p-4 text-gray-600 font-medium">{p.expand?.kelas_id?.nama || "N/A"}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditingData(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Icon d={icons.edit} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Icon d={icons.trash} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>    

      {/* Modal Form Tambah/Edit */}
      {editingData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-[14px] font-bold text-gray-800">{editingData.id ? "Edit Penugasan" : "Tambah Penugasan"}</h3>
              <button onClick={() => setEditingData(null)}><Icon d={icons.close} size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Pilih Guru</label>
                <select required className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]"
                  value={editingData.guru_id} onChange={e => setEditingData({...editingData, guru_id: e.target.value})}>
                  <option value="">-- Pilih Guru --</option>
                  {guru.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Pilih Kelas</label>
                <select required className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]"
                  value={editingData.kelas_id} onChange={e => setEditingData({...editingData, kelas_id: e.target.value})}>
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>

              {/* Catatan: Untuk Mapel, idealnya ambil dari pb.collection('mapel'). Namun jika belum ada di hook, 
                  sementara pastikan hook useAdminData mengambil data mapel juga atau gunakan data yang ada */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Pilih Mata Pelajaran</label>
                <select required className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px]"
                  value={editingData.mapel_id} onChange={e => setEditingData({...editingData, mapel_id: e.target.value})}>
                  <option value="">-- Pilih Mapel --</option>
                  {/* Gunakan data mapel dari koleksi pengajaran yang unik atau tambahkan koleksi mapel di hook */}
                  {Array.from(new Set(pengajaran.map(p => JSON.stringify({id: p.mapel_id, nama: p.expand?.mapel_id?.nama}))))
                    .map(m => {
                      const item = JSON.parse(m);
                      return <option key={item.id} value={item.id}>{item.nama}</option>
                    })}
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setEditingData(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-[12px] font-bold">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[12px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">Simpan Plotting</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}