"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase"; 
import { useAdminData, hitungStatistikKelas } from "@/hooks/useAdminData";
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

const KELAS_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444", "#6366f1"];

export default function AdminKelasPage() {
  const router = useRouter();
  const { kelas, siswa, absensi, nilai, pengajaran, loading } = useAdminData();
  const [search, setSearch] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("semua");
  
  // States untuk UI
  const [showModal, setShowModal] = useState(false);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingKelas, setEditingKelas] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nama: "", tingkat: "", tahun_ajaran: "2024/2025", walikelas_id: ""
  });

  const [daftarGuru, setDaftarGuru] = useState([]);
  
  const loadGuru = async () => {
    try {
      const res = await pb.collection("users").getFullList({ filter: 'role = "guru"' });
      setDaftarGuru(res);
    } catch (e) { console.error(e); }
  };

  const openAddModal = () => {
    setEditingKelas(null);
    setFormData({ nama: "", tingkat: "", tahun_ajaran: "2024/2025", walikelas_id: "" });
    loadGuru();
    setShowModal(true);
  };

  const openEditModal = (e, k) => {
    e.stopPropagation(); // Biar gak ke trigger router.push detail kelas
    setEditingKelas(k);
    setFormData({
      nama: k.nama,
      tingkat: k.tingkat,
      tahun_ajaran: k.tahun_ajaran,
      walikelas_id: k.walikelas_id
    });
    loadGuru();
    setShowModal(true);
  };

  // --- ACTIONS ---
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingKelas) {
        await pb.collection("kelas").update(editingKelas.id, formData);
      } else {
        await pb.collection("kelas").create(formData);
      }
      window.location.reload();
    } catch (error) {
      alert("Gagal menyimpan: " + error.message);
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (e, id, nama) => {
    e.stopPropagation();
    if (confirm(`Hapus kelas ${nama}? Semua data relasi mungkin terdampak.`)) {
      try {
        await pb.collection("kelas").delete(id);
        window.location.reload();
      } catch (err) { alert("Gagal hapus: " + err.message); }
    }
  };

  // --- EXCEL LOGIC ---
  const downloadTemplate = () => {
    const template = [{ Nama_Kelas: "X MIPA 1", Tingkat: "10", Tahun_Ajaran: "2024/2025" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Kelas.xlsx");
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = XLSX.utils.sheet_to_json(XLSX.read(evt.target.result, { type: "binary" }).Sheets[XLSX.read(evt.target.result, { type: "binary" }).SheetNames[0]]);
        for (const row of data) {
          await pb.collection("kelas").create({
            nama: row.Nama_Kelas,
            tingkat: row.Tingkat?.toString(),
            tahun_ajaran: row.Tahun_Ajaran,
          });
        }
        window.location.reload();
      } catch (err) { alert("Gagal Impor! Periksa format file."); }
      finally { setIsImporting(false); }
    };
    reader.readAsBinaryString(file);
  };

  const exportData = () => {
    const data = filtered.map(k => ({
      Nama: k.nama,
      Tingkat: k.tingkat,
      TA: k.tahun_ajaran,
      Wali_Kelas: k.expand?.walikelas_id?.name || "-"
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Kelas");
    XLSX.writeFile(wb, "Data_Kelas.xlsx");
  };

  // --- FILTERING ---
  const tingkatList = [...new Set(kelas.map((k) => k.tingkat).filter(Boolean))].sort();
  const filtered = kelas.filter((k) => {
    const matchSearch = k.nama?.toLowerCase().includes(search.toLowerCase()) ||
      k.expand?.walikelas_id?.name?.toLowerCase().includes(search.toLowerCase());
    const matchTingkat = filterTingkat === "semua" || k.tingkat === filterTingkat;
    return matchSearch && matchTingkat;
  });

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 text-[12px]">Memuat data kelas...</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
        <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700 text-[11px] font-medium mr-2">
          <Icon d={icons.download} size={12} /> Template
        </button>
        
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 w-full sm:w-56">
          <span className="text-gray-300"><Icon d={icons.search} size={11} /></span>
          <input className="flex-1 text-[11px] bg-transparent outline-none text-gray-700 placeholder-gray-300"
            placeholder="Cari kelas..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["semua", ...tingkatList].map((t) => (
            <button key={t} onClick={() => setFilterTingkat(t)}
              className={`text-[10px] px-3 py-1 rounded-full border whitespace-nowrap transition-all ${filterTingkat === t ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
              {t === "semua" ? "Semua" : `Tingkat ${t}`}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2 w-full sm:w-auto">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
          <div className="relative flex-1">
            <button onClick={() => setShowExcelMenu(!showExcelMenu)} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[11px] font-medium hover:bg-emerald-600 transition-all">
              <Icon d={icons.excel} size={12} /> {isImporting ? "..." : "Excel"} <Icon d={icons.chevronDown} size={10} />
            </button>
            {showExcelMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button onClick={() => fileInputRef.current.click()} className="w-full text-left px-4 py-2 text-[11px] hover:bg-gray-50 text-gray-700 flex items-center gap-2"><Icon d={icons.plus} size={12} />Import Kelas</button>
                <button onClick={exportData} className="w-full text-left px-4 py-2 text-[11px] hover:bg-gray-50 text-gray-700 border-t border-gray-50 flex items-center gap-2"><Icon d={icons.download} size={12} />Export Data</button>
              </div>
            )}
          </div>
          <button onClick={openAddModal} className="flex-1 flex items-center justify-center gap-1 text-[11px] px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium">
            <Icon d={icons.plus} size={11} /> Tambah
          </button>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold ml-1">Total {filtered.length} Kelas Terdaftar</p>

      {/* Grid Kelas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((k, idx) => {
          const stats = hitungStatistikKelas(k.id, { siswa, absensi, nilai, pengajaran });
          const color = KELAS_COLORS[idx % KELAS_COLORS.length];
          
          return (
            <div key={k.id} onClick={() => router.push(`/admin/kelas/${k.id}`)}
              className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group relative">
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[14px] font-black text-white shadow-lg shadow-blue-50" style={{ background: color }}>
                  {k.nama?.replace(/\s/g, "").slice(0, 3)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-lg">
                  <button onClick={(e) => openEditModal(e, k)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md"><Icon d={icons.edit} /></button>
                  <button onClick={(e) => handleDelete(e, k.id, k.nama)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"><Icon d={icons.trash} /></button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-[15px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{k.nama}</h3>
                <p className="text-[11px] text-gray-400 font-medium tracking-tight">Tahun Ajaran {k.tahun_ajaran}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 bg-gray-50 rounded-2xl mb-4 border border-gray-100/50">
                <div className="text-center">
                  <span className="block text-[16px] font-black text-gray-800">{stats.jumlahSiswa}</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Siswa</span>
                </div>
                <div className="text-center border-x border-gray-200">
                  <span className="block text-[16px] font-black text-emerald-500">{stats.rataRata || 0}</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Rerata</span>
                </div>
                <div className="text-center">
                  <span className="block text-[16px] font-black text-blue-500">{stats.pctHadir}%</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Hadir</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><Icon d={icons.guru} size={10} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase font-bold leading-none mb-0.5">Wali Kelas</p>
                  <p className="text-[11.5px] font-semibold text-gray-700 truncate">{k.expand?.walikelas_id?.name || "Belum ditentukan"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit */}
{/* Modal Add/Edit Kelas */}
{showModal && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
      {/* Header Modal */}
      <div className="p-5 border-b border-gray-50 flex justify-between items-center">
        <h3 className="text-[14px] font-black text-gray-800">
          {editingKelas ? "Edit Data Kelas" : "Tambah Kelas Baru"}
        </h3>
        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
          <Icon d={icons.close} size={18} />
        </button>
      </div>

      <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
        {/* Nama Kelas */}
        <div>
          <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Nama Kelas</label>
          <input 
            required 
            className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:bg-white transition-all"
            placeholder="Contoh: X MIPA 1" 
            value={formData.nama} 
            onChange={e => setFormData({...formData, nama: e.target.value})} 
          />
        </div>

        {/* Tingkat & Tahun Ajaran */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Tingkat</label>
            <input 
              required 
              placeholder="10/11/12"
              className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={formData.tingkat} 
              onChange={e => setFormData({...formData, tingkat: e.target.value})} 
            />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Tahun Ajaran</label>
            <input 
              required 
              className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={formData.tahun_ajaran} 
              onChange={e => setFormData({...formData, tahun_ajaran: e.target.value})} 
            />
          </div>
        </div>

        {/* Pilih Wali Kelas */}
        <div>
          <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Wali Kelas</label>
          <select 
            className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
            value={formData.walikelas_id} 
            onChange={e => setFormData({...formData, walikelas_id: e.target.value})}
          >
            <option value="">Pilih Guru</option>
            {daftarGuru.map(g => (
              <option key={g.id} value={g.id}>{g.name || g.username}</option>
            ))}
          </select>
        </div>

        {/* Tombol Submit */}
        <button 
          disabled={isSubmitting} 
          className="w-full mt-2 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-black hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-95 transition-all"
        >
          {isSubmitting ? "Menyimpan..." : editingKelas ? "Update Kelas" : "Simpan Kelas"}
        </button>
      </form>
    </div>
  </div>
)}  
    </div>
  );
}